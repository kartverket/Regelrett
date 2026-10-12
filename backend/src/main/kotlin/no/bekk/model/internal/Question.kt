package no.bekk.model.internal

import kotlinx.serialization.Serializable

enum class OptionalFieldType {
    OPTION_MULTIPLE,
    OPTION_SINGLE,
    TEXT,
}

@Serializable
data class Question(
    val id: String,
    val recordId: String? = null,
    val description: String,
    val name: String? = null,
    val metadata: QuestionMetadata,
    val updated: String? = null,
)

@Serializable
data class OptionalField(
    val key: String,
    val value: List<String>,
    val type: OptionalFieldType? = null,
    val options: List<String>? = null,
)

@Serializable
data class QuestionMetadata(
    val answerMetadata: AnswerMetadata,
    val optionalFields: List<OptionalField>? = null,
)
