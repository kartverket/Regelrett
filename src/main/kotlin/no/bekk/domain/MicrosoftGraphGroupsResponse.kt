package no.bekk.domain

import kotlinx.serialization.Serializable

@Serializable
data class MicrosoftGraphGroupsResponse(
    val value: List<MicrosoftGraphGroup>,
)

@Serializable
data class MicrosoftGraphGroup(
    val id: String,
    val displayName: String,
)

@Serializable
data class MicrosoftGraphUser(
    val id: String,
    val displayName: String,
    val mail: String?,
)

@Serializable
data class UserInfoResponse(
    val groups: List<MicrosoftGraphGroup>,
    val user: MicrosoftGraphUser,
    val superuser: Boolean,
)
