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

interface ReadGrantRepository {
    fun getReadGrantsByContext(contextId: String): List<DatabaseReadGrant>
    fun getReadGrantsByUserId(userId: String): List<DatabaseReadGrant>
    fun insertReadGrantOnContext(contextId: String, readGrant: DatabaseReadGrantRequest): DatabaseReadGrant
    fun revokeReadGrantOnContext(readGrantId: String, contextId: String): Boolean
}

class ReadGrantRepositoryImpl(private val database: Database) : ReadGrantRepository {
    private val logger = LoggerFactory.getLogger(ReadGrantRepositoryImpl::class.java)

    override fun getReadGrantsByContext(contextId: String): List<DatabaseReadGrant> {
        logger.debug("Fetching read grants from database for contextId: $contextId")

        val sqlStatement = """
            SELECT id, context_id, user_id, created, expires_at, justification
            FROM read_grants
            WHERE context_id = ? AND expires_at > CURRENT_TIMESTAMP
        """.trimIndent()

        return try {
            database.getConnection().use { conn ->
                conn.prepareStatement(sqlStatement).use { statement ->
                    statement.setObject(1, UUID.fromString(contextId))

                    val result = statement.executeQuery()

                    buildList {
                        while (result.next()) {
                            add(
                                DatabaseReadGrant(
                                    id = result.getString("id"),
                                    contextId = result.getString("context_id"),
                                    userId = result.getString("user_id"),
                                    created = result.getString("created"),
                                    expiresAt = result.getObject("expires_at", java.time.LocalDateTime::class.java).toString(),
                                ),
                            )
                        }
                    }.also {
                        logger.debug("Successfully fetched granted read accesses for context: $contextId")
                    }
                }
            }
        } catch (e: SQLException) {
            logger.error("Error fetching granted read accesses for context: $contextId", e)
            throw RuntimeException("Error fetching granted read accesses for context: $contextId from database", e)
        }
    }

    override fun insertReadGrantOnContext(contextId: String, readGrant: DatabaseReadGrantRequest): DatabaseReadGrant {
        logger.debug("Inserting grant for read access: {}", readGrant)
        val sqlStatement =
            """
                INSERT INTO read_grants (context_id, user_id, expires_at, justification, shared_by)
                SELECT ?, ?, ?, ?, ? 
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM read_grants
                    WHERE context_id = ?
                      AND user_id = ?
                      AND expires_at > CURRENT_TIMESTAMP
                )
                RETURNING *
            """.trimIndent()

        try {
            database.getConnection().use { conn ->
                conn.prepareStatement(sqlStatement).use { statement ->
                    statement.setObject(1, UUID.fromString(contextId))
                    statement.setString(2, readGrant.userId)
                    statement.setTimestamp(3, Timestamp.from(Instant.parse(readGrant.expiresAt)))
                    statement.setString(4, readGrant.justification)
                    statement.setString(5, readGrant.sharedBy)
                    statement.setObject(6, UUID.fromString(contextId))
                    statement.setString(7, readGrant.userId)

                    val result = statement.executeQuery()
                    if (result.next()) {
                        logger.debug("Successfully inserted read grant request into database")
                        return DatabaseReadGrant(
                            id = result.getString("id"),
                            contextId = result.getString("context_id"),
                            userId = result.getString("user_id"),
                            created = result.getObject("created", java.time.LocalDateTime::class.java)?.toString() ?: "",
                            expiresAt = result.getObject("expires_at", java.time.LocalDateTime::class.java).toString(),
                        )
                    } else {
                        throw ConflictException("The user already has valid read access to this context")
                    }
                }
            }
        } catch (e: SQLException) {
            logger.error("Database error when granting read access for context: ${e.message}", e)
            throw DatabaseException("Failed to grant read access with user", "insertContext", e)
        }
    }

    override fun getReadGrantsByUserId(userId: String): List<DatabaseReadGrant> {
        val sqlStatement = """
            SELECT id, context_id, user_id, created, expires_at
            FROM read_grants
            WHERE user_id = ? AND expires_at > CURRENT_TIMESTAMP
        """.trimIndent()

        return try {
            database.getConnection().use { conn ->
                conn.prepareStatement(sqlStatement).use { statement ->
                    statement.setString(1, userId)

                    val result = statement.executeQuery()

                    buildList {
                        while (result.next()) {
                            add(
                                DatabaseReadGrant(
                                    id = result.getString("id"),
                                    contextId = result.getString("context_id"),
                                    userId = result.getString("user_id"),
                                    created = result.getString("created"),
                                    expiresAt = result.getObject("expires_at", java.time.LocalDateTime::class.java).toString(),
                                ),
                            )
                        }
                    }.also {
                        logger.debug("Successfully fetched granted read accesses for user: $userId")
                    }
                }
            }
        } catch (e: SQLException) {
            logger.error("Error fetching granted read accesses for user: $userId", e)
            throw RuntimeException("Error fetching granted read accesses for user: $userId from database", e)
        }
    }

    override fun revokeReadGrantOnContext(readGrantId: String, contextId: String): Boolean {
        val sqlStatement = "UPDATE read_grants SET expires_at = CURRENT_TIMESTAMP WHERE id = ? AND context_id = ?"

        try {
            database.getConnection().use { conn ->
                conn.prepareStatement(sqlStatement).use { statement ->
                    statement.setObject(1, readGrantId)
                    statement.setString(2, contextId)
                    return statement.executeUpdate() > 0
                }
            }
        } catch (e: SQLException) {
            logger.error("Database error revoking read grant $readGrantId", e)
            throw DatabaseException("Failed to revoke read grant $readGrantId", "revokeReadGrant", e)
        }
    }
}
