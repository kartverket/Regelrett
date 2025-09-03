package no.bekk.di

import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.serialization.kotlinx.json.*
import no.bekk.authentication.AuthServiceImpl
import no.bekk.authentication.NoAuthServiceImpl
import no.bekk.configuration.Config
import no.bekk.configuration.JDBCDatabase
import no.bekk.database.AnswerRepositoryImpl
import no.bekk.database.CommentRepositoryImpl
import no.bekk.database.ContextRepositoryImpl
import no.bekk.services.FormServiceImpl
import no.bekk.services.MicrosoftServiceImpl
import no.bekk.services.provisioning.provideProvisioningService
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation as ClientContentNegotiation

fun rootComposer(config: Config): Dependencies {
    val database = JDBCDatabase.create(config.database)
    val formService = FormServiceImpl()
    val answerRepository = AnswerRepositoryImpl(database)
    val commentRepository = CommentRepositoryImpl(database)
    val contextRepository = ContextRepositoryImpl(database)
    val provisioningService = provideProvisioningService(config, formService)
    val httpClient = HttpClient(CIO) {
        install(ClientContentNegotiation) {
            json()
        }
    }
    val authService = when (config.authConfig.authType) {
        "none" -> NoAuthServiceImpl()
        "microsoft" -> AuthServiceImpl(MicrosoftServiceImpl(config), contextRepository, config.oAuth)
        else -> throw IllegalArgumentException("Unknown auth type: ${config.authConfig.authType}")
    }

    return Dependencies(
        formService = formService,
        database = database,
        answerRepository = answerRepository,
        provisioningService = provisioningService,
        commentRepository = commentRepository,
        contextRepository = contextRepository,
        authService = authService,
        httpClient = httpClient,
        redirects = Redirects(mutableMapOf<String, String>()),
    )
}
