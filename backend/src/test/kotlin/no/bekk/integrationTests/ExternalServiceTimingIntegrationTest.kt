package no.bekk.integrationTests

import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import no.bekk.util.ExternalServiceTimer
import org.junit.jupiter.api.Test
import org.slf4j.LoggerFactory
import kotlin.test.assertTrue

class ExternalServiceTimingIntegrationTest {
    private val logger = LoggerFactory.getLogger(ExternalServiceTimingIntegrationTest::class.java)

    @Test
    fun `should measure timing and calculate percentage correctly in realistic scenario`() = runBlocking {
        val requestStartTime = System.currentTimeMillis()

        // Simulate a total request that includes multiple external service calls
        var firstCallTime = 0L
        var secondCallTime = 0L

        // First external service call (e.g., Airtable)
        val firstResult = ExternalServiceTimer.time(
            serviceName = "AirTable",
            operation = "getRecords",
            correlationId = "test-123",
            requestStartTime = requestStartTime,
        ) {
            val start = System.currentTimeMillis()
            delay(100) // Simulate 100ms external service call
            firstCallTime = System.currentTimeMillis() - start
            "first result"
        }

        // Some processing time
        delay(50)

        // Second external service call (e.g., Microsoft)
        val secondResult = ExternalServiceTimer.time(
            serviceName = "Microsoft",
            operation = "fetchGroups",
            correlationId = "test-123",
            requestStartTime = requestStartTime,
        ) {
            val start = System.currentTimeMillis()
            delay(75) // Simulate 75ms external service call
            secondCallTime = System.currentTimeMillis() - start
            "second result"
        }

        val totalRequestTime = System.currentTimeMillis() - requestStartTime

        // Verify results
        assertTrue(firstResult == "first result")
        assertTrue(secondResult == "second result")

        // Verify timing is reasonable
        assertTrue(firstCallTime >= 100, "First call should take at least 100ms, took ${firstCallTime}ms")
        assertTrue(secondCallTime >= 75, "Second call should take at least 75ms, took ${secondCallTime}ms")
        assertTrue(totalRequestTime >= 225, "Total should be at least 225ms (100+50+75), took ${totalRequestTime}ms")

        // Calculate expected percentages
        val firstPercentage = (firstCallTime.toDouble() / totalRequestTime) * 100
        val secondPercentage = (secondCallTime.toDouble() / totalRequestTime) * 100

        logger.info(
            "Test completed: First call ${firstCallTime}ms (${String.format("%.1f", firstPercentage)}%), " +
                "Second call ${secondCallTime}ms (${String.format("%.1f", secondPercentage)}%), " +
                "Total request ${totalRequestTime}ms",
        )

        // Verify percentages make sense
        assertTrue(firstPercentage > 30, "First call percentage should be significant")
        assertTrue(secondPercentage > 20, "Second call percentage should be significant")
        assertTrue(firstPercentage + secondPercentage < 100, "Combined percentages should be less than 100%")
    }

    @Test
    fun `should handle multiple consecutive external service calls with timing`() = runBlocking {
        val requestStartTime = System.currentTimeMillis()
        val results = mutableListOf<String>()

        // Simulate multiple AirTable calls that might happen during cache refresh
        repeat(3) { index ->
            val result = ExternalServiceTimer.time(
                serviceName = "AirTable",
                operation = "call$index",
                correlationId = "bulk-test",
                requestStartTime = requestStartTime,
            ) {
                delay(30) // Each call takes 30ms
                "result-$index"
            }
            results.add(result)
        }

        val totalTime = System.currentTimeMillis() - requestStartTime

        // Verify all calls completed
        assertTrue(results.size == 3)
        assertTrue(results.contains("result-0"))
        assertTrue(results.contains("result-1"))
        assertTrue(results.contains("result-2"))

        // Verify total time is reasonable (at least 90ms for 3x30ms calls)
        assertTrue(totalTime >= 90, "Total time should be at least 90ms, was ${totalTime}ms")

        logger.info("Bulk test completed in ${totalTime}ms")
    }
}
