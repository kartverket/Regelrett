package no.bekk.routes

import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.testing.*
import kotlinx.serialization.json.Json
import no.bekk.MockAuthService
import no.bekk.TestUtils.generateTestToken
import no.bekk.TestUtils.testModule
import no.bekk.database.DatabaseAnswer
import no.bekk.database.DatabaseAnswerRequest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class AnswerRoutingTest {
    @Test
    fun `add answer`() = testApplication {
        application {
            testModule(
                answerRepository = object : MockAnswerRepository {
                    override fun insertAnswerOnContext(answer: DatabaseAnswerRequest): DatabaseAnswer = DatabaseAnswer(
                        actor = "actor",
                        recordId = "recordId",
                        questionId = "questionId",
                        answer = "answer",
                        updated = "updated",
                        answerType = "answerType",
                        contextId = "contextId",
                    )
                },
                authService = object : MockAuthService {
                    override suspend fun hasContextAccess(call: ApplicationCall, contextId: String): Boolean = true
                },
            )
        }
        val request = DatabaseAnswerRequest(
            actor = "actor",
            recordId = "recordId",
            questionId = "questionId",
            answer = "answer",
            answerType = "answerType",
            contextId = "contextId",
        )

        val response = client.post("/api/answer") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
            contentType(ContentType.Application.Json)
            setBody(Json.encodeToString(request))
        }

        assertEquals(HttpStatusCode.OK, response.status)
        val addedAnswer: DatabaseAnswer = Json.decodeFromString<DatabaseAnswer>(response.bodyAsText())
        assertEquals(request.actor, addedAnswer.actor)
        assertEquals(request.recordId, addedAnswer.recordId)
        assertEquals(request.questionId, addedAnswer.questionId)
        assertEquals(request.answer, addedAnswer.answer)
        assertEquals(request.contextId, addedAnswer.contextId)
    }

    @Test
    fun `add answer with contextId null returns BadRequest`() = testApplication {
        application {
            testModule()
        }
        val request = DatabaseAnswerRequest(
            actor = "actor",
            recordId = "recordId",
            questionId = "questionId",
            answer = "answer",
            answerType = "answerType",
            contextId = null,
        )

        val response = client.post("/api/answer") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
            contentType(ContentType.Application.Json)
            setBody(Json.encodeToString(request))
        }

        assertEquals(HttpStatusCode.BadRequest, response.status)
    }

    @Test
    fun `add answer without access returns Forbidden`() = testApplication {
        application {
            testModule(
                authService = object : MockAuthService {
                    override suspend fun hasContextAccess(call: ApplicationCall, contextId: String): Boolean = false
                },
            )
        }
        val request = DatabaseAnswerRequest(
            actor = "actor",
            recordId = "recordId",
            questionId = "questionId",
            answer = "answer",
            answerType = "answerType",
            contextId = "contextId",
        )

        val response = client.post("/api/answer") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
            contentType(ContentType.Application.Json)
            setBody(Json.encodeToString(request))
        }

        assertEquals(HttpStatusCode.Forbidden, response.status)
    }

    @Test
    fun `get answer by recordId and contextId`() = testApplication {
        val mockedAnswer = DatabaseAnswer(
            actor = "actor",
            recordId = "recordId",
            questionId = "questionId",
            answer = "answer",
            updated = "updated",
            answerType = "answerType",
            contextId = "contextId",
        )

        application {
            testModule(
                answerRepository = object : MockAnswerRepository {
                    override fun getAnswersByContextAndRecordIdFromDatabase(
                        contextId: String,
                        recordId: String,
                    ): List<DatabaseAnswer> = listOf(mockedAnswer)
                },
                authService = object : MockAuthService {
                    override suspend fun hasContextAccess(call: ApplicationCall, contextId: String): Boolean = true
                },
            )
        }

        val response = client.get("/api/answers?recordId=${mockedAnswer.recordId}&contextId=${mockedAnswer.contextId}") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
        }

        assertEquals(HttpStatusCode.OK, response.status)
        val fetchedAnswerList: List<DatabaseAnswer> = Json.decodeFromString(response.bodyAsText())
        assertEquals(1, fetchedAnswerList.size)
        assertEquals(mockedAnswer, fetchedAnswerList.first())
    }

    @Test
    fun `get answer by contextId`() = testApplication {
        val mockedAnswer = DatabaseAnswer(
            actor = "actor",
            recordId = "recordId",
            questionId = "questionId",
            answer = "answer",
            updated = "updated",
            answerType = "answerType",
        )

        application {
            testModule(
                answerRepository = object : MockAnswerRepository {
                    override fun getLatestAnswersByContextIdFromDatabase(
                        contextId: String,
                    ): List<DatabaseAnswer> = listOf(mockedAnswer)
                },
                authService = object : MockAuthService {
                    override suspend fun hasContextAccess(call: ApplicationCall, contextId: String): Boolean = true
                },
            )
        }

        val response = client.get("/api/answers?contextId=${mockedAnswer.contextId}") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
        }

        assertEquals(HttpStatusCode.OK, response.status)
        val fetchedAnswerList: List<DatabaseAnswer> = Json.decodeFromString(response.bodyAsText())
        assertEquals(1, fetchedAnswerList.size)
        assertEquals(mockedAnswer, fetchedAnswerList.first())
    }

    @Test
    fun `get answer with contextId null returns BadRequest `() = testApplication {
        application {
            testModule()
        }

        val response = client.get("/api/answers") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
        }
        assertEquals(HttpStatusCode.BadRequest, response.status)
    }

    @Test
    fun `get answer without access returns Forbidden`() = testApplication {
        application {
            testModule(
                authService = object : MockAuthService {
                    override suspend fun hasContextAccess(call: ApplicationCall, contextId: String): Boolean = false
                    override suspend fun hasReadContextAccess(call: ApplicationCall, contextId: String): Boolean = false
                },
            )
        }

        val response = client.get("/api/answers?contextId=contextId") {
            header(HttpHeaders.Authorization, "Bearer ${generateTestToken()}")
        }
        assertEquals(HttpStatusCode.Forbidden, response.status)
    }
}
