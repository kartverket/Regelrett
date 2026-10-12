package no.bekk.database

import kotlinx.serialization.Serializable

@Serializable
data class DatabaseComment(
    val actor: String,
    val recordId: String,
    val questionId: String,
    val comment: String,
    val updated: String,
    val contextId: String? = null,
)

@Serializable
data class DatabaseCommentRequest(
    val actor: String,
    val recordId: String,
    val questionId: String,
    val comment: String,
    val contextId: String? = null,
)
