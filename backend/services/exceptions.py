class MoodMentorError(Exception):
    def __init__(self, code: str, message: str, details: str = None):
        self.code = code
        self.message = message
        self.details = details
        super().__init__(message)


class GeminiTimeoutError(MoodMentorError):
    def __init__(self, details: str = None):
        super().__init__(
            code="GEMINI_TIMEOUT",
            message="The Gemini API request timed out.",
            details=details or "The request exceeded the configured timeout."
        )


class GeminiAPIError(MoodMentorError):
    def __init__(self, details: str = None):
        super().__init__(
            code="GEMINI_API_ERROR",
            message="Failed to generate wisdom from Gemini API.",
            details=details
        )


class ValidationError(MoodMentorError):
    def __init__(self, message: str, details: str = None):
        super().__init__(
            code="VALIDATION_ERROR",
            message=message,
            details=details
        )


class ConfigurationError(MoodMentorError):
    def __init__(self, message: str, details: str = None):
        super().__init__(
            code="CONFIGURATION_ERROR",
            message=message,
            details=details
        )