package no.bekk.routes

import io.ktor.http.*
import io.ktor.server.plugins.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.json.Json
import no.bekk.authentication.AuthService
import no.bekk.database.CommentRepository
import no.bekk.database.DatabaseComment
import no.bekk.database.DatabaseCommentRequest
import no.bekk.exception.ValidationException
import no.bekk.plugins.ErrorHandlers
import no.bekk.util.RequestContext.getRequestInfo
import org.slf4j.LoggerFactory

fun Route.commentRouting(authService: AuthService, commentRepository: CommentRepository) {
    val logger = LoggerFactory.getLogger("no.bekk.routes.CommentRouting")

    post("/comments") {
        try {
            val commentRequestJson = call.receiveText()
            logger.info("${call.getRequestInfo()} Received POST /comments with request body")

            val databaseCommentRequest = try {
                Json.decodeFromString<DatabaseCommentRequest>(commentRequestJson)
            } catch (e: Exception) {
                logger.warn("${call.getRequestInfo()} Invalid JSON format: ${e.message}")
                throw ValidationException("Invalid JSON format", cause = e)
            }

            if (databaseCommentRequest.contextId == null) {
                logger.warn("${call.getRequestInfo()} Missing contextId in request")
                throw ValidationException("contextId is required", field = "contextId")
            }

            if (!authService.hasContextAccess(call, databaseCommentRequest.contextId)) {
                logger.warn("${call.getRequestInfo()} Access denied to context: ${databaseCommentRequest.contextId}")
                call.respond(HttpStatusCode.Forbidden)
                return@post
            }

            val insertedComment = commentRepository.insertCommentOnContext(databaseCommentRequest)
            logger.info("${call.getRequestInfo()} Successfully inserted comment for context: ${databaseCommentRequest.contextId}")
            call.respond(HttpStatusCode.OK, Json.encodeToString(insertedComment))
        } catch (e: ValidationException) {
            ErrorHandlers.handleValidationException(call, e)
        } catch (e: Exception) {
            logger.error("${call.getRequestInfo()} Unexpected error in POST /comments", e)
            ErrorHandlers.handleGenericException(call, e)
        }
    }

    get("/comments") {
        try {
            val recordId = call.request.queryParameters["recordId"]
            val contextId = call.request.queryParameters["contextId"]
            logger.info("${call.getRequestInfo()} Received GET /comments with contextId: $contextId, recordId: $recordId")

            if (contextId == null) {
                logger.warn("${call.getRequestInfo()} Missing contextId parameter")
                throw ValidationException("contextId parameter is required", field = "contextId")
            }

            if (!authService.hasContextAccess(call, contextId) && !authService.hasReadContextAccess(call, contextId)) {
                logger.warn("${call.getRequestInfo()} Access denied to context: $contextId")
                call.respond(HttpStatusCode.Forbidden)
                return@get
            }

            val databaseComments: List<DatabaseComment>
            if (recordId != null) {
                databaseComments = commentRepository.getCommentsByContextAndRecordIdFromDatabase(contextId, recordId)
                logger.debug("${call.getRequestInfo()} Retrieved ${databaseComments.size} comments for context: $contextId, record: $recordId")
            } else {
                databaseComments = commentRepository.getCommentsByContextIdFromDatabase(contextId)
                logger.debug("${call.getRequestInfo()} Retrieved ${databaseComments.size} comments for context: $contextId")
            }

            val commentsJson = Json.encodeToString(databaseComments)
            call.respondText(commentsJson, contentType = ContentType.Application.Json)
        } catch (e: ValidationException) {
            ErrorHandlers.handleValidationException(call, e)
        } catch (e: Exception) {
            logger.error("${call.getRequestInfo()} Unexpected error in GET /comments", e)
            ErrorHandlers.handleGenericException(call, e)
        }
    }

    delete("/comments") {
        try {
            val recordId = call.request.queryParameters["recordId"]
            val contextId = call.request.queryParameters["contextId"]
            logger.info("${call.getRequestInfo()} Received DELETE /comments with contextId: $contextId, recordId: $recordId")

            if (contextId == null) {
                logger.warn("${call.getRequestInfo()} Missing contextId parameter")
                throw ValidationException("contextId parameter is required", field = "contextId")
            }

            if (recordId == null) {
                logger.warn("${call.getRequestInfo()} Missing recordId parameter")
                throw ValidationException("recordId parameter is required", field = "recordId")
            }

            if (!authService.hasContextAccess(call, contextId)) {
                logger.warn("${call.getRequestInfo()} Access denied to context: $contextId")
                call.respond(HttpStatusCode.Forbidden)
                return@delete
            }

            val success = commentRepository.deleteCommentFromDatabase(contextId, recordId)
            if (success) {
                logger.info("${call.getRequestInfo()} Successfully deleted comment for context: $contextId, record: $recordId")
                call.respondText("Comment was successfully deleted.")
            } else {
                logger.info("${call.getRequestInfo()} Comment not found for context: $contextId, record: $recordId")
                call.respond(HttpStatusCode.NotFound, "Comment not found")
            }
        } catch (e: ValidationException) {
            ErrorHandlers.handleValidationException(call, e)
        } catch (e: BadRequestException) {
            logger.warn("${call.getRequestInfo()} Bad request: ${e.message}")
            ErrorHandlers.handleValidationException(call, ValidationException(e.message ?: "Bad request"))
        } catch (e: Exception) {
            logger.error("${call.getRequestInfo()} Unexpected error in DELETE /comments", e)
            ErrorHandlers.handleGenericException(call, e)
        }
    }
}
