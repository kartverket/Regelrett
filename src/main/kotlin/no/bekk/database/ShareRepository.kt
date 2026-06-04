package no.bekk.database

import no.bekk.configuration.Database
import no.bekk.exception.ConflictException
import no.bekk.exception.DatabaseException
import org.slf4j.LoggerFactory
import java.sql.SQLException

interface SharesRepository {
    fun insertShareOnContext(share: DatabaseShareRequest): DatabaseShare
}

class SharesRepositoryImpl(private val database: Database) : SharesRepository {
    private val logger = LoggerFactory.getLogger(SharesRepositoryImpl::class.java)

    override fun insertShareOnContext(share: DatabaseShareRequest): DatabaseShare {
        logger.debug("Inserting share: {}", share)
        val sqlStatement =
            "INSERT INTO shares (context_id, user_id, access_level) VALUES(?, ?, ?) returning *"

        try {
            database.getConnection().use { conn ->
                conn.prepareStatement(sqlStatement).use { statement ->
                    statement.setString(1, share.contextId)
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
                throw ConflictException("A context with the same team_id, form_id and name already exists.")
            } else {
                logger.error("Database error when inserting context: ${e.message}", e)
                throw DatabaseException("Failed to insert context", "insertContext", e)
            }
        }
    }
}