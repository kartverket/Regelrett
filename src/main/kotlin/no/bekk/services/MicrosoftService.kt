package no.bekk.services

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.cio.*
import io.ktor.client.request.*
import io.ktor.client.request.forms.*
import io.ktor.client.statement.*
import io.ktor.http.*
import kotlinx.serialization.json.Json
import no.bekk.configuration.Config
import no.bekk.configuration.getTokenUrl
import no.bekk.domain.MicrosoftGraphGroup
import no.bekk.domain.MicrosoftGraphGroupsResponse
import no.bekk.domain.MicrosoftGraphUser
import no.bekk.domain.MicrosoftOnBehalfOfTokenResponse
import no.bekk.exception.AuthenticationException
import no.bekk.exception.ExternalServiceException
import no.bekk.util.ExternalServiceTimer
import org.slf4j.LoggerFactory

interface MicrosoftService {
    suspend fun requestTokenOnBehalfOf(jwtToken: String?): String
    suspend fun fetchGroups(bearerToken: String): List<MicrosoftGraphGroup>
    suspend fun fetchGroupName(bearerToken: String, groupId: String): MicrosoftGraphGroup
    suspend fun fetchCurrentUser(bearerToken: String): MicrosoftGraphUser
    suspend fun fetchUserByUserId(bearerToken: String, userId: String): MicrosoftGraphUser
}

class MicrosoftServiceImpl(private val config: Config, private val client: HttpClient = HttpClient(CIO)) : MicrosoftService {
    private val logger = LoggerFactory.getLogger(MicrosoftServiceImpl::class.java)
    val json = Json { ignoreUnknownKeys = true }

    override suspend fun requestTokenOnBehalfOf(jwtToken: String?): String {
        if (jwtToken == null) {
            logger.error("No JWT token provided for on-behalf-of flow")
            throw AuthenticationException("No JWT token provided - session may be expired or invalid")
        }

        return try {
            ExternalServiceTimer.time("Microsoft", "requestTokenOnBehalfOf") {
                val response: HttpResponse = client.post(getTokenUrl(config.oAuth)) {
                    contentType(ContentType.Application.FormUrlEncoded)
                    setBody(
                        FormDataContent(
                            Parameters.build {
                                append("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer")
                                append("client_id", config.oAuth.clientId)
                                append("client_secret", config.oAuth.clientSecret)
                                append("assertion", jwtToken)
                                append("scope", "GroupMember.Read.All")
                                append("requested_token_use", "on_behalf_of")
                            },
                        ),
                    )
                }

                if (response.status != HttpStatusCode.OK) {
                    val errorBody = response.body<String>()
                    logger.error("Microsoft token request failed with status ${response.status}: $errorBody")
                    throw ExternalServiceException("Microsoft", "Token request failed", response.status.value)
                }

                val responseBody = response.body<String>()
                val microsoftOnBehalfOfTokenResponse: MicrosoftOnBehalfOfTokenResponse = json.decodeFromString(responseBody)
                logger.debug("Successfully obtained on-behalf-of token")
                microsoftOnBehalfOfTokenResponse.accessToken
            }
        } catch (e: ExternalServiceException) {
            throw e
        } catch (e: Exception) {
            logger.error("Unexpected error during Microsoft token request", e)
            throw ExternalServiceException("Microsoft", "Token request failed: ${e.message}", cause = e)
        }
    }

    override suspend fun fetchGroups(bearerToken: String): List<MicrosoftGraphGroup> {
        val url = "${config.microsoftGraph.baseUrl + config.microsoftGraph.memberOfPath}?\$count=true&\$select=id,displayName"

        return try {
            ExternalServiceTimer.time("Microsoft", "fetchGroups") {
                val response: HttpResponse = client.get(url) {
                    bearerAuth(bearerToken)
                    header("ConsistencyLevel", "eventual")
                }

                if (response.status != HttpStatusCode.OK) {
                    val responseBody = response.body<String>()
                    logger.warn("Failed to fetch groups from Microsoft Graph - Status: ${response.status}, Body: $responseBody")
                    throw ExternalServiceException("Microsoft Graph", "Failed to fetch groups", response.status.value)
                }

                val responseBody = response.body<String>()
                logger.debug("Successfully fetched groups from Microsoft Graph")

                val microsoftGraphGroupsResponse: MicrosoftGraphGroupsResponse = try {
                    json.decodeFromString(responseBody)
                } catch (e: Exception) {
                    logger.error("Failed to parse Microsoft Graph groups response", e)
                    throw ExternalServiceException("Microsoft Graph", "Invalid response format", cause = e)
                }

                microsoftGraphGroupsResponse.value.map {
                    MicrosoftGraphGroup(
                        id = it.id,
                        displayName = it.displayName,
                    )
                }
            }
        } catch (e: ExternalServiceException) {
            throw e
        } catch (e: Exception) {
            logger.error("Unexpected error fetching groups from Microsoft Graph", e)
            throw ExternalServiceException("Microsoft Graph", "Failed to fetch groups: ${e.message}", cause = e)
        }
    }


    override suspend fun fetchGroupName(bearerToken: String, groupId: String): MicrosoftGraphGroup {
        val url = "${config.microsoftGraph.baseUrl}/v1.0/groups/${groupId}?\$select=id,displayName"

        return try {
            ExternalServiceTimer.time("Microsoft", "fetchGroupName") {
                val response: HttpResponse = client.get(url) {
                    bearerAuth(bearerToken)
                    header("ConsistencyLevel", "eventual")
                }

                if (response.status != HttpStatusCode.OK) {
                    val responseBody = response.body<String>()
                    logger.warn("Failed to fetch group name from Microsoft Graph - Status: ${response.status}, Body: $responseBody")
                    throw ExternalServiceException("Microsoft Graph", "Failed to fetch group name", response.status.value)
                }

                val responseBody = response.body<String>()
                logger.debug("Successfully fetched groups from Microsoft Graph")

                try {
                    json.decodeFromString<MicrosoftGraphGroup>(responseBody)
                } catch (e: Exception) {
                    logger.error("Failed to parse Microsoft Graph groups response", e)
                    throw ExternalServiceException("Microsoft Graph", "Invalid response format", cause = e)
                }


            }
        } catch (e: ExternalServiceException) {
            throw e
        } catch (e: Exception) {
            logger.error("Unexpected error fetching groups from Microsoft Graph", e)
            throw ExternalServiceException("Microsoft Graph", "Failed to fetch groups: ${e.message}", cause = e)
        }
    }

    override suspend fun fetchCurrentUser(bearerToken: String): MicrosoftGraphUser {
        val url = "${config.microsoftGraph.baseUrl}/v1.0/me?\$select=id,displayName,mail"

        return try {
            ExternalServiceTimer.time("Microsoft", "fetchCurrentUser") {
                val response: HttpResponse = client.get(url) {
                    bearerAuth(bearerToken)
                    header("ConsistencyLevel", "eventual")
                }

                if (response.status != HttpStatusCode.OK) {
                    val responseBody = response.body<String>()
                    logger.error("Failed to fetch current user - Status: ${response.status}, Body: $responseBody")
                    throw ExternalServiceException("Microsoft Graph", "Failed to fetch current user", response.status.value)
                }

                val responseBody = response.body<String>()
                logger.debug("Successfully fetched current user from Microsoft Graph")
                json.decodeFromString<MicrosoftGraphUser>(responseBody)
            }
        } catch (e: ExternalServiceException) {
            throw e
        } catch (e: Exception) {
            logger.error("Unexpected error fetching current user from Microsoft Graph", e)
            throw ExternalServiceException("Microsoft Graph", "Failed to fetch current user: ${e.message}", cause = e)
        }
    }

    override suspend fun fetchUserByUserId(bearerToken: String, userId: String): MicrosoftGraphUser {
        val url = "${config.microsoftGraph.baseUrl}/v1.0/users/$userId"

        return try {
            ExternalServiceTimer.time("Microsoft", "fetchUserByUserId") {
                val response: HttpResponse = client.get(url) {
                    bearerAuth(bearerToken)
                    header("ConsistencyLevel", "eventual")
                }

                if (response.status != HttpStatusCode.OK) {
                    val responseBody = response.body<String>()
                    logger.error("Failed to fetch user by ID $userId - Status: ${response.status}, Body: $responseBody")
                    throw ExternalServiceException("Microsoft Graph", "Failed to fetch user with ID $userId", response.status.value)
                }

                val responseBody = response.body<String>()
                logger.debug("Successfully fetched user $userId from Microsoft Graph")
                json.decodeFromString<MicrosoftGraphUser>(responseBody)
            }
        } catch (e: ExternalServiceException) {
            throw e
        } catch (e: Exception) {
            logger.error("Unexpected error fetching user $userId from Microsoft Graph", e)
            throw ExternalServiceException("Microsoft Graph", "Failed to fetch user $userId: ${e.message}", cause = e)
        }
    }
}
