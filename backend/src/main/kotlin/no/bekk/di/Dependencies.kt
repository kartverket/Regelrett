package no.bekk.di

import io.ktor.client.HttpClient
import no.bekk.authentication.AuthService
import no.bekk.configuration.Database
import no.bekk.database.AnswerRepository
import no.bekk.database.CommentRepository
import no.bekk.database.ContextRepository
import no.bekk.database.ReadGrantRepository
import no.bekk.services.FormService
import no.bekk.services.provisioning.ProvisioningService

class Dependencies(
    val database: Database,
    val formService: FormService,
    val answerRepository: AnswerRepository,
    val provisioningService: ProvisioningService,
    val commentRepository: CommentRepository,
    val contextRepository: ContextRepository,
    val readGrantRepository: ReadGrantRepository,
    val authService: AuthService,
    val httpClient: HttpClient,
    val redirects: Redirects,
)

data class Redirects(val r: MutableMap<String, String>)
