package no.bekk.integrationTests

import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.testing.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import no.bekk.MockAuthService
import no.bekk.TestDatabase
import no.bekk.TestUtils.generateTestToken
import no.bekk.TestUtils.testModule
import no.bekk.configuration.JDBCDatabase
import no.bekk.database.*
import no.bekk.model.internal.AnswerType
import org.junit.jupiter.api.AfterAll
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test

class AnswerIntegrationTest {

    @Test
    @Tag("IntegrationTest")
    fun `Add and get answer`() = testApplication {
        val database = JDBCDatabase.create(testDatabase.getTestdatabaseConfig())
        val answerRepository = AnswerRepositoryImpl(database)
        val authService = object : MockAuthService {
            override suspend fun hasTeamAccess(call: ApplicationCall, teamId: String?): Boolean = true

            override suspend fun hasContextAccess(call: ApplicationCall, contextId: String): Boolean = true
        }
        application {
            testModule(
                database,
                answerRepository = answerRepository,
                authService = authService,
            )
        }

        // Create and get context to obtain contextId
        var response = client.post("/api/contexts") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
            contentType(ContentType.Application.Json)
            setBody(
                Json.encodeToString(
                    DatabaseContextRequest("teamId", "formId", "name"),
                ),
            )
        }

        assertEquals(HttpStatusCode.Created, response.status)

        response = client.get("/api/contexts?formId=formId&teamId=teamId") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
        }
        val contextList: List<DatabaseContext> = Json.decodeFromString(response.bodyAsText())
        assertEquals(1, contextList.size)
        val contextId = contextList.first().id

        // Add answer
        val request = DatabaseAnswerRequest(
            contextId = contextId,
            actor = "actor",
            recordId = "recordId",
            questionId = "questionId",
            answerType = AnswerType.PERCENT.toString(),
            answer = "1",
        )
        response = client.post("/api/answer") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
            contentType(ContentType.Application.Json)
            setBody(Json.encodeToString(request))
        }
        assertEquals(HttpStatusCode.OK, response.status)

        // Get answer
        response = client.get("/api/answers?contextId=$contextId") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
        }

        val answerList: List<DatabaseAnswer> = Json.decodeFromString(response.bodyAsText())
        assertEquals(1, answerList.size)
        answerList.first().let {
            assertEquals(contextId, it.contextId)
            assertEquals("actor", it.actor)
            assertEquals("recordId", it.recordId)
            assertEquals("questionId", it.questionId)
            assertEquals(AnswerType.PERCENT.toString(), it.answerType)
            assertEquals("1", it.answer)
        }
    }

    companion object {

        private lateinit var testDatabase: TestDatabase

        @JvmStatic
        @BeforeAll
        fun setup() {
            testDatabase = TestDatabase()
        }

        @JvmStatic
        @AfterAll
        fun cleanup() {
            testDatabase.stopTestDatabase()
        }
    }
}
