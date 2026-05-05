package no.bekk.util

import io.ktor.server.application.*
import kotlinx.coroutines.*
import no.bekk.providers.AirTableProvider
import no.bekk.services.FormService
import kotlin.time.Duration.Companion.hours

fun Application.configureBackgroundTasks(formService: FormService) {
    launchBackgroundTask {
        while (isActive) {
            try {
                val airTableProviders = formService.getFormProviders().filterIsInstance<AirTableProvider>()
                var hasProvidersWithoutWebhook = false
                airTableProviders.forEach { provider ->
                    if (provider.webhookId.isNullOrEmpty()) {
                        logger.info("Table ${provider.id} has no webhook id. Updating cache instead.")
                        provider.updateCaches()
                        hasProvidersWithoutWebhook = true
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

                // Delay for 1 hour if one provider uses cache, and 24 hours if all providers uses webhooks.
                val delayMillis = if (hasProvidersWithoutWebhook)  1.hours else 24.hours
                delay(delayMillis)
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
