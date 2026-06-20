"""Secret redaction helpers — M0 placeholder."""

REDACTED = "***"


def redact(value: str | None) -> str:
    if not value:
        return ""
    if len(value) <= 4:
        return REDACTED
    return value[:2] + REDACTED + value[-2:]
