package no.bekk.util

import io.ktor.server.application.*
import org.slf4j.LoggerFactory
import kotlin.system.measureTimeMillis

/**
 * Utility for timing external service calls and calculating their percentage of total request time
 */
object ExternalServiceTimer {
    private val logger = LoggerFactory.getLogger(ExternalServiceTimer::class.java)

    /**
     * Execute a block of code and measure its execution time, then log the timing information
     */
    suspend fun <T> time(
        serviceName: String,
        operation: String,
        correlationId: String? = null,
        requestStartTime: Long? = null,
        block: suspend () -> T,
    ): T {
        if (!ExternalServiceTimingConfig.isEnabled) {
            return block()
        }

        // Try to get ApplicationCall from coroutine context if correlation ID and start time not provided
        val (actualCorrelationId, actualRequestStartTime) = if (correlationId == null || requestStartTime == null) {
            val currentCall = RequestContext.getCurrentCall()
            if (currentCall != null) {
                val contextCorrelationId = RequestContext.run { currentCall.getCorrelationId() }
                val contextRequestStartTime = RequestContext.run { currentCall.getRequestStartTime() }
                Pair(
                    correlationId ?: contextCorrelationId,
                    requestStartTime ?: contextRequestStartTime,
                )
            } else {
                Pair(correlationId, requestStartTime)
            }
        } else {
            Pair(correlationId, requestStartTime)
        }

        val startTime = System.currentTimeMillis()
        var result: T

        val duration = measureTimeMillis {
            result = block()
        }

        val percentage = if (actualRequestStartTime != null) {
            val totalRequestTime = System.currentTimeMillis() - actualRequestStartTime
            if (totalRequestTime > 0) {
                String.format("%.1f", (duration.toDouble() / totalRequestTime) * 100)
            } else {
                "N/A"
            }
        } else {
            "N/A"
        }

        val correlationInfo = actualCorrelationId?.let { " [correlationId: $it]" } ?: " [correlationId: unknown]"
        logger.debug("External service call: $serviceName.$operation took ${duration}ms ($percentage% of request)$correlationInfo")

        return result
    }

    /**
     * Execute a block of code with timing for Ktor ApplicationCall context
     */
    suspend fun <T> ApplicationCall.timeExternalCall(
        serviceName: String,
        operation: String,
        block: suspend () -> T,
    ): T {
        if (!ExternalServiceTimingConfig.isEnabled) {
            return block()
        }

        val correlationId = RequestContext.run { getCorrelationId() }
        val requestStartTime = RequestContext.run { getRequestStartTime() }

        return time(serviceName, operation, correlationId, requestStartTime, block)
    }
}
