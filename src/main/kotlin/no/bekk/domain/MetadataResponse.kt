package no.bekk.domain

import kotlinx.serialization.Serializable

@Serializable
data class MetadataResponse(
    val tables: List<Metadata>,
    val offset: String? = null,
)

@Serializable
data class Metadata(
    val id: String,
    val name: String,
    val primaryFieldId: String,
    val fields: List<Field>? = null,
    val views: List<View>? = null,
)

@Serializable
data class Field(
    val type: String,
    val id: String,
    val name: String,
    val options: Options? = null,
)

@Serializable
data class Options(
    val choices: List<Choice>? = null,
    val linkedTableId: String? = null,
    val isReversed: Boolean? = null,
    val prefersSingleRecordLink: Boolean? = null,
    val inverseLinkFieldId: String? = null,
)

@Serializable
data class Choice(
    val id: String,
    val name: String,
    val color: String? = null,
)

@Serializable
data class View(
    val id: String,
    val name: String,
    val type: String,
)
