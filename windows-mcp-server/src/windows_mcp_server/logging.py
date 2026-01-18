"""
Logging Configuration - Structured logging with structlog.

Provides:
- JSON and console output formats
- File logging with rotation
- Request ID context
"""

from __future__ import annotations

import logging
import sys
from logging.handlers import RotatingFileHandler
from typing import TYPE_CHECKING

import structlog
from structlog.types import Processor

if TYPE_CHECKING:
    from windows_mcp_server.config.settings import LoggingSettings


def setup_logging(settings: LoggingSettings) -> None:
    """Configure logging for the application.

    Args:
        settings: Logging configuration settings
    """
    # Convert log level
    log_level = getattr(logging, settings.level.value.upper(), logging.INFO)

    # Configure processors
    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
    ]

    if settings.format == "json":
        # JSON format for production
        structlog.configure(
            processors=shared_processors
            + [
                structlog.processors.format_exc_info,
                structlog.processors.JSONRenderer(),
            ],
            wrapper_class=structlog.make_filtering_bound_logger(log_level),
            context_class=dict,
            logger_factory=structlog.PrintLoggerFactory(),
            cache_logger_on_first_use=True,
        )
    else:
        # Console format for development
        structlog.configure(
            processors=shared_processors
            + [
                structlog.processors.ExceptionPrettyPrinter(),
                structlog.dev.ConsoleRenderer(colors=True),
            ],
            wrapper_class=structlog.make_filtering_bound_logger(log_level),
            context_class=dict,
            logger_factory=structlog.PrintLoggerFactory(),
            cache_logger_on_first_use=True,
        )

    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )

    # Add file handler if configured
    if settings.file:
        file_handler = RotatingFileHandler(
            settings.file,
            maxBytes=settings.max_file_size,
            backupCount=settings.backup_count,
        )
        file_handler.setLevel(log_level)

        # Use JSON format for file logging
        file_handler.setFormatter(logging.Formatter("%(message)s"))
        logging.getLogger().addHandler(file_handler)

    # Reduce noise from third-party libraries
    logging.getLogger("asyncio").setLevel(logging.WARNING)
    logging.getLogger("aiohttp").setLevel(logging.WARNING)


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Get a logger instance.

    Args:
        name: Logger name (typically __name__)

    Returns:
        Configured logger
    """
    return structlog.get_logger(name)
