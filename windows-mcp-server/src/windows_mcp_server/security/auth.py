"""
Authentication Module - API key and token-based authentication.

Supports:
- API key authentication (header or query param)
- Bearer token authentication
- HMAC-based request signing
"""

from __future__ import annotations

import hashlib
import hmac
import secrets
import time
from dataclasses import dataclass
from typing import TYPE_CHECKING

import structlog

if TYPE_CHECKING:
    from windows_mcp_server.config.settings import SecuritySettings

logger = structlog.get_logger(__name__)


@dataclass
class AuthResult:
    """Result of an authentication attempt."""

    authenticated: bool
    client_id: str | None = None
    error: str | None = None
    metadata: dict[str, str] | None = None


class Authenticator:
    """Handles authentication for MCP requests."""

    def __init__(self, settings: SecuritySettings) -> None:
        """Initialize the authenticator.

        Args:
            settings: Security settings
        """
        self.settings = settings
        self._api_keys: dict[str, str] = {}  # key -> client_id mapping

        # Add configured API key if provided
        if settings.api_key:
            self._api_keys[settings.api_key] = "default"

    def add_api_key(self, key: str, client_id: str) -> None:
        """Add an API key for a client.

        Args:
            key: The API key
            client_id: Client identifier
        """
        self._api_keys[key] = client_id
        logger.info("Added API key", client_id=client_id)

    def remove_api_key(self, key: str) -> bool:
        """Remove an API key.

        Args:
            key: The API key to remove

        Returns:
            True if key was found and removed
        """
        if key in self._api_keys:
            client_id = self._api_keys.pop(key)
            logger.info("Removed API key", client_id=client_id)
            return True
        return False

    def generate_api_key(self, client_id: str) -> str:
        """Generate a new API key for a client.

        Args:
            client_id: Client identifier

        Returns:
            The generated API key
        """
        key = f"wmcp_{secrets.token_urlsafe(32)}"
        self._api_keys[key] = client_id
        logger.info("Generated API key", client_id=client_id)
        return key

    def authenticate(
        self,
        api_key: str | None = None,
        bearer_token: str | None = None,
    ) -> AuthResult:
        """Authenticate a request.

        Args:
            api_key: API key from header or query
            bearer_token: Bearer token from Authorization header

        Returns:
            Authentication result
        """
        # If auth is not required, always succeed
        if not self.settings.require_auth:
            return AuthResult(authenticated=True, client_id="anonymous")

        # Try API key authentication
        if api_key:
            if api_key in self._api_keys:
                client_id = self._api_keys[api_key]
                logger.debug("Authenticated via API key", client_id=client_id)
                return AuthResult(authenticated=True, client_id=client_id)
            else:
                logger.warning("Invalid API key attempted")
                return AuthResult(authenticated=False, error="Invalid API key")

        # Try bearer token authentication
        if bearer_token:
            # For bearer tokens, we expect the format to be the API key
            if bearer_token.startswith("Bearer "):
                token = bearer_token[7:]
            else:
                token = bearer_token

            if token in self._api_keys:
                client_id = self._api_keys[token]
                logger.debug("Authenticated via bearer token", client_id=client_id)
                return AuthResult(authenticated=True, client_id=client_id)
            else:
                logger.warning("Invalid bearer token attempted")
                return AuthResult(authenticated=False, error="Invalid bearer token")

        # No credentials provided
        logger.warning("No authentication credentials provided")
        return AuthResult(authenticated=False, error="Authentication required")

    def verify_signature(
        self,
        method: str,
        path: str,
        body: bytes,
        timestamp: str,
        signature: str,
        secret_key: str,
    ) -> bool:
        """Verify an HMAC request signature.

        Args:
            method: HTTP method
            path: Request path
            body: Request body
            timestamp: Request timestamp
            signature: Provided signature
            secret_key: Secret key for HMAC

        Returns:
            True if signature is valid
        """
        # Check timestamp is recent (within 5 minutes)
        try:
            ts = int(timestamp)
            if abs(time.time() - ts) > 300:
                logger.warning("Request timestamp too old", timestamp=timestamp)
                return False
        except ValueError:
            logger.warning("Invalid timestamp format", timestamp=timestamp)
            return False

        # Build message to sign
        message = f"{method}\n{path}\n{timestamp}\n".encode() + body

        # Calculate expected signature
        expected = hmac.new(
            secret_key.encode(),
            message,
            hashlib.sha256,
        ).hexdigest()

        # Constant-time comparison
        if hmac.compare_digest(signature, expected):
            return True

        logger.warning("Invalid request signature")
        return False
