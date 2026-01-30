package no.bekk.services

import kotlinx.serialization.Serializable
import no.bekk.providers.AirTableProvider
import no.bekk.providers.FormProvider
import no.bekk.providers.YamlProvider
import no.bekk.providers.clients.AirTableClient
import no.bekk.services.provisioning.schemasources.UpsertDataFromConfig
import no.bekk.util.generateNewUid
import org.slf4j.LoggerFactory

@Serializable
data class FormsMetadataDto(
    val id: String,
    val name: String,
)

const val MAX_DATA_SOURCE_NAME_LEN = 190
const val MAX_DATA_SOURCE_URL_LEN = 255

interface FormService {
    fun getFormProvider(formId: String): FormProvider

    fun getFormProviderByName(name: String): FormProvider

    fun hasFormProvider(name: String): Boolean

    fun addFormProvider(command: UpsertDataFromConfig)

    // TODO: fun updateFormProvider(provider: FormProvider)

    fun getFormProviders(): List<FormProvider>
}

class FormProviderNotFoundException(message: String? = null, cause: Throwable? = null) : IllegalArgumentException(message, cause)

class FormServiceImpl : FormService {
    private val logger = LoggerFactory.getLogger(FormServiceImpl::class.java)
    private val providers: MutableMap<String, FormProvider> = mutableMapOf()

    override fun getFormProvider(formId: String): FormProvider = providers.get(formId) ?: throw FormProviderNotFoundException("Form $formId not found")

    override fun getFormProviderByName(name: String): FormProvider = providers.values.find { it.name == name } ?: throw FormProviderNotFoundException("Form $name not found")

    override fun hasFormProvider(name: String): Boolean = providers.values.find { it.name == name } != null

    override fun getFormProviders(): List<FormProvider> = providers.values.toList()

    override fun addFormProvider(command: UpsertDataFromConfig) {
        var cmd = command
        if (command.name == "") {
            cmd = cmd.copy(name = getAvailableName(cmd.type))
        }

        if (cmd.name.length > MAX_DATA_SOURCE_NAME_LEN) {
            throw IllegalArgumentException("Datasource name invalid, max length is $MAX_DATA_SOURCE_NAME_LEN")
        }

        if (cmd.url?.length ?: 0 > MAX_DATA_SOURCE_URL_LEN) {
            throw IllegalArgumentException("Datasource url invalid, max length is $MAX_DATA_SOURCE_URL_LEN")
        }

        val uuid = cmd.uid ?: generateNewProviderUid()

        fun missingProperty(property: String, schemaType: String) = "Property $property is missing in ${cmd.name} but is required in $schemaType schema specifications"
        val provider = when (cmd.type) {
            "AIRTABLE" -> AirTableProvider(
                name = cmd.name,
                id = uuid,
                airtableClient = AirTableClient(
                    cmd.access_token ?: throw IllegalArgumentException(missingProperty("access_token", "AirTable")),
                    cmd.url ?: throw IllegalArgumentException(missingProperty("url", "AirTable")),
                ),
                baseId = cmd.base_id ?: throw IllegalArgumentException(missingProperty("base_id", "AirTable")),
                tableId = cmd.table_id ?: throw IllegalArgumentException(missingProperty("table_id", "AirTable")),
                viewId = cmd.view_id,
                webhookId = cmd.webhook_id,
                webhookSecret = cmd.webhook_secret,
                readAccessGroupId = cmd.read_access_group_id,
            )
            "YAML" -> YamlProvider(
                name = cmd.name,
                id = uuid,
                endpoint = cmd.url,
                readAccessGroupId = cmd.read_access_group_id,
                resourcePath = cmd.resource_path,
            )
            else -> throw IllegalStateException("Illegal type \"${cmd.type}\"")
        }

        logger.info("Adding ${cmd.type} form provider: ${provider.name}")
        providers.put(provider.id, provider)
    }

    private fun getAvailableName(type: String): String {
        val existingNames = mutableMapOf<String, Boolean>()
        for (provider in providers.values) {
            existingNames.put(provider.name.lowercase(), true)
        }

        var name = type
        var currentDigit = 0

        while (existingNames[name] ?: false) {
            currentDigit++
            name = "$type-$currentDigit"
        }

        return name
    }

    fun generateNewProviderUid(): String {
        for (i in 0..3) {
            val uuid = generateNewUid()

            if (providers.firstNotNullOfOrNull { it.value.id == uuid } != null) {
                continue
            }

            return uuid
        }
        throw IllegalStateException("Failed to generate UID for provider")
    }
}
