package no.bekk.providers

import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.server.plugins.*
import kotlinx.serialization.serializer
import net.mamoe.yamlkt.Yaml
import no.bekk.model.internal.*

class YamlProvider(
    override val name: String,
    override val id: String,
    override val readAccessGroupId: String? = null,
    private val httpClient: HttpClient? = null,
    private val endpoint: String? = null,
    private val resourcePath: String? = null,
) : FormProvider {
    init {
        require((endpoint != null && httpClient != null) || resourcePath != null) {
            "endpoint and httpClient or resourcePath must be set"
        }
    }

    override suspend fun getForm(): Form {
        if (endpoint != null) {
            return getFormFromYamlEndpoint()
        } else {
            return getFormFromResourcePath()
        }
    }

    override suspend fun getSchema(): Schema {
        if (endpoint != null) {
            val form = getFormFromYamlEndpoint()
            return Schema(
                id = form.id,
                name = form.name,
            )
        } else {
            val form = getFormFromResourcePath()
            return Schema(
                id = form.id,
                name = form.name,
            )
        }
    }

    override suspend fun getColumns(): List<Column> {
        if (endpoint != null) {
            return getFormFromYamlEndpoint().columns
        } else {
            return getFormFromResourcePath().columns
        }
    }

    override suspend fun getQuestion(recordId: String): Question {
        if (endpoint != null) {
            return getFormFromYamlEndpoint().records.find { it.id == recordId } ?: run {
                throw NotFoundException("Question $recordId not found")
            }
        } else {
            return getFormFromResourcePath().records.find { it.id == recordId } ?: run {
                throw NotFoundException("Question $recordId not found")
            }
        }
    }

    private suspend fun getFormFromYamlEndpoint(): Form {
        require(endpoint != null && httpClient != null) { "endpoint and httpClient must not be null" }
        val response = httpClient.get(endpoint)
        val responseBody = response.bodyAsText()
        return parseAndConvertToForm(responseBody)
    }

    private fun getFormFromResourcePath(): Form {
        require(resourcePath != null) { "Resource path not set" }
        val body = this::class.java.classLoader.getResource(resourcePath)?.readText()
            ?: throw NotFoundException("Resource not found: $resourcePath")
        return parseAndConvertToForm(body)
    }

    private fun parseAndConvertToForm(yamlString: String): Form {
        val form = Yaml.decodeFromString<FormWithoutId>(serializer(), yamlString)

        return Form(
            id = id,
            name = form.name,
            columns = form.columns,
            records = form.records.map {
                Question(
                    id = it.id,
                    recordId = it.id, // need to set recordId since all endpoints require it as of now
                    question = it.question,
                    metadata = it.metadata,
                )
            },
        )
    }
}
