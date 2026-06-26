import logging
import os
import sys
from typing import Any

DEFAULT_FORMAT = "%(asctime)s %(levelname)s %(name)s %(message)s"
JSON_FORMAT = '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s"}'

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_FORMAT = os.getenv("LOG_FORMAT", "text").lower()


def configure_logging() -> logging.Logger:
    level = getattr(logging, LOG_LEVEL, logging.INFO)
    
    if LOG_FORMAT == "json":
        fmt = JSON_FORMAT
    else:
        fmt = DEFAULT_FORMAT

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(fmt, datefmt="%Y-%m-%dT%H:%M:%S"))

    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.handlers = [handler]

    logger = logging.getLogger("moodmentor")
    logger.setLevel(level)

    logging.getLogger("uvicorn").setLevel(level)
    logging.getLogger("uvicorn.access").setLevel(level)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

    return logger


def get_logger(name: str = "moodmentor") -> logging.Logger:
    return logging.getLogger(name)