package no.bekk.model.internal

import kotlinx.serialization.Serializable

@Serializable
data class Option(
    val name: String,
    val color: String? = null,
)

@Serializable
data class Column(
    val type: OptionalFieldType,
    val name: String,
    val options: List<Option>? = null,
)

@Serializable
data class FormWithoutId(
    val name: String,
    val columns: List<Column>,
    val records: List<Question>,
)

@Serializable
data class Form(
    val id: String,
    val name: String,
    val columns: List<Column>,
    val records: List<Question>,
)

@Serializable
data class Schema(
    val id: String,
    val name: String,
)
