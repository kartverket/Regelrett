package no.bekk.routes

import io.ktor.http.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.json.Json
import no.bekk.authentication.AuthService
import no.bekk.database.AnswerRepository
import no.bekk.database.DatabaseAnswer
import no.bekk.database.DatabaseAnswerRequest
import no.bekk.exception.ValidationException
import no.bekk.plugins.ErrorHandlers
import no.bekk.util.RequestContext.getRequestInfo
import org.slf4j.LoggerFactory

fun Route.answerRouting(authService: AuthService, answerRepository: AnswerRepository) {
    val logger = LoggerFactory.getLogger("no.bekk.routes.AnswerRouting")

    post("/answer") {
        try {
            val answerRequestJson = call.receiveText()
            logger.info("${call.getRequestInfo()} Received POST /answer request")

            val answerRequest = try {
                Json.decodeFromString<DatabaseAnswerRequest>(answerRequestJson)
            } catch (e: Exception) {
                logger.warn("${call.getRequestInfo()} Invalid JSON format: ${e.message}")
                throw ValidationException("Invalid JSON format", cause = e)
            }

            if (answerRequest.contextId == null) {
                logger.warn("${call.getRequestInfo()} Missing contextId in request")
                throw ValidationException("contextId is required", field = "contextId")
            }

            if (!authService.hasContextAccess(call, answerRequest.contextId)) {
                logger.warn("${call.getRequestInfo()} Access denied to context: ${answerRequest.contextId}")
                call.respond(HttpStatusCode.Forbidden)
                return@post
            }

            val insertedAnswer = answerRepository.insertAnswerOnContext(answerRequest)
            logger.info("${call.getRequestInfo()} Successfully inserted answer for context: ${answerRequest.contextId}")
            call.respond(HttpStatusCode.OK, Json.encodeToString(insertedAnswer))
        } catch (e: ValidationException) {
            ErrorHandlers.handleValidationException(call, e)
        } catch (e: Exception) {
            logger.error("${call.getRequestInfo()} Unexpected error in POST /answer", e)
            ErrorHandlers.handleGenericException(call, e)
        }
    }

    get("/answers") {
        try {
            val recordId = call.request.queryParameters["recordId"]
            val contextId = call.request.queryParameters["contextId"]
            logger.info("${call.getRequestInfo()} Received GET /answers with contextId: $contextId, recordId: $recordId")

            if (contextId == null) {
                logger.warn("${call.getRequestInfo()} Missing contextId parameter")
                throw ValidationException("contextId parameter is required", field = "contextId")
            }

            if (!authService.hasContextAccess(call, contextId) && !authService.hasReadContextAccess(call, contextId)) {
                logger.warn("${call.getRequestInfo()} Access denied to context: $contextId")
                call.respond(HttpStatusCode.Forbidden)
                return@get
            }

            val answers: List<DatabaseAnswer>
            if (recordId != null) {
                answers = answerRepository.getAnswersByContextAndRecordIdFromDatabase(contextId, recordId)
                logger.debug("${call.getRequestInfo()} Retrieved ${answers.size} answers for context: $contextId, record: $recordId")
            } else {
                answers = answerRepository.getLatestAnswersByContextIdFromDatabase(contextId)
                logger.debug("${call.getRequestInfo()} Retrieved ${answers.size} latest answers for context: $contextId")
            }

            val answersJson = Json.encodeToString(answers)
            call.respondText(answersJson, contentType = ContentType.Application.Json)
        } catch (e: ValidationException) {
            ErrorHandlers.handleValidationException(call, e)
        } catch (e: Exception) {
            logger.error("${call.getRequestInfo()} Unexpected error in GET /answers", e)
            ErrorHandlers.handleGenericException(call, e)
        }
    }
}
