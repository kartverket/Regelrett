package no.bekk.database

import no.bekk.configuration.Database
import org.slf4j.LoggerFactory
import java.sql.SQLException
import java.util.*

interface AnswerRepository {
    fun getLatestAnswersByContextIdFromDatabase(contextId: String): List<DatabaseAnswer>
    fun getAnswersByContextAndRecordIdFromDatabase(contextId: String, recordId: String): List<DatabaseAnswer>
    fun copyAnswersFromOtherContext(newContextId: String, contextToCopy: String)
    fun insertAnswerOnContext(answer: DatabaseAnswerRequest): DatabaseAnswer
    fun insertAnswersOnContextBatch(answers: List<DatabaseAnswerRequest>): List<DatabaseAnswer>
}

class AnswerRepositoryImpl(private val database: Database) : AnswerRepository {
    private val logger = LoggerFactory.getLogger(AnswerRepositoryImpl::class.java)
    override fun getLatestAnswersByContextIdFromDatabase(contextId: String): List<DatabaseAnswer> {
        logger.debug("Fetching latest answers from database for contextId: $contextId")

        return try {
            database.getConnection().use { conn ->
                val statement = conn.prepareStatement(
                    """
                SELECT DISTINCT ON (question_id) id, actor, record_id, question_id, answer, updated, answer_type, answer_unit 
                FROM answers
                WHERE context_id = ?
                ORDER BY question_id, updated DESC
            """,
                )
                statement.setObject(1, UUID.fromString(contextId))
                val resultSet = statement.executeQuery()
                buildList {
                    while (resultSet.next()) {
                        add(
                            DatabaseAnswer(
                                actor = resultSet.getString("actor"),
                                recordId = resultSet.getString("record_id"),
                                questionId = resultSet.getString("question_id"),
                                answer = resultSet.getString("answer"),
                                updated = resultSet.getObject("updated", java.time.LocalDateTime::class.java)
                                    ?.toString() ?: "",
                                answerType = resultSet.getString("answer_type"),
                                answerUnit = resultSet.getString("answer_unit"),
                                contextId = contextId,
                            ),
                        )
                    }
                }.also {
                    logger.debug("Successfully fetched latest context's $contextId answers from database.")
                }
            }
        } catch (e: SQLException) {
            logger.error("Error fetching latest answers from database for contextId: $contextId. ${e.message}", e)
            throw RuntimeException("Error fetching latest answers from database", e)
        }
    }

    override fun getAnswersByContextAndRecordIdFromDatabase(
        contextId: String,
        recordId: String,
    ): List<DatabaseAnswer> {
        logger.debug("Fetching answers from database for contextId: $contextId with recordId: $recordId")

        return try {
            database.getConnection().use { conn ->
                val statement = conn.prepareStatement(
                    "SELECT id, actor, question_id, answer, updated, answer_type, answer_unit FROM answers WHERE context_id = ? AND record_id = ? order by updated",
                )
                statement.setObject(1, UUID.fromString(contextId))
                statement.setString(2, recordId)
                val resultSet = statement.executeQuery()
                buildList {
                    while (resultSet.next()) {
                        add(
                            DatabaseAnswer(
                                actor = resultSet.getString("actor"),
                                recordId = recordId,
                                questionId = resultSet.getString("question_id"),
                                answer = resultSet.getString("answer"),
                                updated = resultSet.getObject("updated", java.time.LocalDateTime::class.java)
                                    .toString(),
                                answerType = resultSet.getString("answer_type"),
                                answerUnit = resultSet.getString("answer_unit"),
                                contextId = contextId,
                            ),
                        )
                    }
                }.also {
                    logger.debug("Successfully fetched context's $contextId answers with record id $recordId from database.")
                }
            }
        } catch (e: SQLException) {
            logger.error(
                "Error fetching answers from database for contextId: $contextId with recordId $recordId. ${e.message}",
                e,
            )
            throw RuntimeException("Error fetching answers from database", e)
        }
    }

    override fun copyAnswersFromOtherContext(newContextId: String, contextToCopy: String) {
        logger.info("Copying most recent answers from context $contextToCopy to new context $newContextId")
        val mostRecentAnswers = getLatestAnswersByContextIdFromDatabase(contextToCopy)

        val databaseAnswerRequestList = mostRecentAnswers.map { answer ->
            DatabaseAnswerRequest(
                actor = answer.actor,
                recordId = answer.recordId,
                questionId = answer.questionId,
                answer = answer.answer,
                answerType = answer.answerType,
                answerUnit = answer.answerUnit,
                contextId = newContextId,
            )
        }
        if (databaseAnswerRequestList.isEmpty()) return

        try {
            insertAnswersOnContextBatch(databaseAnswerRequestList)
        } catch (e: SQLException) {
            logger.error(
                "Error copying answers to context $newContextId: ${e.message}",
                e,
            )
            throw RuntimeException("Error copying answers to new context", e)
        }
    }

    override fun insertAnswerOnContext(answer: DatabaseAnswerRequest): DatabaseAnswer {
        logger.debug("Inserting answer into database: {}", answer)
        try {
            return insertAnswersOnContextBatch(listOf(answer)).first()
        } catch (e: SQLException) {
            logger.error("Error inserting answer row into database: ${e.message}")
            throw RuntimeException("Error fetching answers from database", e)
        }
    }

    override fun insertAnswersOnContextBatch(answers: List<DatabaseAnswerRequest>): List<DatabaseAnswer> {
        answers.forEach { require(it.contextId != null) { "You have to supply a contextId" } }

        logger.debug("Inserting {} answers into database", answers.size)

        val sqlInsertStatement = """
        INSERT INTO answers (actor, record_id, question_id, answer, answer_type, answer_unit, context_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?);
        """.trimIndent()

        val selectStatement = """
        SELECT * FROM answers
        WHERE record_id IN (${answers.joinToString(",") { "'${it.recordId}'" }});
        """.trimIndent()

        return try {
            database.getConnection().use { conn ->
                conn.prepareStatement(sqlInsertStatement).use { statement ->
                    for (answer in answers) {
                        statement.setString(1, answer.actor)
                        statement.setString(2, answer.recordId)
                        statement.setString(3, answer.questionId)
                        statement.setString(4, answer.answer)
                        statement.setString(5, answer.answerType)
                        statement.setString(6, answer.answerUnit)
                        statement.setObject(7, UUID.fromString(answer.contextId))
                        statement.addBatch()
                    }
                    statement.executeBatch()
                }

                conn.prepareStatement(selectStatement).use { selectStmt ->
                    val resultSet = selectStmt.executeQuery()
                    val insertedAnswers = mutableListOf<DatabaseAnswer>()

                    while (resultSet.next()) {
                        insertedAnswers.add(
                            DatabaseAnswer(
                                actor = resultSet.getString("actor"),
                                recordId = resultSet.getString("record_id"),
                                questionId = resultSet.getString("question_id"),
                                answer = resultSet.getString("answer"),
                                updated = resultSet.getObject("updated", java.time.LocalDateTime::class.java)
                                    .toString(),
                                answerType = resultSet.getString("answer_type"),
                                answerUnit = resultSet.getString("answer_unit"),
                                contextId = resultSet.getString("context_id"),
                            ),
                        )
                    }
                    insertedAnswers
                }
            }
        } catch (e: SQLException) {
            logger.error("Error inserting answers into database: ${e.message}")
            throw RuntimeException("Error inserting answers into database", e)
        }
    }
}
