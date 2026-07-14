package no.bekk.routes

import io.ktor.http.HttpStatusCode
import io.ktor.server.plugins.BadRequestException
import io.ktor.server.request.receiveText
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.patch
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import kotlinx.serialization.json.Json
import no.bekk.authentication.AuthService
import no.bekk.database.DatabaseReadGrantRequest
import no.bekk.database.ReadGrantRepository
import no.bekk.exception.ConflictException
import no.bekk.plugins.ErrorHandlers
import org.slf4j.LoggerFactory

fun Route.readGrantRouting(authService: AuthService, readGrantRepository: ReadGrantRepository) {
    val logger = LoggerFactory.getLogger("no.bekk.routes.ReadGrantRouting")

    route("/readGrants") {
        get {
            logger.info("Received get /readGrants for user with id: ${call.parameters["userId"]}")
            val userId = call.request.queryParameters["userId"] ?: throw BadRequestException("Missing userId parameter")

            val usersReadGrants = readGrantRepository.getReadGrantsByUserId(userId)
            call.respond(HttpStatusCode.OK, Json.encodeToString(usersReadGrants))
            return@get
        }

        route("/{contextId}") {
            get {
                logger.info("Received GET /readGrants/contextId with id: ${call.parameters["contextId"]}")
                val contextId = call.parameters["contextId"] ?: throw BadRequestException("Missing contextId")

                if (!authService.hasWriteContextAccess(call, contextId) && !authService.hasReadContextAccess(call, contextId)) {
                    call.respond(HttpStatusCode.Forbidden)
                    return@get
                }
                val context = readGrantRepository.getReadGrantsByContext(contextId)
                call.respond(HttpStatusCode.OK, Json.encodeToString(context))
                return@get
            }
            post {
                try {
                    val contextId = call.parameters["contextId"] ?: throw BadRequestException("Missing contextId")

                    val grantReadAccessRequestJson = call.receiveText()
                    logger.info("Received POST /readGrants/contextId request with body: $grantReadAccessRequestJson")
                    val grantReadAccessRequest = Json.decodeFromString<DatabaseReadGrantRequest>(grantReadAccessRequestJson)

                    if (!authService.hasWriteContextAccess(call, contextId)) {
                        call.respond(HttpStatusCode.Forbidden)
                        return@post
                    }

                    val readGrant = readGrantRepository.insertReadGrantOnContext(contextId, grantReadAccessRequest)

                    call.respond(HttpStatusCode.Created, Json.encodeToString(readGrant))
                    return@post
                } catch (e: ConflictException) {
                    ErrorHandlers.handleConflictException(call, e)
                } catch (e: Exception) {
                    logger.error("Unexpected error when processing POST /readGrants/{contextId}", e)
                    call.respond(HttpStatusCode.InternalServerError, "An unexpected error occurred.")
                }
            }

patch("/{readGrantId}/expiry") {
    try {
        logger.info("Received PATCH /readGrants/{contextId}/{readGrantId}/expiry with readGrantId: ${call.parameters[\"readGrantId\"]}")
        val contextId = call.parameters["contextId"] ?: throw BadRequestException("Missing contextId")
        val readGrantId = call.parameters["readGrantId"] ?: throw BadRequestException("Missing readGrantId")

        if (!authService.hasWriteContextAccess(call, contextId)) {
            call.respond(HttpStatusCode.Forbidden)
            return@patch
        }

        val revoked = readGrantRepository.revokeReadGrantOnContext(readGrantId, contextId)
        if (!revoked) {
            call.respond(HttpStatusCode.NotFound)
            return@patch
        }

        call.respond(HttpStatusCode.NoContent)
        return@patch
    } catch (e: BadRequestException) {
        logger.error("Bad request: ${e.message}", e)
        call.respond(HttpStatusCode.BadRequest, e.message ?: "Bad request")
    } catch (e: Exception) {
        logger.error("Unexpected error when processing PATCH /readGrants/{contextId}/{readGrantId}/expiry", e)
        call.respond(HttpStatusCode.InternalServerError, "An unexpected error occurred.")
    }
}
        }
    }
}
