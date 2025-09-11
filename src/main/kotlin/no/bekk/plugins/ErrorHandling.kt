package no.bekk.plugins

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import kotlinx.serialization.Serializable
import no.bekk.exception.*
import no.bekk.util.RequestContext.getRequestInfo
import org.slf4j.LoggerFactory

/**
 * Standard error response format
 */
@Serializable
data class ErrorResponse(
    val error: String,
    val message: String,
    val correlationId: String? = null,
    val field: String? = null,
    val details: Map<String, String>? = null,
)

/**
 * Configure enhanced logging for the application.
 * For now, we'll handle exceptions in individual routes until StatusPages is available.
 */
fun Application.configureErrorHandling() {
    val logger = LoggerFactory.getLogger("no.bekk.plugins.ErrorHandling")
    // Enhanced logging is already configured via RequestLoggingPlugin
    // Exception handling will be done in individual routes for now
    logger.info("Error handling configuration completed - using route-level exception handling")
}

/**
 * Utility functions for consistent error handling across routes
 */
object ErrorHandlers {
    private val logger = LoggerFactory.getLogger("no.bekk.plugins.ErrorHandlers")

    suspend fun handleAuthenticationException(call: ApplicationCall, cause: AuthenticationException) {
        logger.warn("${call.getRequestInfo()} Authentication failed: ${cause.message}", cause)
        call.respond(
            HttpStatusCode.Unauthorized,
            ErrorResponse(
                error = "authentication_failed",
                message = cause.message ?: "Authentication failed",
                correlationId = call.request.headers["X-Correlation-ID"],
            ),
        )
    }

    suspend fun handleAuthorizationException(call: ApplicationCall, cause: AuthorizationException) {
        logger.warn("${call.getRequestInfo()} Authorization failed: ${cause.message}")
        call.respond(
            HttpStatusCode.Forbidden,
            ErrorResponse(
                error = "authorization_failed",
                message = cause.message ?: "Access denied",
                correlationId = call.request.headers["X-Correlation-ID"],
            ),
        )
    }

    suspend fun handleNotFoundException(call: ApplicationCall, cause: NotFoundException) {
        logger.info("${call.getRequestInfo()} Resource not found: ${cause.message}")
        call.respond(
            HttpStatusCode.NotFound,
            ErrorResponse(
                error = "resource_not_found",
                message = cause.message ?: "Resource not found",
                correlationId = call.request.headers["X-Correlation-ID"],
            ),
        )
    }

    suspend fun handleValidationException(call: ApplicationCall, cause: ValidationException) {
        logger.info("${call.getRequestInfo()} Validation failed: ${cause.message} (field: ${cause.field}, value: ${cause.value})")
        call.respond(
            HttpStatusCode.BadRequest,
            ErrorResponse(
                error = "validation_failed",
                message = cause.message ?: "Invalid input",
                field = cause.field,
                correlationId = call.request.headers["X-Correlation-ID"],
            ),
        )
    }

    suspend fun handleConflictException(call: ApplicationCall, cause: ConflictException) {
        logger.info("${call.getRequestInfo()} Conflict: ${cause.message}")
        call.respond(
            HttpStatusCode.Conflict,
            ErrorResponse(
                error = "conflict",
                message = cause.message ?: "Resource conflict",
                correlationId = call.request.headers["X-Correlation-ID"],
            ),
        )
    }

    suspend fun handleDatabaseException(call: ApplicationCall, cause: DatabaseException) {
        logger.error("${call.getRequestInfo()} Database error: ${cause.message} (operation: ${cause.operation})", cause)
        call.respond(
            HttpStatusCode.InternalServerError,
            ErrorResponse(
                error = "database_error",
                message = "Internal server error",
                correlationId = call.request.headers["X-Correlation-ID"],
            ),
        )
    }

    suspend fun handleGenericException(call: ApplicationCall, cause: Exception) {
        logger.error("${call.getRequestInfo()} Unhandled exception: ${cause.message}", cause)
        call.respond(
            HttpStatusCode.InternalServerError,
            ErrorResponse(
                error = "internal_error",
                message = "An unexpected error occurred",
                correlationId = call.request.headers["X-Correlation-ID"],
            ),
        )
    }
}
