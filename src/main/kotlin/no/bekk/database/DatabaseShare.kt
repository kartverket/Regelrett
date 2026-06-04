package no.bekk.database

import kotlinx.serialization.Serializable

@Serializable
data class DatabaseShare(
    val id: String,
    val contextId: String,
    val userId: String,
    val accessLevel: String,
    val created: String,
)

@Serializable
data class DatabaseShareRequest(
    val contextId: String,
    val userId: String,
    val accessLevel: String,
)