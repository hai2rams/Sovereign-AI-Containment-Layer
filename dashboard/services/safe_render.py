"""Safe rendering wrappers — M0 placeholder."""

from components.redaction import redact


def safe_text(value: str | None) -> str:
    return redact(value)
