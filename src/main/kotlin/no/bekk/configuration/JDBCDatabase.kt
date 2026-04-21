package no.bekk.configuration

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import io.ktor.util.logging.*
import org.flywaydb.core.Flyway
import java.sql.Connection

interface Database {
    fun getConnection(): Connection
}

class JDBCDatabase(
    private val dataSource: HikariDataSource,
) : Database {
    override fun getConnection(): Connection = dataSource.connection

    fun closePool() {
        dataSource.close()
    }

    private fun migrate(dbConfig: DatabaseConfig) {
        val flyway = Flyway.configure()
            .createSchemas(true)
            .defaultSchema("regelrett")
            .dataSource(
                dbConfig.url,
                dbConfig.migrationUser,
                dbConfig.migrationPassword,
            )
            .validateMigrationNaming(true)
            .load()
        val result = flyway.migrate()
        if (result.success) {
            logger.info("Database migrations applied successfully.")
        } else {
            throw IllegalStateException("Failed to apply database migrations.")
        }
    }

    companion object {
        private val logger = KtorSimpleLogger("Database")

        fun create(dbConfig: DatabaseConfig): JDBCDatabase {
            val hikariConfig = HikariConfig().apply {
                schema = "regelrett"
                jdbcUrl = dbConfig.url
                username = dbConfig.username
                password = dbConfig.password
                driverClassName = "org.postgresql.Driver"
            }
            logger.info("Database jdbcUrl: ${hikariConfig.jdbcUrl}")
            return try {
                JDBCDatabase(HikariDataSource(hikariConfig)).also {
                    it.migrate(dbConfig)
                }
            } catch (e: Exception) {
                logger.error("Failed to create the HikariDataSource.", e)
                throw e
            }
        }
    }
}
