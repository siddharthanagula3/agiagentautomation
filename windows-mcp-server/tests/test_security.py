"""Tests for security modules."""

import pytest
import time

from windows_mcp_server.config.settings import SecuritySettings
from windows_mcp_server.security.auth import Authenticator, AuthResult
from windows_mcp_server.security.sandbox import Sandbox, PathValidator
from windows_mcp_server.security.rate_limiter import RateLimiter


class TestAuthenticator:
    """Tests for authentication."""

    def test_auth_not_required(self) -> None:
        """Test that auth passes when not required."""
        settings = SecuritySettings(require_auth=False)
        auth = Authenticator(settings)

        result = auth.authenticate()
        assert result.authenticated is True
        assert result.client_id == "anonymous"

    def test_auth_required_no_credentials(self) -> None:
        """Test auth fails when required but no credentials."""
        settings = SecuritySettings(require_auth=True, api_key="test-key")
        auth = Authenticator(settings)

        result = auth.authenticate()
        assert result.authenticated is False
        assert "required" in result.error.lower()

    def test_auth_valid_api_key(self) -> None:
        """Test auth succeeds with valid API key."""
        settings = SecuritySettings(require_auth=True, api_key="test-key")
        auth = Authenticator(settings)

        result = auth.authenticate(api_key="test-key")
        assert result.authenticated is True

    def test_auth_invalid_api_key(self) -> None:
        """Test auth fails with invalid API key."""
        settings = SecuritySettings(require_auth=True, api_key="test-key")
        auth = Authenticator(settings)

        result = auth.authenticate(api_key="wrong-key")
        assert result.authenticated is False
        assert "invalid" in result.error.lower()

    def test_auth_bearer_token(self) -> None:
        """Test auth with bearer token."""
        settings = SecuritySettings(require_auth=True, api_key="test-key")
        auth = Authenticator(settings)

        result = auth.authenticate(bearer_token="Bearer test-key")
        assert result.authenticated is True

    def test_generate_api_key(self) -> None:
        """Test API key generation."""
        settings = SecuritySettings()
        auth = Authenticator(settings)

        key = auth.generate_api_key("test-client")
        assert key.startswith("wmcp_")
        assert len(key) > 20

        # Should be able to authenticate with generated key
        settings.require_auth = True
        result = auth.authenticate(api_key=key)
        assert result.authenticated is True
        assert result.client_id == "test-client"

    def test_remove_api_key(self) -> None:
        """Test removing an API key."""
        settings = SecuritySettings(require_auth=True)
        auth = Authenticator(settings)

        key = auth.generate_api_key("test-client")
        assert auth.remove_api_key(key) is True
        assert auth.remove_api_key("nonexistent") is False


class TestPathValidator:
    """Tests for path validation."""

    def test_normalize_path(self) -> None:
        """Test path normalization."""
        validator = PathValidator()
        path = validator.normalize("/tmp/test.txt")
        assert path.is_absolute()

    def test_path_traversal_blocked(self) -> None:
        """Test that path traversal is blocked."""
        validator = PathValidator()
        with pytest.raises(ValueError, match="traversal"):
            validator.normalize("/tmp/../etc/passwd")

    def test_allowed_paths(self) -> None:
        """Test allowlist functionality."""
        validator = PathValidator(
            allowed_paths=["/tmp", "/home/user"],
        )
        assert validator.is_allowed("/tmp/test.txt") is True
        assert validator.is_allowed("/etc/passwd") is False

    def test_blocked_paths(self) -> None:
        """Test blocklist functionality."""
        validator = PathValidator(
            blocked_paths=["/etc", "/root"],
        )
        assert validator.is_allowed("/etc/passwd") is False
        assert validator.is_allowed("/tmp/test.txt") is True

    def test_blocked_takes_precedence(self) -> None:
        """Test that blocked paths take precedence over allowed."""
        validator = PathValidator(
            allowed_paths=["/data"],
            blocked_paths=["/data/secret"],
        )
        assert validator.is_allowed("/data/public.txt") is True
        assert validator.is_allowed("/data/secret/key.pem") is False

    def test_validate_raises_on_denied(self) -> None:
        """Test that validate raises PermissionError."""
        validator = PathValidator(blocked_paths=["/secret"])
        with pytest.raises(PermissionError):
            validator.validate("/secret/data.txt")


class TestSandbox:
    """Tests for sandbox functionality."""

    def test_sandbox_disabled(self) -> None:
        """Test operations when sandbox is disabled."""
        settings = SecuritySettings(sandbox_mode=False)
        sandbox = Sandbox(settings)

        # Should not raise
        path = sandbox.check_file_access("/any/path", "write")
        assert path.is_absolute()

    def test_file_read_allowed(self) -> None:
        """Test file read in sandbox."""
        settings = SecuritySettings(
            sandbox_mode=True,
            blocked_paths=["/secret"],
        )
        sandbox = Sandbox(settings)

        # Should not raise
        sandbox.check_file_access("/tmp/test.txt", "read")

    def test_file_write_blocked_system(self) -> None:
        """Test write to system directories is blocked."""
        settings = SecuritySettings(sandbox_mode=True)
        sandbox = Sandbox(settings)

        with pytest.raises(PermissionError):
            sandbox.check_file_access("/secret/data", "write")

    def test_process_management_disabled(self) -> None:
        """Test process operations when disabled."""
        settings = SecuritySettings(allow_process_management=False)
        sandbox = Sandbox(settings)

        with pytest.raises(PermissionError, match="disabled"):
            sandbox.check_process_operation("start")

    def test_registry_access_disabled(self) -> None:
        """Test registry operations when disabled."""
        settings = SecuritySettings(allow_registry_access=False)
        sandbox = Sandbox(settings)

        with pytest.raises(PermissionError, match="disabled"):
            sandbox.check_registry_access("HKLM\\SOFTWARE")

    def test_registry_write_blocked(self) -> None:
        """Test that registry write is always blocked."""
        settings = SecuritySettings(allow_registry_access=True)
        sandbox = Sandbox(settings)

        with pytest.raises(PermissionError, match="read"):
            sandbox.check_registry_access("HKLM\\SOFTWARE", "write")

    def test_clipboard_disabled(self) -> None:
        """Test clipboard operations when disabled."""
        settings = SecuritySettings(allow_clipboard_access=False)
        sandbox = Sandbox(settings)

        with pytest.raises(PermissionError, match="disabled"):
            sandbox.check_clipboard_access("read")


class TestRateLimiter:
    """Tests for rate limiting."""

    def test_allows_under_limit(self) -> None:
        """Test requests are allowed under limit."""
        settings = SecuritySettings(rate_limit_requests=5, rate_limit_window=60)
        limiter = RateLimiter(settings)

        for _ in range(5):
            assert limiter.is_allowed("client1") is True

    def test_blocks_over_limit(self) -> None:
        """Test requests are blocked over limit."""
        settings = SecuritySettings(rate_limit_requests=3, rate_limit_window=60)
        limiter = RateLimiter(settings)

        for _ in range(3):
            limiter.is_allowed("client1")

        assert limiter.is_allowed("client1") is False

    def test_separate_clients(self) -> None:
        """Test rate limits are per-client."""
        settings = SecuritySettings(rate_limit_requests=2, rate_limit_window=60)
        limiter = RateLimiter(settings)

        assert limiter.is_allowed("client1") is True
        assert limiter.is_allowed("client1") is True
        assert limiter.is_allowed("client1") is False

        # Different client should still have quota
        assert limiter.is_allowed("client2") is True

    def test_get_remaining(self) -> None:
        """Test getting remaining requests."""
        settings = SecuritySettings(rate_limit_requests=5, rate_limit_window=60)
        limiter = RateLimiter(settings)

        assert limiter.get_remaining("client1") == 5

        limiter.is_allowed("client1")
        limiter.is_allowed("client1")

        assert limiter.get_remaining("client1") == 3

    def test_reset(self) -> None:
        """Test resetting a client's rate limit."""
        settings = SecuritySettings(rate_limit_requests=2, rate_limit_window=60)
        limiter = RateLimiter(settings)

        limiter.is_allowed("client1")
        limiter.is_allowed("client1")
        assert limiter.is_allowed("client1") is False

        limiter.reset("client1")
        assert limiter.is_allowed("client1") is True
