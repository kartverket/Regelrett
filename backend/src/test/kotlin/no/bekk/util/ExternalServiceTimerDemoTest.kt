package no.bekk.util

import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import org.junit.jupiter.api.Test
import org.slf4j.LoggerFactory

class ExternalServiceTimerDemoTest {
    private val logger = LoggerFactory.getLogger(ExternalServiceTimerDemoTest::class.java)

    @Test
    fun `demonstrate external service timing with debug logs`() = runBlocking {
        logger.info("=== External Service Timing Demo ===")

        val requestStartTime = System.currentTimeMillis()

        // Simulate first external service call
        logger.info("Making first external service call (AirTable.getRecords)")
        ExternalServiceTimer.time(
            serviceName = "AirTable",
            operation = "getRecords",
            correlationId = "demo-123",
            requestStartTime = requestStartTime,
        ) {
            delay(120) // Simulate 120ms call
            logger.info("AirTable call completed")
        }

        // Some processing
        delay(30)
        logger.info("Processing complete, making second call")

        // Simulate second external service call
        ExternalServiceTimer.time(
            serviceName = "Microsoft",
            operation = "fetchGroups",
            correlationId = "demo-123",
            requestStartTime = requestStartTime,
        ) {
            delay(80) // Simulate 80ms call
            logger.info("Microsoft call completed")
        }

        val totalRequestTime = System.currentTimeMillis() - requestStartTime
        logger.info("=== Demo complete. Total request time: ${totalRequestTime}ms ===")
    }
}
