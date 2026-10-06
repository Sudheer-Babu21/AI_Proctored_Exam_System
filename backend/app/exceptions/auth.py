from fastapi import HTTPException, status


class EmailAlreadyExistsException(HTTPException):

    def __init__(self):

        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered."
        )


class InvalidCredentialsException(HTTPException):

    def __init__(self):

        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )


class UserNotFoundException(HTTPException):

    def __init__(self):

        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )


class InactiveUserException(HTTPException):

    def __init__(self):

        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive."
        )

class EmailNotVerifiedException(HTTPException):

    def __init__(self):

        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in."
        )

from fastapi import HTTPException, status


class PermissionDeniedException(HTTPException):

    def __init__(self):

        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action."
        )