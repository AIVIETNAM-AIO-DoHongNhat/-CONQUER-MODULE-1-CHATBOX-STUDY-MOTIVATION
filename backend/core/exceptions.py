from rest_framework.exceptions import APIException


class BaseAPIException(APIException):
    """Base exception that returns a custom message and HTTP status code."""

    status_code = 400
    default_detail = "Bad request."

    def __init__(self, message: str, status_code: int | None = None):
        if status_code is not None:
            self.status_code = status_code
        super().__init__(detail=message or self.default_detail)

class NotFoundException(BaseAPIException):
    status_code = 404
    default_detail = "Not found."

class UnauthorizedException(BaseAPIException):
    status_code = 401
    default_detail = "Unauthorized."

class InternalServerErrorException(BaseAPIException):
    status_code = 500
    default_detail = "Internal server error."

class ForbiddenException(BaseAPIException):
    status_code = 403
    default_detail = "Forbidden."
