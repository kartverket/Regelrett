package no.bekk.database

import kotlinx.serialization.Serializable

@Serializable
data class DatabaseShare(
    val id: String,
    val contextId: String,
    val userId: String,
    val created: String,
    val expiresAt: String? = null,
)

@Serializable
data class DatabaseShareRequest(
    val userId: String,
    val expiresAt: String? = null,
    val sharedBy: String,
)
