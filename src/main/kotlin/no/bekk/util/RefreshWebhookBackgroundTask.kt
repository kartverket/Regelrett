package no.bekk.util

import io.ktor.server.application.*
import kotlinx.coroutines.*
import no.bekk.providers.AirTableProvider
import no.bekk.services.FormService

fun Application.configureBackgroundTasks(formService: FormService) {
    launchBackgroundTask {
        while (isActive) {
            try {
                val airTableProviders = formService.getFormProviders().filterIsInstance<AirTableProvider>()
                airTableProviders.forEach { provider ->
                    if (provider.webhookId.isNullOrEmpty()) {
                        logger.info("Table ${provider.id} has no webhook id. Nothing to refresh.")
                        return@forEach
                    }
                    val success = provider.refreshWebhook()
                    if (success) {
                        logger.info("Successfully refreshed webhook for table ${provider.id} using daily coroutine")
                    } else {
                        logger.warn("Failed to refresh webhook for table ${provider.id}")
                    }
                    provider.updateCaches() // temp solution while webhooks don't work at SKIP
                }

                // Delay for 24 hours
                delay(1 * 60 * 60 * 1000L) // changed to 1 hour while webhooks are not working as intended
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                logger.error("Error refreshing webhook", e)
                delay(60 * 1000L) // Retry after 1 minute in case of error
            }
        }
    }
}

fun Application.launchBackgroundTask(block: suspend CoroutineScope.() -> Unit): Job = this.launch(block = block)
