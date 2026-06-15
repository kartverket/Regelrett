package no.bekk.database

import no.bekk.configuration.Database
import no.bekk.exception.ConflictException
import no.bekk.exception.DatabaseException
import org.slf4j.LoggerFactory
import java.sql.SQLException
import java.sql.Timestamp
import java.time.Instant
import java.util.UUID
import kotlin.collections.buildList

interface SharesRepository {
    fun getSharesByContext(contextId: String): List<DatabaseShare>
    fun getSharedContextsByUserId(userId: String): List<DatabaseShare>
    fun insertShareOnContext(contextId: String, share: DatabaseShareRequest): DatabaseShare
}

class SharesRepositoryImpl(private val database: Database) : SharesRepository {
    private val logger = LoggerFactory.getLogger(SharesRepositoryImpl::class.java)

    override fun getSharesByContext(contextId: String): List<DatabaseShare> {
        logger.debug("Fetching shares from database for contextId: $contextId")

        val sqlStatement = """
            SELECT id, context_id, user_id, created, expires_at
            FROM shares
            WHERE context_id = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
        """.trimIndent()

        return try {
            database.getConnection().use { conn ->
                conn.prepareStatement(sqlStatement).use { statement ->
                    statement.setObject(1, UUID.fromString(contextId))

                    val result = statement.executeQuery()

                    buildList {
                        while (result.next()) {
                            add(
                                DatabaseShare(
                                    id = result.getString("id"),
                                    contextId = result.getString("context_id"),
                                    userId = result.getString("user_id"),
                                    created = result.getString("created"),
                                    expiresAt = result.getObject("expires_at", java.time.LocalDateTime::class.java)?.toString(),
                                )
                            )
                        }
                    }.also {
                        logger.debug("Successfully fetched shares for context: $contextId")
                    }
                }
            }
        } catch (e: SQLException) {
            logger.error("Error fetching shares for context: $contextId", e)
            throw RuntimeException("Error fetching shares for context: $contextId from database", e)
        }


    }

    override fun insertShareOnContext(contextId: String, share: DatabaseShareRequest): DatabaseShare {
        logger.debug("Inserting share: {}", share)
        val sqlStatement =
            """
                INSERT INTO shares (context_id, user_id, expires_at)
                SELECT ?, ?, ?
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM shares
                    WHERE context_id = ?
                      AND user_id = ?
                      AND (
                          expires_at IS NULL
                          OR expires_at > CURRENT_TIMESTAMP
                      )
                )
                RETURNING *
            """.trimIndent()

        try {
            database.getConnection().use { conn ->
                conn.prepareStatement(sqlStatement).use { statement ->
                    statement.setObject(1, UUID.fromString(contextId))
                    statement.setString(2, share.userId)
                    statement.setTimestamp(3, share.expiresAt?.takeIf { it.isNotBlank() }?.let { Timestamp.from(Instant.parse(it)) })
                    statement.setObject(4, UUID.fromString(contextId))
                    statement.setString(5, share.userId)

                    val result = statement.executeQuery()
                    if (result.next()) {
                        logger.debug("Successfully inserted share request into database")
                        return DatabaseShare(
                            id = result.getString("id"),
                            contextId = result.getString("context_id"),
                            userId = result.getString("user_id"),
                            created = result.getObject("created", java.time.LocalDateTime::class.java)?.toString() ?: "",
                            expiresAt = result.getObject("expires_at", java.time.LocalDateTime::class.java)?.toString(),
                        )
                    } else {
                        throw ConflictException("The user already has valid access to this context")
                    }
                }
            }
        } catch (e: SQLException) {
            logger.error("Database error when sharing context: ${e.message}", e)
            throw DatabaseException("Failed to share context with user", "insertContext", e)
        }
    }

    override fun getSharedContextsByUserId(userId: String): List<DatabaseShare> {
        val sqlStatement = """
            SELECT id, context_id, user_id, created, expires_at
            FROM shares
            WHERE user_id = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
        """.trimIndent()

        return try {
            database.getConnection().use { conn ->
                conn.prepareStatement(sqlStatement).use { statement ->
                    statement.setString(1, userId)

                    val result = statement.executeQuery()

                    buildList {
                        while (result.next()) {
                            add(
                                DatabaseShare(
                                    id = result.getString("id"),
                                    contextId = result.getString("context_id"),
                                    userId = result.getString("user_id"),
                                    created = result.getString("created"),
                                    expiresAt = result.getObject("expires_at", java.time.LocalDateTime::class.java)?.toString(),
                                )
                            )
                        }
                    }.also {
                        logger.debug("Successfully fetched shares for user: $userId")
                    }
                }
            }
        } catch (e: SQLException) {
            logger.error("Error fetching shared contexts for user: $userId", e)
            throw RuntimeException("Error fetching shared contexts for user: $userId from database", e)
        }
    }
}