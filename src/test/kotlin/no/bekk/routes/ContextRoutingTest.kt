package no.bekk.routes

import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.testing.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import no.bekk.MockAuthService
import no.bekk.TestUtils.generateTestToken
import no.bekk.TestUtils.testModule
import no.bekk.database.DatabaseContext
import no.bekk.database.DatabaseContextRequest
import no.bekk.exception.ConflictException
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class ContextRoutingTest {
    @Test
    fun `add context`() = testApplication {
        application {
            testModule(
                contextRepository = object : MockContextRepository {
                    override fun insertContext(context: DatabaseContextRequest): DatabaseContext = DatabaseContext(
                        id = "id",
                        teamId = "teamId",
                        formId = "formId",
                        name = "name",
                    )
                },
                authService = object : MockAuthService {
                    override suspend fun hasTeamAccess(call: ApplicationCall, teamId: String?): Boolean = true
                },
            )
        }
        val request = DatabaseContextRequest(
            teamId = "teamId",
            formId = "formId",
            name = "name",
        )

        val response = client.post("/api/contexts") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
            contentType(ContentType.Application.Json)
            setBody(Json.encodeToString(request))
        }

        assertEquals(HttpStatusCode.Created, response.status)
        val addedContext: DatabaseContext = Json.decodeFromString(response.bodyAsText())
        assertEquals(request.teamId, addedContext.teamId)
        assertEquals(request.formId, addedContext.formId)
        assertEquals(request.name, addedContext.name)
    }

    @Test
    fun `add context without team access returns Forbidden`() = testApplication {
        application {
            testModule(
                authService = object : MockAuthService {
                    override suspend fun hasTeamAccess(call: ApplicationCall, teamId: String?): Boolean = false
                },
            )
        }
        val request = DatabaseContextRequest(
            teamId = "teamId",
            formId = "formId",
            name = "name",
        )

        val response = client.post("/api/contexts") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
            contentType(ContentType.Application.Json)
            setBody(Json.encodeToString(request))
        }

        assertEquals(HttpStatusCode.Forbidden, response.status)
    }

    @Test
    fun `add context with Unique constraint violation`() = testApplication {
        application {
            testModule(
                contextRepository = object : MockContextRepository {
                    override fun insertContext(context: DatabaseContextRequest): DatabaseContext = throw ConflictException("A context with the same team_id, table_id and name already exists.")
                },
                authService = object : MockAuthService {
                    override suspend fun hasTeamAccess(call: ApplicationCall, teamId: String?): Boolean = true
                },
            )
        }
        val request = DatabaseContextRequest(
            teamId = "teamId",
            formId = "formId",
            name = "name",
        )

        val response = client.post("/api/contexts") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
            contentType(ContentType.Application.Json)
            setBody(Json.encodeToString(request))
        }

        assertEquals(HttpStatusCode.Conflict, response.status)
    }

    @Test
    fun `add context with copy answers`() = testApplication {
        application {
            testModule(
                contextRepository = object : MockContextRepository {
                    override fun insertContext(context: DatabaseContextRequest): DatabaseContext = DatabaseContext(
                        id = "id",
                        teamId = "teamId",
                        formId = "formId",
                        name = "name",
                    )
                },
                authService = object : MockAuthService {
                    override suspend fun hasTeamAccess(call: ApplicationCall, teamId: String?): Boolean = true

                    override suspend fun hasContextAccess(call: ApplicationCall, contextId: String): Boolean = true
                },
                answerRepository = object : MockAnswerRepository {
                    override fun copyAnswersFromOtherContext(newContextId: String, contextToCopy: String) {}
                },
            )
        }
        val request = DatabaseContextRequest(
            teamId = "teamId",
            formId = "formId",
            name = "name",
            copyContext = "copyContext",
        )

        val response = client.post("/api/contexts") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
            contentType(ContentType.Application.Json)
            setBody(Json.encodeToString(request))
        }

        assertEquals(HttpStatusCode.Created, response.status)
        val addedContext: DatabaseContext = Json.decodeFromString(response.bodyAsText())
        assertEquals(request.teamId, addedContext.teamId)
        assertEquals(request.formId, addedContext.formId)
        assertEquals(request.name, addedContext.name)
    }

    @Test
    fun `get context by teamId and formId`() = testApplication {
        val mockedContext = DatabaseContext(
            id = "id",
            teamId = "teamId",
            formId = "formId",
            name = "name",
        )

        application {
            testModule(
                contextRepository = object : MockContextRepository {
                    override fun getContextByTeamIdAndFormId(teamId: String, formId: String): List<DatabaseContext> = listOf(mockedContext)
                },
                authService = object : MockAuthService {
                    override suspend fun hasTeamAccess(call: ApplicationCall, teamId: String?): Boolean = true
                },
            )
        }

        val response = client.get("/api/contexts?teamId=${mockedContext.teamId}&formId=${mockedContext.formId}") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
        }

        assertEquals(HttpStatusCode.OK, response.status)
        val fetchedContextList: List<DatabaseContext> = Json.decodeFromString(response.bodyAsText())
        assertEquals(1, fetchedContextList.size)
        assertEquals(mockedContext, fetchedContextList.first())
    }

    @Test
    fun `get context by teamId`() = testApplication {
        val mockedContext = DatabaseContext(
            id = "id",
            teamId = "teamId",
            formId = "formId",
            name = "name",
        )

        application {
            testModule(
                contextRepository = object : MockContextRepository {
                    override fun getContextsByTeamId(teamId: String): List<DatabaseContext> = listOf(mockedContext)
                },
                authService = object : MockAuthService {
                    override suspend fun hasTeamAccess(call: ApplicationCall, teamId: String?): Boolean = true
                },
            )
        }

        val response = client.get("/api/contexts?teamId=${mockedContext.teamId}") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
        }

        assertEquals(HttpStatusCode.OK, response.status)
        val fetchedContextList: List<DatabaseContext> = Json.decodeFromString(response.bodyAsText())
        assertEquals(1, fetchedContextList.size)
        assertEquals(mockedContext, fetchedContextList.first())
    }

    @Test
    fun `get context by name`() = testApplication {
        val mockedContext = DatabaseContext(
            id = "id",
            teamId = "teamId",
            formId = "formId",
            name = "name",
        )

        application {
            testModule(
                contextRepository = object : MockContextRepository {
                    override fun getContextsByName(name: String): List<DatabaseContext> = listOf(mockedContext)
                },
                authService = object : MockAuthService {
                    override suspend fun hasContextAccess(call: ApplicationCall, contextId: String): Boolean = true
                },
            )
        }

        val response = client.get("/api/contexts/name?name=${mockedContext.name}") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
        }

        assertEquals(HttpStatusCode.OK, response.status)
        val fetchedContextList: List<DatabaseContext> = Json.decodeFromString(response.bodyAsText())
        assertEquals(1, fetchedContextList.size)
        assertEquals(mockedContext, fetchedContextList.first())
    }

    @Test
    fun `get context missing teamId returns BadRequest`() = testApplication {
        application {
            testModule()
        }

        val response = client.get("/api/contexts") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
        }
        assertEquals(HttpStatusCode.BadRequest, response.status)
    }

    @Test
    fun `get context missing team access returns Forbidden`() = testApplication {
        application {
            testModule(
                authService = object : MockAuthService {
                    override suspend fun hasTeamAccess(call: ApplicationCall, teamId: String?): Boolean = false
                },
            )
        }

        val response = client.get("/api/contexts?teamId=teamId") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
        }
        assertEquals(HttpStatusCode.Forbidden, response.status)
    }

    @Test
    fun `get context by contextId`() = testApplication {
        val mockedContext = DatabaseContext(
            id = "id",
            teamId = "teamId",
            formId = "formId",
            name = "name",
        )

        application {
            testModule(
                contextRepository = object : MockContextRepository {
                    override fun getContext(id: String): DatabaseContext = mockedContext
                },
                authService = object : MockAuthService {
                    override suspend fun hasContextAccess(call: ApplicationCall, contextId: String): Boolean = true
                },
            )
        }

        val response = client.get("/api/contexts/${mockedContext.id}") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
        }

        assertEquals(HttpStatusCode.OK, response.status)
        val fetchedContext: DatabaseContext = Json.decodeFromString(response.bodyAsText())
        assertEquals(mockedContext, fetchedContext)
    }

    @Test
    fun `get context missing context access returns Forbidden`() = testApplication {
        application {
            testModule(
                authService = object : MockAuthService {
                    override suspend fun hasContextAccess(call: ApplicationCall, contextId: String): Boolean = false
                    override suspend fun hasReadContextAccess(call: ApplicationCall, contextId: String): Boolean = false
                },
            )
        }

        val response = client.get("/api/contexts/contextId") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
        }
        assertEquals(HttpStatusCode.Forbidden, response.status)
    }

    @Test
    fun `delete context`() = testApplication {
        var deletedContextId: String? = null
        application {
            testModule(
                contextRepository = object : MockContextRepository {
                    override fun deleteContext(id: String): Boolean {
                        deletedContextId = id
                        return true
                    }
                },
                authService = object : MockAuthService {
                    override suspend fun hasContextAccess(call: ApplicationCall, contextId: String): Boolean = true
                },
            )
        }

        val response = client.delete("/api/contexts/1") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
        }

        assertEquals(HttpStatusCode.OK, response.status)
        assertEquals("1", deletedContextId)
        assertEquals("Context and its answers and comments were successfully deleted.", response.bodyAsText())
    }

    @Test
    fun `delete context missing context access returns Forbidden`() = testApplication {
        application {
            testModule(
                authService = object : MockAuthService {
                    override suspend fun hasContextAccess(call: ApplicationCall, contextId: String): Boolean = false
                },
            )
        }

        val response = client.delete("/api/contexts/1") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
        }
        assertEquals(HttpStatusCode.Forbidden, response.status)
    }

    @Test
    fun `update context team`() = testApplication {
        val newTeamName = "newTeamName"
        application {
            testModule(
                contextRepository = object : MockContextRepository {
                    override fun changeTeam(contextId: String, newTeamId: String): Boolean = true
                },
                authService = object : MockAuthService {
                    override suspend fun hasContextAccess(call: ApplicationCall, contextId: String): Boolean = true

                    override suspend fun getTeamIdFromName(call: ApplicationCall, teamName: String): String? = newTeamName
                },
            )
        }
        val request = TeamUpdateRequest(newTeamName)

        val response = client.patch("/api/contexts/id/team") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
            contentType(ContentType.Application.Json)
            setBody(Json.encodeToString(request))
        }
        assertEquals(HttpStatusCode.OK, response.status)
    }

    @Test
    fun `update context team missing team name returns BadRequest`() = testApplication {
        application {
            testModule(
                authService = object : MockAuthService {
                    override suspend fun hasContextAccess(call: ApplicationCall, contextId: String): Boolean = true
                },
            )
        }

        val response = client.patch("/api/contexts/id/team") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
            contentType(ContentType.Application.Json)
            setBody(Json.encodeToString(TeamUpdateRequest(null)))
        }
        assertEquals(HttpStatusCode.BadRequest, response.status)
    }

    @Test
    fun `update context team missing context access returns Forbidden`() = testApplication {
        val newTeamName = "newTeamName"
        application {
            testModule(
                authService = object : MockAuthService {
                    override suspend fun hasContextAccess(call: ApplicationCall, contextId: String): Boolean = false
                },
            )
        }

        val response = client.patch("/api/contexts/id/team") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
            contentType(ContentType.Application.Json)
            setBody(Json.encodeToString(TeamUpdateRequest(newTeamName)))
        }
        assertEquals(HttpStatusCode.Forbidden, response.status)
    }

    @Test
    fun `update context team not valid team returns BadRequest`() = testApplication {
        application {
            testModule(
                authService = object : MockAuthService {
                    override suspend fun hasContextAccess(call: ApplicationCall, contextId: String): Boolean = true

                    override suspend fun getTeamIdFromName(call: ApplicationCall, teamName: String): String? = null
                },
            )
        }

        val response = client.patch("/api/contexts/id/team") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
            contentType(ContentType.Application.Json)
            setBody(Json.encodeToString(TeamUpdateRequest("newTeamName")))
        }
        assertEquals(HttpStatusCode.BadRequest, response.status)
    }

    @Test
    fun `copy answers from other context`() = testApplication {
        application {
            testModule(
                answerRepository = object : MockAnswerRepository {
                    override fun copyAnswersFromOtherContext(newContextId: String, contextToCopy: String) {}
                },
                authService = object : MockAuthService {
                    override suspend fun hasContextAccess(call: ApplicationCall, contextId: String): Boolean = true
                },
            )
        }

        val response = client.patch("/api/contexts/id/answers") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
            contentType(ContentType.Application.Json)
            setBody(Json.encodeToString(CopyContextRequest("contextToCopyFrom")))
        }
        assertEquals(HttpStatusCode.OK, response.status)
    }

    @Test
    fun `copy answers from other context missing contextId returns BadRequest`() = testApplication {
        application {
            testModule()
        }

        val response = client.patch("/api/contexts/id/answers") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
            contentType(ContentType.Application.Json)
            setBody(Json.encodeToString(CopyContextRequest(null)))
        }
        assertEquals(HttpStatusCode.BadRequest, response.status)
    }

    @Test
    fun `copy answers from other context missing context access return Forbidden`() = testApplication {
        application {
            testModule(
                authService = object : MockAuthService {
                    override suspend fun hasContextAccess(call: ApplicationCall, contextId: String): Boolean = false
                },
            )
        }

        val response = client.patch("/api/contexts/id/answers") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
            contentType(ContentType.Application.Json)
            setBody(Json.encodeToString(CopyContextRequest("contextToCopyFrom")))
        }
        assertEquals(HttpStatusCode.Forbidden, response.status)
    }
}
