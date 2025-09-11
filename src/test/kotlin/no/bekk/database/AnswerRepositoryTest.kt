package no.bekk.database

import no.bekk.TestDatabase
import no.bekk.configuration.Database
import no.bekk.configuration.JDBCDatabase
import org.junit.jupiter.api.AfterAll
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test

class AnswerRepositoryTest {
    @Test
    @Tag("IntegrationTest")
    fun `insert and get answers by contextId`() {
        val (answerRepository, _, context) = defaultSetup()
        val request = DatabaseAnswerRequest(
            actor = "actor",
            recordId = "recordId",
            questionId = "questionId",
            answer = "answer",
            answerType = "answerType",
            contextId = context.id,
        )
        answerRepository.insertAnswerOnContext(request)

        val fetchedAnswers = answerRepository.getLatestAnswersByContextIdFromDatabase(context.id)
        assertEquals(1, fetchedAnswers.size)
        assertEquals(request.actor, fetchedAnswers.first().actor)
        assertEquals(request.recordId, fetchedAnswers.first().recordId)
        assertEquals(request.questionId, fetchedAnswers.first().questionId)
        assertEquals(request.answer, fetchedAnswers.first().answer)
        assertEquals(request.answerType, fetchedAnswers.first().answerType)
        assertEquals(request.contextId, fetchedAnswers.first().contextId)
    }

    @Test
    @Tag("IntegrationTest")
    fun `insert and get answers by contextId and recordId`() {
        val (answerRepository, _, context) = defaultSetup()
        val request = DatabaseAnswerRequest(
            actor = "actor",
            recordId = "recordId",
            questionId = "questionId",
            answer = "answer",
            answerType = "answerType",
            contextId = context.id,
        )
        answerRepository.insertAnswerOnContext(request)

        val fetchedAnswers =
            answerRepository.getAnswersByContextAndRecordIdFromDatabase(context.id, request.recordId)
        assertEquals(1, fetchedAnswers.size)
        assertEquals(request.actor, fetchedAnswers.first().actor)
        assertEquals(request.recordId, fetchedAnswers.first().recordId)
        assertEquals(request.questionId, fetchedAnswers.first().questionId)
        assertEquals(request.answer, fetchedAnswers.first().answer)
        assertEquals(request.answerType, fetchedAnswers.first().answerType)
        assertEquals(request.contextId, fetchedAnswers.first().contextId)
    }

    @Test
    @Tag("IntegrationTest")
    fun `copy answers from other context`() {
        val (answerRepository, contextRepository, sourceContext) = defaultSetup()
        val destinationContext = contextRepository.insertContext(DatabaseContextRequest("teamId2", "formId2", "name2"))
        val request = DatabaseAnswerRequest(
            actor = "actor",
            recordId = "recordId",
            questionId = "questionId",
            answer = "answer",
            answerType = "answerType",
            contextId = sourceContext.id,
        )
        answerRepository.insertAnswerOnContext(request)

        answerRepository.copyAnswersFromOtherContext(destinationContext.id, sourceContext.id)

        val destinationContextAnswers = answerRepository.getLatestAnswersByContextIdFromDatabase(destinationContext.id)
        assertEquals(1, destinationContextAnswers.size)
        assertEquals(request.actor, destinationContextAnswers.first().actor)
        assertEquals(request.recordId, destinationContextAnswers.first().recordId)
        assertEquals(request.questionId, destinationContextAnswers.first().questionId)
        assertEquals(request.answer, destinationContextAnswers.first().answer)
        assertEquals(request.answerType, destinationContextAnswers.first().answerType)
        assertEquals(destinationContext.id, destinationContextAnswers.first().contextId)
    }

    private fun defaultSetup(
        teamId: String = "teamId",
        formId: String = "formId",
        name: String = "name",
    ): Triple<AnswerRepositoryImpl, ContextRepository, DatabaseContext> {
        val contextRepository = ContextRepositoryImpl(database)
        val answerRepository = AnswerRepositoryImpl(database)

        val context = contextRepository.insertContext(DatabaseContextRequest(teamId, formId, name))
        return Triple(answerRepository, contextRepository, context)
    }

    @AfterEach
    fun cleanup() {
        database.getConnection().use { connection ->
            connection.createStatement().use { statement ->
                statement.executeUpdate("DELETE FROM answers")
                statement.executeUpdate("DELETE FROM contexts")
            }
        }
    }

    companion object {

        private lateinit var testDatabase: TestDatabase
        private lateinit var database: Database

        @JvmStatic
        @BeforeAll
        fun setup() {
            testDatabase = TestDatabase()
            database = JDBCDatabase.create(testDatabase.getTestdatabaseConfig())
        }

        @JvmStatic
        @AfterAll
        fun stopDatabase() {
            testDatabase.stopTestDatabase()
        }
    }
}
