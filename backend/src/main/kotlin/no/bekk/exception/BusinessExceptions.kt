package no.bekk.exception

/**
 * Base class for all business logic exceptions in the application
 */
sealed class BusinessException(
    message: String,
    cause: Throwable? = null,
) : Exception(message, cause)

/**
 * Authentication and authorization related exceptions
 */
class AuthenticationException(
    message: String,
    cause: Throwable? = null,
) : BusinessException(message, cause)

class AuthorizationException(
    message: String,
    cause: Throwable? = null,
) : BusinessException(message, cause)

/**
 * Resource not found exceptions
 */
class NotFoundException(
    message: String,
    cause: Throwable? = null,
) : BusinessException(message, cause)

/**
 * Bad request exceptions with detailed validation info
 */
class ValidationException(
    message: String,
    val field: String? = null,
    val value: String? = null,
    cause: Throwable? = null,
) : BusinessException(message, cause)

/**
 * Conflict exceptions (e.g., unique constraint violations)
 */
class ConflictException(
    message: String,
    cause: Throwable? = null,
) : BusinessException(message, cause)

/**
 * External service integration exceptions
 */
class ExternalServiceException(
    val service: String,
    message: String,
    val statusCode: Int? = null,
    cause: Throwable? = null,
) : BusinessException("$service: $message", cause)

/**
 * Database operation exceptions
 */
class DatabaseException(
    message: String,
    val operation: String? = null,
    cause: Throwable? = null,
) : BusinessException(message, cause)
