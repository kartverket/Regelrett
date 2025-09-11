package no.bekk.routes

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import no.bekk.exception.AuthorizationException
import no.bekk.exception.ExternalServiceException
import no.bekk.exception.NotFoundException
import no.bekk.providers.AirTableProvider
import no.bekk.services.FormService
import no.bekk.util.RequestContext.getOrCreateCorrelationId
import org.slf4j.LoggerFactory
import java.util.Base64
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

@Serializable
data class AirtableWebhookPayload(
    val base: Base,
    val webhook: Webhook,
    val timestamp: String,
)

@Serializable
data class Base(
    val id: String,
)

@Serializable
data class Webhook(
    val id: String,
)

private val logger = LoggerFactory.getLogger("no.bekk.routes.AirTableWebhookRouting")

fun Route.airTableWebhookRouting(formService: FormService) {
    post("/webhook") {
        try {
            val correlationId = call.getOrCreateCorrelationId()
            logger.info("[POST /webhook] [correlationId: $correlationId] Received webhook ping from AirTable")

            val incomingSignature = call.request.headers["X-Airtable-Content-Mac"]?.removePrefix("hmac-sha256=") ?: run {
                logger.warn("[POST /webhook] [correlationId: $correlationId] Missing X-Airtable-Content-Mac header")
                call.respond(HttpStatusCode.Unauthorized, "Missing signature")
                return@post
            }

            val requestBody = call.receiveText()
            val payload = try {
                kotlinx.serialization.json.Json.decodeFromString<AirtableWebhookPayload>(requestBody)
            } catch (e: Exception) {
                logger.warn("[POST /webhook] [correlationId: $correlationId] Invalid JSON payload: ${e.message}")
                call.respond(HttpStatusCode.BadRequest, "Invalid JSON payload")
                return@post
            }

            try {
                validateSignature(incomingSignature, requestBody, formService)
                processWebhook(payload.webhook.id, formService)
                call.respond(HttpStatusCode.OK)
                logger.info("[POST /webhook] [correlationId: $correlationId] Successfully processed webhook for webhookId: ${payload.webhook.id}")
                return@post
            } catch (e: AuthorizationException) {
                logger.warn("[POST /webhook] [correlationId: $correlationId] Authorization failed: ${e.message}")
                call.respond(HttpStatusCode.Unauthorized, e.message ?: "Authorization error")
                return@post
            } catch (e: NotFoundException) {
                logger.warn("[POST /webhook] [correlationId: $correlationId] Resource not found: ${e.message}")
                call.respond(HttpStatusCode.NotFound, e.message ?: "Resource not found")
                return@post
            } catch (e: Exception) {
                logger.error("[POST /webhook] [correlationId: $correlationId] Error processing webhook: ${e.message}", e)
                call.respondText("Failed to process webhook", status = HttpStatusCode.BadRequest)
                return@post
            }
        } catch (e: Exception) {
            val correlationId = call.getOrCreateCorrelationId()
            logger.error("[POST /webhook] [correlationId: $correlationId] Unexpected error processing webhook: ${e.message}", e)
            call.respondText("Failed to process webhook", status = HttpStatusCode.InternalServerError)
        }
    }
}

private fun getAirTableProviderByWebhookId(webhookId: String, formService: FormService): AirTableProvider? = formService.getFormProviders().filterIsInstance<AirTableProvider>().find { it.webhookId == webhookId }

private fun validateSignature(incomingSignature: String?, requestBody: String, formService: FormService) {
    val payload = kotlinx.serialization.json.Json.decodeFromString<AirtableWebhookPayload>(requestBody)
    val provider = getAirTableProviderByWebhookId(payload.webhook.id, formService)
        ?: throw NotFoundException("Provider not found for webhookId: ${payload.webhook.id}")

    if (provider.webhookSecret == null) {
        logger.error("Webhook secret not configured for provider: ${provider.name}")
        throw AuthorizationException("Webhook authentication not properly configured")
    }

    val macSecret = try {
        Base64.getDecoder().decode(provider.webhookSecret)
    } catch (e: Exception) {
        logger.error("Invalid webhook secret format for provider: ${provider.name}", e)
        throw AuthorizationException("Invalid webhook secret configuration")
    }

    val hmacSha256 = Mac.getInstance("HmacSHA256").apply {
        init(SecretKeySpec(macSecret, "HmacSHA256"))
    }

    val calculatedHmacHex = hmacSha256.doFinal(requestBody.toByteArray(Charsets.UTF_8)).joinToString("") {
        String.format("%02x", it)
    }

    if (calculatedHmacHex != incomingSignature) {
        logger.warn("Signature validation failed for webhookId: ${payload.webhook.id}. Expected: $calculatedHmacHex, Received: $incomingSignature")
        throw AuthorizationException("Invalid signature")
    }

    logger.debug("Signature validation successful for webhookId: ${payload.webhook.id}")
}

private suspend fun processWebhook(webhookId: String, formService: FormService) {
    logger.debug("Processing webhook for webhookId: $webhookId")

    val provider = getAirTableProviderByWebhookId(webhookId, formService)
        ?: throw NotFoundException("Provider not found for webhookId: $webhookId")

    try {
        provider.refreshWebhook()
        provider.updateCaches()
        logger.info("Successfully processed webhook for provider: ${provider.name}")
    } catch (e: Exception) {
        logger.error("Failed to process webhook for provider: ${provider.name}", e)
        throw ExternalServiceException("AirTable", "Webhook processing failed: ${e.message}", cause = e)
    }
}
