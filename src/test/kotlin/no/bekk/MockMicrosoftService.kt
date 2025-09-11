package no.bekk

import no.bekk.domain.MicrosoftGraphGroup
import no.bekk.domain.MicrosoftGraphUser
import no.bekk.services.MicrosoftService

interface MockMicrosoftService : MicrosoftService {
    override suspend fun requestTokenOnBehalfOf(jwtToken: String?): String = TODO("Not yet implemented")
    override suspend fun fetchGroups(bearerToken: String): List<MicrosoftGraphGroup> = TODO("Not yet implemented")
    override suspend fun fetchCurrentUser(bearerToken: String): MicrosoftGraphUser = TODO("Not yet implemented")
    override suspend fun fetchUserByUserId(bearerToken: String, userId: String): MicrosoftGraphUser = TODO("Not yet implemented")
}
