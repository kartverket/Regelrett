package no.bekk.database

import kotlinx.serialization.Serializable

@Serializable
data class DatabaseReadGrant(
    val id: String,
    val contextId: String,
    val userId: String,
    val created: String,
    val expiresAt: String,
)

@Serializable
data class DatabaseReadGrantRequest(
    val userId: String,
    val expiresAt: String,
    val justification: String,
    val sharedBy: String,
)
