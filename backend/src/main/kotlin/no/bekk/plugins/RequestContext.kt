package no.bekk.plugins

import io.ktor.server.application.*
import kotlinx.coroutines.withContext
import no.bekk.util.RequestCallContext
import no.bekk.util.RequestContext.getOrCreateCorrelationId
import no.bekk.util.RequestContext.setRequestStartTime

/**
 * Plugin that sets up request context (correlation ID and timing) for all requests.
 * This is always installed regardless of logging configuration.
 */
val RequestContextPlugin =
    createApplicationPlugin(name = "RequestContextPlugin") {
        application.intercept(ApplicationCallPipeline.Setup) {
            // Set request start time for external service timing calculations
            call.setRequestStartTime(System.currentTimeMillis())

            // Generate correlation ID for request tracking
            val correlationId = call.getOrCreateCorrelationId()

            // Add correlation ID to response headers for easier tracing
            call.response.headers.append("X-Correlation-ID", correlationId)

            // Wrap the entire request processing with RequestCallContext
            withContext(RequestCallContext(call)) {
                proceed()
            }
        }
    }
