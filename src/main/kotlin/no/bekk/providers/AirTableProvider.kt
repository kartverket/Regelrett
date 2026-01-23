package no.bekk.providers

import com.github.benmanes.caffeine.cache.Cache
import com.github.benmanes.caffeine.cache.Caffeine
import kotlinx.serialization.json.*
import no.bekk.domain.AirtableResponse
import no.bekk.domain.MetadataResponse
import no.bekk.domain.Record
import no.bekk.domain.mapToQuestion
import no.bekk.model.airtable.AirTableFieldType
import no.bekk.model.airtable.mapAirTableFieldTypeToAnswerType
import no.bekk.model.airtable.mapAirTableFieldTypeToOptionalFieldType
import no.bekk.model.internal.*
import no.bekk.providers.clients.AirTableClient
import org.slf4j.LoggerFactory
import java.net.HttpURLConnection

private const val SVAR = "Svar"
private const val SVARTYPE = "Svartype"
private const val SVARENHET = "Svarenhet"
private const val SVARVARIGHET = "Svarvarighet"

class AirTableProvider(
    override val name: String,
    override val id: String,
    override val readAccessGroupId: String? = null,
    private val airtableClient: AirTableClient,
    private val baseId: String,
    private val tableId: String,
    private val viewId: String? = null,
    val webhookSecret: String? = null,
    val webhookId: String? = null,
) : FormProvider {
    private val logger = LoggerFactory.getLogger(AirTableProvider::class.java)

    private fun <K : Any, V> createCache(): Cache<K, V> {
        val expirationDuration = if (webhookId != null) (24L * 6) else 1L
        return Caffeine.newBuilder()
            .expireAfterWrite(expirationDuration, java.util.concurrent.TimeUnit.HOURS)
            .build()
    }

    private val tableCache: Cache<String, Form> = createCache()
    private val questionCache: Cache<String, Question> = createCache()
    private val columnCache: Cache<String, List<Column>> = createCache()

    val json = Json { ignoreUnknownKeys = true }

    override suspend fun getForm(): Form {
        val cachedTable = tableCache.getIfPresent(id)
        if (cachedTable != null) {
            logger.info("Successfully retrieved table: $tableId from cache")
            return cachedTable
        }

        val freshTable = getTableFromAirTable()
        logger.info("Successfully retrieved table: $tableId from Airtable")
        tableCache.put(id, freshTable)

        freshTable.records.forEach { record ->
            record.recordId?.let {
                questionCache.put(it, record)
            }
        }
        columnCache.put(id, freshTable.columns)

        return freshTable
    }

    override suspend fun getSchema(): Schema {
        val cachedTable = tableCache.getIfPresent(id)
        if (cachedTable != null) {
            return Schema(id = cachedTable.id, name = cachedTable.name)
        }

        val freshSchema = getSchemaFromAirTable()
        return freshSchema
    }

    override suspend fun getQuestion(recordId: String): Question {
        val cachedQuestion = questionCache.getIfPresent(recordId)
        if (cachedQuestion != null) {
            return cachedQuestion
        }

        val freshQuestion = getQuestionFromAirtable(recordId)
        questionCache.put(recordId, freshQuestion)
        return freshQuestion
    }

    override suspend fun getColumns(): List<Column> {
        val cachedColumns = columnCache.getIfPresent(id)
        if (cachedColumns != null) {
            return cachedColumns
        }

        val freshColumns = getColumnsFromAirTable()
        columnCache.put(id, freshColumns)
        return freshColumns
    }

    private suspend fun getTableFromAirTable(): Form {
        val allRecords = fetchAllRecordsFromTable()
        val airTableMetadata = fetchMetadataFromBase()

        val tableMetadata = airTableMetadata.tables.first { it.id == tableId }
        if (tableMetadata.fields == null) {
            throw IllegalArgumentException("Table $tableId has no fields")
        }

        val questions = allRecords.records.mapNotNull { record ->
            if (record.fields.jsonObject[SVARTYPE]?.jsonPrimitive?.content == null) {
                null
            } else {
                try {
                    record.mapToQuestion(
                        recordId = record.id,
                        metaDataFields = tableMetadata.fields,
                        answerType = mapAirTableFieldTypeToAnswerType(
                            AirTableFieldType.fromString(
                                record.fields.jsonObject[SVARTYPE]?.jsonPrimitive?.content ?: "unknown",
                            ),
                        ),
                        answerOptions = record.fields.jsonObject[SVAR]?.jsonArray?.map { it.jsonPrimitive.content },
                        answerUnits = record.fields.jsonObject[SVARENHET]?.jsonArray?.map { it.jsonPrimitive.content },
                        answerExpiry = record.fields.jsonObject[SVARVARIGHET]?.jsonPrimitive?.intOrNull,
                    )
                } catch (e: IllegalArgumentException) {
                    logger.error("Answertype ${record.fields.jsonObject[SVARTYPE]?.jsonPrimitive?.content} caused an error, and is skipped")
                    null
                }
            }
        }

        val columns = tableMetadata.fields.mapNotNull { field ->
            if (field.type == "multipleRecordLinks") {
                null
            } else {
                try {
                    Column(
                        type = mapAirTableFieldTypeToOptionalFieldType(AirTableFieldType.fromString(field.type)),
                        name = field.name,
                        options = field.options?.choices?.map { choice ->
                            Option(name = choice.name, color = choice.color)
                        },
                    )
                } catch (e: IllegalArgumentException) {
                    logger.error("field type ${field.type} could not be mapped, and will be skipped")
                    null
                }
            }
        }
        // Refresh webhook expiration date
        if (!webhookId.isNullOrEmpty()) {
            refreshWebhook()
        }

        return Form(
            id = id,
            name = airtableClient.getBases().bases.find { it.id == baseId }?.name ?: tableMetadata.name,
            columns = columns,
            records = questions,
        )
    }

    private suspend fun getSchemaFromAirTable(): Schema {
        val airTableMetadata = fetchMetadataFromBase()

        val tableMetadata = airTableMetadata.tables.first { it.id == tableId }
        if (tableMetadata.fields == null) {
            throw IllegalArgumentException("Table $tableId has no fields")
        }

        // Refresh webhook expiration date
        if (!webhookId.isNullOrEmpty()) {
            refreshWebhook()
        }

        return Schema(
            id = id,
            name = airtableClient.getBases().bases.find { it.id == baseId }?.name ?: tableMetadata.name,
        )
    }

    private suspend fun getQuestionFromAirtable(recordId: String): Question {
        val record = fetchRecord(recordId)
        val airTableMetadata = fetchMetadataFromBase()

        val tableMetadata = airTableMetadata.tables.first { it.id == tableId }
        if (tableMetadata.fields == null) {
            throw IllegalArgumentException("Table $tableId has no fields")
        }

        val question = record.mapToQuestion(
            recordId = record.id,
            metaDataFields = tableMetadata.fields,
            answerType = mapAirTableFieldTypeToAnswerType(
                AirTableFieldType.fromString(
                    record.fields.jsonObject[SVARTYPE]?.jsonPrimitive?.content ?: "unknown",
                ),
            ),
            answerOptions = record.fields.jsonObject[SVAR]?.jsonArray?.map { it.jsonPrimitive.content },
            answerUnits = record.fields.jsonObject[SVARENHET]?.jsonArray?.map { it.jsonPrimitive.content },
            answerExpiry = record.fields.jsonObject[SVARVARIGHET]?.jsonPrimitive?.intOrNull,
        )

        return question
    }

    private suspend fun getColumnsFromAirTable(): List<Column> {
        val airTableMetadata = fetchMetadataFromBase()

        val tableMetadata = airTableMetadata.tables.first { it.id == tableId }
        if (tableMetadata.fields == null) {
            throw IllegalArgumentException("Table $tableId has no fields")
        }
        return tableMetadata.fields.map { field ->
            Column(
                type = mapAirTableFieldTypeToOptionalFieldType(AirTableFieldType.fromString(field.type)),
                name = field.name,
                options = field.options?.choices?.map { choice ->
                    Option(name = choice.name, color = choice.color)
                },
            )
        }
    }

    private fun filterMetadataOnStop(metadataResponse: MetadataResponse): MetadataResponse {
        val newTables = metadataResponse.tables.map { table ->
            val fields = table.fields
            if (!fields.isNullOrEmpty()) {
                val stopIndex = fields.indexOfFirst { it.name == "STOP" }
                if (stopIndex != -1) {
                    val newFields = fields.slice(0..<stopIndex)
                    table.copy(fields = newFields)
                } else {
                    table
                }
            } else {
                table
            }
        }

        return metadataResponse.copy(tables = newTables)
    }

    private suspend fun fetchMetadataFromBase(): MetadataResponse {
        val metadataResponse = airtableClient.getBaseSchema(baseId)
        val filteredMetaData = filterMetadataOnStop(metadataResponse = metadataResponse)
        return filteredMetaData
    }

    suspend fun fetchAllRecordsFromTable(): AirtableResponse {
        var offset: String? = null
        val allRecords = mutableListOf<Record>()
        do {
            val response = fetchRecordsFromTable(offset)
            val records = response.records
            allRecords.addAll(records)
            offset = response.offset
        } while (offset != null)

        return AirtableResponse(allRecords)
    }

    private suspend fun fetchRecordsFromTable(offset: String? = null): AirtableResponse = airtableClient.getRecords(baseId, tableId, viewId, offset)

    private suspend fun fetchRecord(recordId: String): Record = airtableClient.getRecord(baseId, tableId, recordId)

    suspend fun refreshWebhook(): Boolean {
        if (webhookId.isNullOrEmpty()) {
            logger.error("No webhook ID configured for provider $id")
            return false
        }

        return when (val responseStatus = airtableClient.refreshWebhook(baseId, webhookId)) {
            HttpURLConnection.HTTP_OK -> {
                logger.info("Successfully refreshed webhook $webhookId for table $tableId")
                true
            }
            else -> {
                logger.error("Failed to refresh webhook $webhookId with status $responseStatus")
                false
            }
        }
    }

    suspend fun updateCaches() {
        logger.info("Updating caches for provider $id")
        try {
            val freshTable = getTableFromAirTable()
            tableCache.invalidateAll()
            tableCache.put(id, freshTable)

            questionCache.invalidateAll()
            freshTable.records.forEach { record ->
                record.recordId?.let {
                    questionCache.put(it, record)
                }
            }

            val freshColumns = getColumnsFromAirTable()
            columnCache.invalidateAll()
            columnCache.put(id, freshColumns)
            logger.info("Caches updated successfully for provider $id")
        } catch (e: Exception) {
            logger.error("Error updating caches for provider $id", e)
        }
    }
}
