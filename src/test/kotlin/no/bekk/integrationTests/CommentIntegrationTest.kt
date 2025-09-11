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
import org.junit.jupiter.api.AfterAll
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test

class CommentIntegrationTest {

    @Test
    @Tag("IntegrationTest")
    fun `Add, get and delete comment`() = testApplication {
        val database = JDBCDatabase.create(testDatabase.getTestdatabaseConfig())
        val commentRepository = CommentRepositoryImpl(database)
        val authService = object : MockAuthService {
            override suspend fun hasTeamAccess(call: ApplicationCall, teamId: String?): Boolean = true

            override suspend fun hasContextAccess(call: ApplicationCall, contextId: String): Boolean = true
        }
        application {
            testModule(
                database,
                commentRepository = commentRepository,
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

        // Add comment
        val request = DatabaseCommentRequest(
            contextId = contextId,
            actor = "actor",
            recordId = "recordId",
            questionId = "questionId",
            comment = "comment",
        )
        response = client.post("/api/comments") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
            contentType(ContentType.Application.Json)
            setBody(Json.encodeToString(request))
        }
        assertEquals(HttpStatusCode.OK, response.status)

        // Get comment
        response = client.get("/api/comments?contextId=$contextId") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
        }

        val commentList: List<DatabaseComment> = Json.decodeFromString(response.bodyAsText())
        assertEquals(1, commentList.size)
        commentList.first().let {
            assertEquals(contextId, it.contextId)
            assertEquals("actor", it.actor)
            assertEquals("recordId", it.recordId)
            assertEquals("questionId", it.questionId)
            assertEquals("comment", it.comment)
        }

        // Delete comment
        response = client.delete("/api/comments?contextId=$contextId&recordId=recordId") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
        }
        assertEquals(HttpStatusCode.OK, response.status)
        assertEquals("Comment was successfully deleted.", response.bodyAsText())
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
