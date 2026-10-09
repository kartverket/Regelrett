package no.bekk

import com.github.ajalt.clikt.core.CliktCommand
import com.github.ajalt.clikt.core.main
import com.github.ajalt.clikt.parameters.options.*
import com.github.ajalt.clikt.parameters.types.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.Application
import io.ktor.server.application.ApplicationStopped
import io.ktor.server.application.install
import io.ktor.server.application.serverConfig
import io.ktor.server.engine.*
import io.ktor.server.netty.Netty
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.defaultheaders.*
import io.ktor.server.plugins.forwardedheaders.*
import io.ktor.server.sessions.*
import kotlinx.coroutines.*
import no.bekk.authentication.initializeAuthentication
import no.bekk.configuration.CommandLineArgs
import no.bekk.configuration.Config
import no.bekk.configuration.Database
import no.bekk.configuration.JDBCDatabase
import no.bekk.configuration.newConfigFromArgs
import no.bekk.di.Dependencies
import no.bekk.di.rootComposer
import no.bekk.plugins.RequestContextPlugin
import no.bekk.plugins.RequestLoggingPlugin
import no.bekk.plugins.configureCors
import no.bekk.plugins.configureErrorHandling
import no.bekk.plugins.configureRouting
import no.bekk.util.ExternalServiceTimingConfig
import no.bekk.util.configureBackgroundTasks
import org.slf4j.LoggerFactory
import kotlin.io.path.pathString
import kotlin.time.Duration
import kotlin.time.Duration.Companion.days

private val logger = LoggerFactory.getLogger("no.bekk.Application")

class Regelrett : CliktCommand() {
    val homepath by option(help = "The homepath of your Regelrett application").path(canBeFile = false)
    val config by option(help = "The path to your custom configuration file").path(canBeDir = false, mustBeReadable = true)

    override fun run() {
        val cfg = newConfigFromArgs(CommandLineArgs(homepath?.pathString ?: "", config?.pathString ?: "", emptyArray()))

        val appProperties = serverConfig {
            developmentMode = cfg.mode == "development"
            module { main(cfg) }
        }

        embeddedServer(
            Netty,
            appProperties,
        ) {
            maxInitialLineLength = cfg.server.maxInitialLineLength
            maxHeaderSize = cfg.server.maxHeaderSize
            maxChunkSize = cfg.server.maxChunkSize
            connectors.add(
                EngineConnectorBuilder().apply {
                    port = cfg.server.httpPort
                    host = cfg.server.httpAddr
                },
            )
        }.start(wait = true)
    }
}
fun main(args: Array<String>) = Regelrett().main(args)

fun CoroutineScope.launchCleanupJob(cleanupIntervalWeeks: String, database: Database): Job {
    val cleanupInterval: Duration = (cleanupIntervalWeeks.toInt() * 7).days

    return launch(Dispatchers.IO) {
        while (isActive) {
            try {
                logger.info("Running scheduled cleanup every $cleanupIntervalWeeks weeks.")
                cleanupAnswersHistory(database)
            } catch (e: Exception) {
                logger.error("Error during answers history cleanup: ${e.message}")
            }
            delay(cleanupInterval.inWholeMilliseconds)
        }
    }
}

fun cleanupAnswersHistory(database: Database) {
    logger.info("Running scheduled cleanup for answers table")
    val query =
        """
            WITH ranked_answers AS
            (SELECT
                id,
                record_id,
                context_id,
                created,
                ROW_NUMBER() OVER (PARTITION BY record_id, context_id ORDER BY created DESC) AS rn
            FROM answers)
            DELETE FROM answers
            USING ranked_answers
            WHERE answers.id = ranked_answers.id AND ranked_answers.rn > 3;
        """.trimIndent()

    database.getConnection().use { conn ->
        conn.prepareStatement(query).use { stmt ->
            val deletedRows = stmt.executeUpdate()
            logger.info("Answer cleanup completed. Deleted $deletedRows rows.")
        }
    }
}

fun Application.main(config: Config) {
    val dependencies = rootComposer(config)

    // Initialize external service timing configuration
    ExternalServiceTimingConfig.setEnabled(config.server.externalServiceTiming)

    dependencies.provisioningService.runInitialProvisioners()
    configureAPILayer(config, dependencies)
    configureBackgroundTasks(dependencies.formService)
    launchCleanupJob(config.answerHistoryCleanup.cleanupIntervalWeeks, dependencies.database)

    monitor.subscribe(ApplicationStopped) {
        (dependencies.database as JDBCDatabase).closePool()
    }
}

fun Application.configureAPILayer(
    config: Config,
    dependencies: Dependencies,
) {
    install(DefaultHeaders) {
        header(
            "Content-Security-Policy",
            "default-src 'self' ${config.frontendDevServer.devUrl};" +
                "style-src 'self' https://fonts.googleapis.com 'unsafe-inline';" +
                "font-src 'self' https://fonts.gstatic.com;" +
                "img-src 'self' ${config.frontendDevServer.devUrl} data:;" +
                "script-src 'self' ${config.frontendDevServer.devUrl} 'unsafe-inline';" +
                "frame-src 'self' https://login.microsoftonline.com;" +
                "connect-src 'self' ws://${config.frontendDevServer.host}:${config.frontendDevServer.httpPort} ${config.frontendDevServer.devUrl} https://login.microsoftonline.com",

        )
    }
    install(ContentNegotiation) {
        json()
    }

    install(XForwardedHeaders)

    // Always install request context for correlation tracking and timing
    install(RequestContextPlugin)

    // Configure global error handling
    configureErrorHandling()

    if (config.server.routerLogging) {
        install(RequestLoggingPlugin)
    }

    configureCors(config)
    initializeAuthentication(config, dependencies.httpClient, dependencies.redirects)
    configureRouting(config, dependencies)
}
