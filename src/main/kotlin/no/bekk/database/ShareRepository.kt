package no.bekk.database

import no.bekk.configuration.Database
import no.bekk.exception.ConflictException
import no.bekk.exception.DatabaseException
import org.slf4j.LoggerFactory
import java.sql.SQLException
import java.util.UUID
import kotlin.collections.buildList

interface SharesRepository {
    fun getSharesByContext(contextId: String): List<DatabaseShare>
    fun insertShareOnContext(contextId: String, share: DatabaseShareRequest): DatabaseShare
}

class SharesRepositoryImpl(private val database: Database) : SharesRepository {
    private val logger = LoggerFactory.getLogger(SharesRepositoryImpl::class.java)

    override fun getSharesByContext(contextId: String): List<DatabaseShare> {
        logger.debug("Fetching shares from database for contextId: $contextId")

        val sqlStatement = """SELECT id, context_id, user_id, access_level, created FROM shares WHERE context_id = ?"""

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
                                    accessLevel = result.getString("access_level"),
                                    created = result.getString("created"),
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
            "INSERT INTO shares (context_id, user_id, access_level) VALUES(?, ?, ?) returning *"

        try {
            database.getConnection().use { conn ->
                conn.prepareStatement(sqlStatement).use { statement ->
                    statement.setObject(1, UUID.fromString(contextId))
                    statement.setString(2, share.userId)
                    statement.setString(3, share.accessLevel)

                    val result = statement.executeQuery()
                    if (result.next()) {
                        logger.debug("Successfully inserted share request into database")
                        return DatabaseShare(
                            id = result.getString("id"),
                            contextId = result.getString("context_id"),
                            userId = result.getString("user_id"),
                            accessLevel = result.getString("access_level"),
                            created = result.getObject("created", java.time.LocalDateTime::class.java)?.toString() ?: "",
                        )
                    } else {
                        throw RuntimeException("Error inserting share request into database")
                    }
                }
            }
        } catch (e: SQLException) {
            if (e.sqlState == "23505") { // PostgreSQL unique_violation
                logger.warn("Unique constraint violation when inserting context: ${e.message}")
                throw ConflictException("The user already has this access for this context")
            } else {
                logger.error("Database error when sharing context: ${e.message}", e)
                throw DatabaseException("Failed to share context with user", "insertContext", e)
            }
        }
    }
}