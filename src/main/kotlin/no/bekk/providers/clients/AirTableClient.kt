package no.bekk.providers.clients

import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.auth.*
import io.ktor.client.plugins.auth.providers.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import no.bekk.domain.AirtableResponse
import no.bekk.domain.MetadataResponse
import no.bekk.domain.Record
import no.bekk.util.ExternalServiceTimer
import org.slf4j.LoggerFactory

@Serializable
data class AirTableBasesResponse(
    val bases: List<AirTableBase>,
    val offset: String? = null,
)

@Serializable
data class AirTableBase(
    val id: String,
    val name: String,
    val permissionLevel: String,
)

class AirTableClient(private val accessToken: String, private val baseUrl: String) {
    private val logger = LoggerFactory.getLogger(AirTableClient::class.java)

    private val json = Json { ignoreUnknownKeys = true }

    private val client = HttpClient(CIO) {
        install(Auth) {
            bearer {
                loadTokens {
                    BearerTokens(accessToken, "")
                }
            }
        }
    }

    suspend fun getBases(): AirTableBasesResponse = ExternalServiceTimer.time("AirTable", "getBases") {
        val response = client.get(baseUrl + "/v0/meta/bases")
        val responseBody = response.bodyAsText()
        json.decodeFromString<AirTableBasesResponse>(responseBody)
    }

    suspend fun getBaseSchema(baseId: String): MetadataResponse = ExternalServiceTimer.time("AirTable", "getBaseSchema") {
        val response = client.get(baseUrl + "/v0/meta/bases/$baseId/tables")
        val responseBody = response.bodyAsText()
        json.decodeFromString<MetadataResponse>(responseBody)
    }

    suspend fun getRecords(baseId: String, tableId: String, viewId: String? = null, offset: String? = null): AirtableResponse = ExternalServiceTimer.time("AirTable", "getRecords") {
        val url = buildString {
            append(baseUrl)
            append("/v0/$baseId/$tableId")
            if (viewId != null) {
                append("?view=$viewId")
                if (offset != null) {
                    append("&offset=$offset")
                }
            } else if (offset != null) {
                append("?offset=$offset")
            }
        }
        val response = client.get(url)
        val responseBody = response.bodyAsText()
        json.decodeFromString<AirtableResponse>(responseBody)
    }

    suspend fun getRecord(baseId: String, tableId: String, recordId: String): Record = ExternalServiceTimer.time("AirTable", "getRecord") {
        val response = client.get(baseUrl + "/v0/$baseId/$tableId/$recordId")
        val responseBody = response.bodyAsText()
        json.decodeFromString<Record>(responseBody)
    }

    suspend fun refreshWebhook(baseId: String, webhookId: String): Int = ExternalServiceTimer.time("AirTable", "refreshWebhook") {
        val url = "$baseUrl/v0/bases/$baseId/webhooks/$webhookId/refresh"
        val response: HttpResponse = client.post(url) {
            header("Authorization", "Bearer $accessToken")
        }
        response.status.value
    }
}
