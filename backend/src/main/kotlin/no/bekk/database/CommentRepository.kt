package no.bekk.database

import no.bekk.configuration.Database
import org.slf4j.LoggerFactory
import java.sql.ResultSet
import java.sql.SQLException
import java.util.*

interface CommentRepository {
    fun getCommentsByContextIdFromDatabase(contextId: String): List<DatabaseComment>
    fun getCommentsByContextAndRecordIdFromDatabase(contextId: String, recordId: String): List<DatabaseComment>
    fun insertCommentOnContext(comment: DatabaseCommentRequest): DatabaseComment
    fun insertCommentsOnContextBatch(comments: List<DatabaseCommentRequest>): List<DatabaseComment>
    fun deleteCommentFromDatabase(contextId: String, recordId: String): Boolean
    fun copyCommentsFromOtherContext(newContextId: String, contextToCopy: String)
}

class CommentRepositoryImpl(private val database: Database) : CommentRepository {
    private val logger = LoggerFactory.getLogger(CommentRepositoryImpl::class.java)
    override fun getCommentsByContextIdFromDatabase(contextId: String): List<DatabaseComment> {
        logger.debug("Fetching comments for context: $contextId")

        return try {
            database.getConnection().use { conn ->
                val statement = conn.prepareStatement(
                    "SELECT id, actor, record_id, question_id, comment, updated FROM comments WHERE context_id = ? order by updated",
                )
                statement.setObject(1, UUID.fromString(contextId))
                val resultSet = statement.executeQuery()
                buildList {
                    while (resultSet.next()) {
                        add(
                            DatabaseComment(
                                actor = resultSet.getString("actor"),
                                recordId = resultSet.getString("record_id"),
                                questionId = resultSet.getString("question_id"),
                                comment = resultSet.getString("comment"),
                                updated = resultSet.getObject("updated", java.time.LocalDateTime::class.java)
                                    ?.toString() ?: "",
                                contextId = contextId,
                            ),
                        )
                    }
                }.also {
                    logger.debug("Successfully fetched context's $contextId comments from database.")
                }
            }
        } catch (e: SQLException) {
            logger.error("Error fetching comments for context $contextId: ${e.message}")
            throw RuntimeException("Error fetching comments from database", e)
        }
    }

    override fun getCommentsByContextAndRecordIdFromDatabase(
        contextId: String,
        recordId: String,
    ): List<DatabaseComment> {
        logger.debug("Fetching comments for context: $contextId with recordId: $recordId")

        return try {
            database.getConnection().use { conn ->
                val statement = conn.prepareStatement(
                    "SELECT id, actor, record_id, question_id, comment, updated FROM comments WHERE context_id = ? AND record_id = ? order by updated",
                )
                statement.setObject(1, UUID.fromString(contextId))
                statement.setString(2, recordId)
                val resultSet = statement.executeQuery()
                buildList {
                    while (resultSet.next()) {
                        add(
                            DatabaseComment(
                                actor = resultSet.getString("actor"),
                                recordId = recordId,
                                questionId = resultSet.getString("question_id"),
                                comment = resultSet.getString("comment"),
                                updated = resultSet.getObject("updated", java.time.LocalDateTime::class.java)
                                    .toString(),
                                contextId = contextId,
                            ),
                        )
                    }
                }.also {
                    logger.debug("Successfully fetched context's $contextId comments with recordId $recordId from database.")
                }
            }
        } catch (e: SQLException) {
            logger.error("Error fetching comments for context $contextId with recordId $recordId: ${e.message}")
            throw RuntimeException("Error fetching comments from database", e)
        }
    }

    override fun insertCommentOnContext(comment: DatabaseCommentRequest): DatabaseComment {
        logger.debug("Inserting comment into database: {}", comment)
        return try {
            insertCommentsOnContextBatch(listOf(comment)).first()
        } catch (e: SQLException) {
            logger.error("Error inserting answer row into database: ${e.message}")
            throw RuntimeException("Error fetching answers from database", e)
        }
    }

    override fun insertCommentsOnContextBatch(comments: List<DatabaseCommentRequest>): List<DatabaseComment> {
        comments.forEach { require(it.contextId != null) { "You have to supply a contextId" } }

        logger.debug("Inserting or updating {} comments into database", comments.size)

        val sqlStatement = """
        INSERT INTO comments (actor, record_id, question_id, comment, context_id) 
        VALUES (?, ?, ?, ?, ?) 
        ON CONFLICT (context_id, record_id) 
        DO UPDATE SET updated = NOW(), comment = EXCLUDED.comment;
        """.trimIndent()

        val selectStatement = """
        SELECT * FROM comments
        WHERE record_id IN (${comments.joinToString(",") { "'${it.recordId}'" }});
        """.trimIndent()

        return try {
            database.getConnection().use { conn ->
                conn.prepareStatement(sqlStatement).use { statement ->
                    for (comment in comments) {
                        statement.setString(1, comment.actor)
                        statement.setString(2, comment.recordId)
                        statement.setString(3, comment.questionId)
                        statement.setString(4, comment.comment)
                        statement.setObject(5, UUID.fromString(comment.contextId))
                        statement.addBatch()
                    }
                    statement.executeBatch()
                }

                conn.prepareStatement(selectStatement).use { selectStmt ->
                    val resultSet = selectStmt.executeQuery()
                    val insertedComments = mutableListOf<DatabaseComment>()

                    while (resultSet.next()) {
                        insertedComments.add(mapResultSetToDatabaseComment(resultSet))
                    }
                    insertedComments
                }
            }
        } catch (e: SQLException) {
            logger.error("Error inserting or updating comments in database: ${e.message}")
            throw RuntimeException("Error inserting or updating comments in database", e)
        }
    }

    private fun mapResultSetToDatabaseComment(resultSet: ResultSet): DatabaseComment = DatabaseComment(
        actor = resultSet.getString("actor"),
        recordId = resultSet.getString("record_id"),
        questionId = resultSet.getString("question_id"),
        comment = resultSet.getString("comment"),
        updated = resultSet.getObject("updated", java.time.LocalDateTime::class.java).toString(),
        contextId = resultSet.getString("context_id"),
    )

    override fun deleteCommentFromDatabase(contextId: String, recordId: String): Boolean {
        logger.debug("Deleting comment from database with recordId: $recordId and contextId: $contextId")
        val query = "DELETE FROM comments WHERE context_id = ? AND record_id = ?"
        database.getConnection().use { conn ->
            conn.prepareStatement(query).use { statement ->
                statement.setObject(1, UUID.fromString(contextId))
                statement.setString(2, recordId)
                return statement.executeUpdate() > 0
            }
        }
    }

    override fun copyCommentsFromOtherContext(newContextId: String, contextToCopy: String) {
        logger.info("Copying most recent comments from context $contextToCopy to new context $newContextId")
        val mostRecentComments = getCommentsByContextIdFromDatabase(contextToCopy)

        val databaseCommentRequestList = mostRecentComments.map {
            DatabaseCommentRequest(
                actor = it.actor,
                recordId = it.recordId,
                questionId = it.questionId,
                comment = it.comment,
                contextId = newContextId,
            )
        }
        if (databaseCommentRequestList.isEmpty()) return
        try {
            insertCommentsOnContextBatch(databaseCommentRequestList)
            logger.info("Comment copied to context $newContextId")
        } catch (e: SQLException) {
            logger.error(
                "Error copying comment to context $newContextId: ${e.message}",
                e,
            )
            throw RuntimeException("Error copying comments to new context", e)
        }
    }
}
