"""
Rate Limiter Module - Request rate limiting with sliding window.

Implements a sliding window rate limiter to prevent abuse.
"""

from __future__ import annotations

import time
from collections import defaultdict
from dataclasses import dataclass, field
from threading import Lock
from typing import TYPE_CHECKING

import structlog

if TYPE_CHECKING:
    from windows_mcp_server.config.settings import SecuritySettings

logger = structlog.get_logger(__name__)


@dataclass
class RateLimitState:
    """State for a single rate limit bucket."""

    requests: list[float] = field(default_factory=list)
    lock: Lock = field(default_factory=Lock)


class RateLimiter:
    """Sliding window rate limiter."""

    def __init__(self, settings: SecuritySettings) -> None:
        """Initialize the rate limiter.

        Args:
            settings: Security settings
        """
        self.max_requests = settings.rate_limit_requests
        self.window_seconds = settings.rate_limit_window
        self._buckets: dict[str, RateLimitState] = defaultdict(RateLimitState)

    def is_allowed(self, client_id: str) -> bool:
        """Check if a request is allowed for the client.

        Args:
            client_id: Client identifier

        Returns:
            True if request is allowed
        """
        now = time.time()
        state = self._buckets[client_id]

        with state.lock:
            # Remove expired timestamps
            cutoff = now - self.window_seconds
            state.requests = [ts for ts in state.requests if ts > cutoff]

            # Check if under limit
            if len(state.requests) >= self.max_requests:
                logger.warning(
                    "Rate limit exceeded",
                    client_id=client_id,
                    requests=len(state.requests),
                )
                return False

            # Add current request
            state.requests.append(now)
            return True

    def get_remaining(self, client_id: str) -> int:
        """Get remaining requests for a client.

        Args:
            client_id: Client identifier

        Returns:
            Number of remaining requests
        """
        now = time.time()
        state = self._buckets[client_id]

        with state.lock:
            cutoff = now - self.window_seconds
            current_requests = len([ts for ts in state.requests if ts > cutoff])
            return max(0, self.max_requests - current_requests)

    def get_reset_time(self, client_id: str) -> float:
        """Get time until rate limit resets.

        Args:
            client_id: Client identifier

        Returns:
            Seconds until oldest request expires
        """
        now = time.time()
        state = self._buckets[client_id]

        with state.lock:
            cutoff = now - self.window_seconds
            valid_requests = [ts for ts in state.requests if ts > cutoff]

            if not valid_requests:
                return 0

            oldest = min(valid_requests)
            return max(0, oldest + self.window_seconds - now)

    def reset(self, client_id: str) -> None:
        """Reset rate limit for a client.

        Args:
            client_id: Client identifier
        """
        state = self._buckets[client_id]
        with state.lock:
            state.requests.clear()
        logger.info("Rate limit reset", client_id=client_id)

    def reset_all(self) -> None:
        """Reset rate limits for all clients."""
        for client_id in list(self._buckets.keys()):
            self.reset(client_id)
        logger.info("All rate limits reset")
