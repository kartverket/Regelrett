package no.bekk.authentication

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.response.*
import io.ktor.server.sessions.*
import no.bekk.configuration.OAuthConfig
import no.bekk.database.ContextRepository
import no.bekk.domain.MicrosoftGraphGroup
import no.bekk.domain.MicrosoftGraphUser
import no.bekk.services.MicrosoftService
import org.slf4j.LoggerFactory

interface AuthService {
    suspend fun getGroupsOrEmptyList(call: ApplicationCall): List<MicrosoftGraphGroup>

    suspend fun getCurrentUser(call: ApplicationCall): MicrosoftGraphUser

    suspend fun getUserByUserId(call: ApplicationCall, userId: String): MicrosoftGraphUser

    suspend fun hasTeamAccess(call: ApplicationCall, teamId: String?): Boolean

    suspend fun hasContextAccess(call: ApplicationCall, contextId: String): Boolean

    suspend fun hasSuperUserAccess(call: ApplicationCall): Boolean

    suspend fun getTeamIdFromName(call: ApplicationCall, teamName: String): String?
}

class AuthServiceImpl(
    private val microsoftService: MicrosoftService,
    private val contextRepository: ContextRepository,
    private val oAuthConfig: OAuthConfig,
) : AuthService {
    private val logger = LoggerFactory.getLogger(AuthServiceImpl::class.java)
    override suspend fun getGroupsOrEmptyList(call: ApplicationCall): List<MicrosoftGraphGroup> {
        val groupsClaim = call.principal<JWTPrincipal>()?.payload?.getClaim("groups")
        val groups = groupsClaim?.asArray(String::class.java)

        val jwtToken =
            call.request.headers["Authorization"]?.removePrefix("Bearer ")
                ?: throw IllegalStateException("Authorization header missing")
        val oboToken = microsoftService.requestTokenOnBehalfOf(jwtToken)


        val groupNames = groups?.map { group ->
            microsoftService.fetchGroupName(oboToken, group)
        }

        return groupNames ?: emptyList()
    }

    override suspend fun getCurrentUser(call: ApplicationCall): MicrosoftGraphUser {
        val jwtToken =
            call.request.headers["Authorization"]?.removePrefix("Bearer ")
                ?: throw IllegalStateException("Authorization header missing")

        val oboToken = microsoftService.requestTokenOnBehalfOf(jwtToken)

        return microsoftService.fetchCurrentUser(oboToken)
    }

    override suspend fun getUserByUserId(call: ApplicationCall, userId: String): MicrosoftGraphUser {
        val jwtToken =
            call.request.headers["Authorization"]?.removePrefix("Bearer ")
                ?: throw IllegalStateException("Authorization header missing")

        val oboToken = microsoftService.requestTokenOnBehalfOf(jwtToken)

        return microsoftService.fetchUserByUserId(oboToken, userId)
    }

    override suspend fun hasTeamAccess(call: ApplicationCall, teamId: String?): Boolean {
        if (teamId == null || teamId == "") {
            logger.debug("Team access denied - teamId is null or empty")
            return false
        }

        val groupsClaim = call.principal<JWTPrincipal>()?.payload?.getClaim("groups")
        val groups = groupsClaim?.asArray(String::class.java)

        if (groups == null || groups.isEmpty()) {
            logger.debug("Team access denied for teamId: $teamId - No groups found in JWT token")
            return false
        }

        val hasAccess = teamId in groups
        if (hasAccess) {
            logger.debug("Team access granted for teamId: $teamId")
        } else {
            logger.debug("Team access denied for teamId: $teamId - Team not in user's groups: ${groups.contentToString()}")
        }

        return hasAccess
    }

    override suspend fun hasContextAccess(
        call: ApplicationCall,
        contextId: String,
    ): Boolean = try {
        val context = contextRepository.getContext(contextId)
        val hasAccess = hasTeamAccess(call, context.teamId)
        if (hasAccess) {
            logger.debug("Context access granted for contextId: $contextId (teamId: ${context.teamId})")
        } else {
            logger.debug("Context access denied for contextId: $contextId (teamId: ${context.teamId})")
        }
        hasAccess
    } catch (e: Exception) {
        logger.warn("Context access check failed for contextId: $contextId - ${e.message}")
        false
    }

    override suspend fun hasSuperUserAccess(
        call: ApplicationCall,
    ): Boolean = hasTeamAccess(call, oAuthConfig.superUserGroup)

    override suspend fun getTeamIdFromName(call: ApplicationCall, teamName: String): String? {
        val microsoftGroups = getGroupsOrEmptyList(call)

        return microsoftGroups.find { it.displayName == teamName }?.id
    }
}
