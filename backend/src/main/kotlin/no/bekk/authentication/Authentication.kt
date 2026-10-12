package no.bekk.authentication

import com.auth0.jwk.JwkProviderBuilder
import io.ktor.client.HttpClient
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.uri
import io.ktor.server.response.*
import io.ktor.server.sessions.*
import io.ktor.server.util.url
import kotlinx.serialization.Serializable
import no.bekk.configuration.Config
import no.bekk.configuration.getIssuer
import no.bekk.configuration.getJwksUrl
import no.bekk.di.Redirects
import no.bekk.util.RequestContext.getRequestInfo
import org.slf4j.LoggerFactory
import java.net.URI
import java.util.concurrent.TimeUnit

@Serializable
data class UserSession(val state: String, val token: String, val expiresAt: Long)

private val logger = LoggerFactory.getLogger("no.bekk.authentication.Authentication")

fun Application.initializeAuthentication(config: Config, httpClient: HttpClient, redirects: Redirects) {
    val issuer = getIssuer(config.oAuth)
    val clientId = config.oAuth.clientId
    val jwksUri = getJwksUrl(config.oAuth)

    val jwkProvider = JwkProviderBuilder(URI(jwksUri).toURL())
        .cached(10, 24, TimeUnit.HOURS)
        .rateLimited(10, 1, TimeUnit.MINUTES)
        .build()

    install(Sessions) {
        cookie<UserSession>("user_session") {
            cookie.path = "/"
            cookie.httpOnly = false
        }
    }

    install(Authentication) {
        oauth("auth-oauth-azure") {
            urlProvider = {
                "${config.server.appUrl}/callback"
            }
            providerLookup = {
                OAuthServerSettings.OAuth2ServerSettings(
                    name = "azure",
                    authorizeUrl = "${config.oAuth.baseUrl}/${config.oAuth.tenantId}${config.oAuth.authPath}",
                    accessTokenUrl = "${config.oAuth.baseUrl}/${config.oAuth.tenantId}/${config.oAuth.tokenPath}",
                    requestMethod = HttpMethod.Post,
                    clientId = clientId,
                    clientSecret = config.oAuth.clientSecret,
                    defaultScopes = listOf("$clientId/.default"),
                    onStateCreated = { call, state ->
                        call.request.queryParameters["redirectUrl"]?.let {
                            redirects.r[state] = it
                        }
                    },
                )
            }
            client = httpClient
        }

        session<UserSession>("auth-session") {
            validate { session ->
                if (session.state != "" && session.token != "" && System.currentTimeMillis() < session.expiresAt) {
                    logger.debug("Session validation successful for state: ${session.state}")
                    session
                } else {
                    if (System.currentTimeMillis() > session.expiresAt) {
                        logger.info("Session validation failed for state: ${session.state} - Token expired at ${session.expiresAt}, current time: ${System.currentTimeMillis()}")
                    } else {
                        logger.info("Session validation failed for state: ${session.state} - Missing token or state. Token present: ${session.token != ""}, State present: ${session.state != ""}")
                    }
                    null
                }
            }

            challenge {
                val redirectUrl = call.url {
                    path("/login")
                    parameters.append("redirectUrl", call.request.uri)
                    build()
                }

                val sessionCookie = call.request.cookies["user_session"]
                val challengeReason = when {
                    sessionCookie == null -> "No session cookie found"
                    else -> "Invalid or expired session"
                }

                logger.info("${call.getRequestInfo()} Session authentication challenge triggered - $challengeReason, redirecting to: $redirectUrl")
                call.respondRedirect(redirectUrl)
            }
        }

        jwt("auth-jwt") {
            verifier(jwkProvider, issuer) {
                withIssuer(issuer)
                acceptLeeway(3)
                withAudience(clientId)
            }

            validate { jwtCredential ->
                logger.debug("JWT validation started - Issuer: ${jwtCredential.payload.issuer}, Subject: ${jwtCredential.payload.subject}, Audience: ${jwtCredential.audience}")

                val expectedAudience = clientId
                val actualAudiences = jwtCredential.audience
                val hasValidAudience = actualAudiences.contains(expectedAudience)

                if (hasValidAudience) {
                    logger.debug("JWT validation successful - Token accepted for clientId: $expectedAudience")
                    JWTPrincipal(jwtCredential.payload)
                } else {
                    logger.warn("JWT validation failed - Token audience mismatch. Expected: [$expectedAudience], Actual: $actualAudiences")
                    null
                }
            }

            challenge { defaultScheme, realm ->
                val failureReason = when {
                    call.request.headers["Authorization"] == null -> "Missing Authorization header"
                    call.request.headers["Authorization"]?.startsWith("Bearer ") != true -> "Invalid Authorization header format (must start with 'Bearer ')"
                    else -> "Invalid or expired JWT token"
                }

                logger.info("${call.getRequestInfo()} JWT authentication challenge triggered - $failureReason")
                call.respond(HttpStatusCode.Unauthorized, "Token is not valid or has expired")
            }
        }
    }
}
