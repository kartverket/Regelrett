package no.bekk.authentication
import io.ktor.server.application.*
import no.bekk.configuration.OAuthConfig
import no.bekk.database.ContextRepository
import no.bekk.database.SharesRepository
import no.bekk.domain.MicrosoftGraphGroup
import no.bekk.domain.MicrosoftGraphUser
import no.bekk.services.MicrosoftService
import org.slf4j.LoggerFactory

interface AuthService {
    suspend fun getGroupsOrEmptyList(call: ApplicationCall, filter: String? = null): List<MicrosoftGraphGroup>

    suspend fun getCurrentUser(call: ApplicationCall): MicrosoftGraphUser

    suspend fun getUserByUserId(call: ApplicationCall, userId: String): MicrosoftGraphUser

    suspend fun searchUsers(call: ApplicationCall, usernameQuery: String, limit: Int = 10): List<MicrosoftGraphUser>

    suspend fun hasTeamAccess(call: ApplicationCall, teamId: String?): Boolean

    suspend fun hasContextAccess(call: ApplicationCall, contextId: String): Boolean

    suspend fun hasWriteContextAccess(call: ApplicationCall, contextId: String): Boolean

    suspend fun hasReadContextAccess(call: ApplicationCall, contextId: String): Boolean

    suspend fun hasSuperUserAccess(call: ApplicationCall): Boolean

    suspend fun hasReportingUserAccess(call: ApplicationCall): Boolean

    suspend fun getTeamIdFromName(call: ApplicationCall, teamName: String): String?
}

class AuthServiceImpl(
    private val microsoftService: MicrosoftService,
    private val contextRepository: ContextRepository,
    private val sharesRepository: SharesRepository,
    private val oAuthConfig: OAuthConfig,
) : AuthService {
    private val logger = LoggerFactory.getLogger(AuthServiceImpl::class.java)
    override suspend fun getGroupsOrEmptyList(call: ApplicationCall, filter: String?): List<MicrosoftGraphGroup> {
        val jwtToken =
            call.request.headers["Authorization"]?.removePrefix("Bearer ")
                ?: throw IllegalStateException("Authorization header missing")
        val oboToken = microsoftService.requestTokenOnBehalfOf(jwtToken)

        return microsoftService.fetchGroups(oboToken, filter)
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

    override suspend fun searchUsers(call: ApplicationCall, usernameQuery: String, limit: Int): List<MicrosoftGraphUser> {
        val jwtToken =
            call.request.headers["Authorization"]?.removePrefix("Bearer ")
                ?: throw IllegalStateException("Authorization header missing")

        val oboToken = microsoftService.requestTokenOnBehalfOf(jwtToken)

        return microsoftService.searchUsersbyName(oboToken, usernameQuery, limit)
    }

    override suspend fun hasTeamAccess(call: ApplicationCall, teamId: String?): Boolean {
        if (teamId == null || teamId == "") {
            logger.debug("Team access denied - teamId is null or empty")
            return false
        }

        val groups = getGroupsOrEmptyList(call)

        if (groups.isEmpty()) {
            logger.debug("Team access denied for teamId: $teamId - No groups found in Entra ID")
            return false
        }

        val hasAccess = teamId in groups.map { it.id }

        if (hasAccess) {
            logger.debug("Team access granted for teamId: $teamId")
        } else {
            logger.debug("Team access denied for teamId: {} - Team not in user's groups: {}", teamId, groups)
        }

        return hasAccess
    }

    override suspend fun hasContextAccess(
        call: ApplicationCall,
        contextId: String,
    ): Boolean = try {
        val hasWriteAccess = hasWriteContextAccess(call, contextId)
        val hasReadAccess = hasReadContextAccess(call, contextId)

        if (hasWriteAccess) {
            logger.debug("Context access granted for contextId: $contextId via write access")
        } else if (hasReadAccess) {
            logger.debug("Context access granted for contextId: $contextId via read access")
        } else {
            logger.debug("Context access denied for contextId: $contextId - no write or read access")
        }

        hasWriteAccess || hasReadAccess
    } catch (e: Exception) {
        logger.warn("Context access check failed for contextId: $contextId - ${e.message}")
        false
    }

    override suspend fun hasWriteContextAccess(call: ApplicationCall, contextId: String): Boolean {
        val context = contextRepository.getContext(contextId)
        return hasTeamAccess(call, context.teamId)
    }

    override suspend fun hasReadContextAccess(
        call: ApplicationCall,
        contextId: String,
    ): Boolean {
        val shares = sharesRepository.getSharesByContext(contextId).map { it.userId }
        val userId = getCurrentUser(call).id
        return userId in shares
    }

    override suspend fun hasSuperUserAccess(
        call: ApplicationCall,
    ): Boolean = hasTeamAccess(call, oAuthConfig.superUserGroup)

    override suspend fun hasReportingUserAccess(
        call: ApplicationCall,
    ): Boolean = hasTeamAccess(call, oAuthConfig.reportingUserGroup)

    override suspend fun getTeamIdFromName(call: ApplicationCall, teamName: String): String? {
        val microsoftGroups = getGroupsOrEmptyList(call)

        return microsoftGroups.find { it.displayName == teamName }?.id
    }
}
