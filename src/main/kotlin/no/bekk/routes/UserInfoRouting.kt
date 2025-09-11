package no.bekk.routes

import io.ktor.http.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.withContext
import no.bekk.authentication.AuthService
import no.bekk.domain.UserInfoResponse
import no.bekk.exception.ValidationException
import no.bekk.plugins.ErrorHandlers
import no.bekk.util.RequestContext.getRequestInfo
import org.slf4j.LoggerFactory

fun Route.userInfoRouting(authService: AuthService) {
    val logger = LoggerFactory.getLogger("no.bekk.routes.UserInfoRouting")
    route("/userinfo") {
        get {
            try {
                logger.debug("${call.getRequestInfo()} Received GET /userinfo")
                withContext(Dispatchers.Default) {
                    val groups = async { authService.getGroupsOrEmptyList(call) }
                    val user = async { authService.getCurrentUser(call) }
                    val superuser = async { authService.hasSuperUserAccess(call) }

                    call.respond(HttpStatusCode.OK, UserInfoResponse(groups.await(), user.await(), superuser.await()))
                }
            } catch (e: Exception) {
                logger.error("${call.getRequestInfo()} Error fetching user info", e)
                ErrorHandlers.handleGenericException(call, e)
            }
        }

        get("/{userId}/username") {
            try {
                val userId = call.parameters["userId"]
                logger.info("${call.getRequestInfo()} Received GET /userinfo/userId/username with id $userId")

                if (userId == null) {
                    logger.warn("${call.getRequestInfo()} Missing userId parameter")
                    throw ValidationException("userId parameter is required", field = "userId")
                }

                val username = authService.getUserByUserId(call, userId).displayName
                logger.info("${call.getRequestInfo()} Successfully retrieved username for userId: $userId")
                call.respond(HttpStatusCode.OK, username)
            } catch (e: ValidationException) {
                ErrorHandlers.handleValidationException(call, e)
            } catch (e: Exception) {
                logger.error("${call.getRequestInfo()} Error retrieving username for userId: ${call.parameters["userId"]}", e)
                ErrorHandlers.handleGenericException(call, e)
            }
        }
    }
}
