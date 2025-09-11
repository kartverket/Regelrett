package no.bekk.database

import kotlinx.serialization.Serializable

@Serializable
data class DatabaseAnswer(
    val actor: String,
    val recordId: String,
    val questionId: String,
    val answer: String? = null,
    val updated: String,
    val answerType: String,
    val answerUnit: String? = null,
    val contextId: String? = null,
)

@Serializable
data class DatabaseAnswerRequest(
    val actor: String,
    val recordId: String,
    val questionId: String,
    val answer: String? = null,
    val answerType: String,
    val answerUnit: String? = null,
    val contextId: String? = null,
)
