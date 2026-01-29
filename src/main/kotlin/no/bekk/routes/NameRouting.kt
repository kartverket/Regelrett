package no.bekk.routes

import io.ktor.http.HttpStatusCode
import io.ktor.server.plugins.BadRequestException
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.route
import kotlinx.serialization.json.Json
import no.bekk.authentication.AuthService
import no.bekk.database.*
import org.slf4j.LoggerFactory


fun Route.nameRouting(
    authService: AuthService,
    contextRepository: ContextRepository,
){
    val logger = LoggerFactory.getLogger("no.bekk.routes.NameRouting")

    route("/name") {

            get("/{name}") {
                val functionName = call.parameters["name"] ?: throw BadRequestException("Missing name")
                logger.info("Received GET /contexts with function $functionName")
                val contexts = contextRepository.getContextsByName(functionName)
                for (context in contexts) {
                    if (!authService.hasContextAccess(call, context.id)) {
                        call.respond(HttpStatusCode.Forbidden)
                        return@get
                    }
                }
                call.respond(HttpStatusCode.OK, Json.encodeToString(contexts))
                return@get
            }

    }
}