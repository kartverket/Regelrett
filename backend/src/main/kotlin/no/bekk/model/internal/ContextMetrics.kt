package no.bekk.model.internal

import kotlinx.serialization.Serializable

@Serializable
data class ContextMetrics(
    val teamId: String,
    val formName: String,
    val contextName: String,
    val answerCount: Int,
    val questionCount: Int,
    val oldestUpdate: String?,
)
