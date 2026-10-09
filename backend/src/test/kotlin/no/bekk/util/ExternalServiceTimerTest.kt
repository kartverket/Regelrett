package no.bekk.util

import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import org.junit.jupiter.api.Test
import kotlin.test.assertTrue

class ExternalServiceTimerTest {

    @Test
    fun `should measure execution time correctly`() = runBlocking {
        val startTime = System.currentTimeMillis()

        // Simulate external service call that takes ~100ms
        val result = ExternalServiceTimer.time(
            serviceName = "TestService",
            operation = "testOperation",
            correlationId = "test-123",
            requestStartTime = startTime,
        ) {
            delay(100)
            "test result"
        }

        // Verify the result is returned correctly
        assertTrue(result == "test result")

        // Test should complete in reasonable time (less than 200ms allowing for some overhead)
        val totalTime = System.currentTimeMillis() - startTime
        assertTrue(totalTime < 200, "Test took too long: ${totalTime}ms")
    }

    @Test
    fun `should handle null request start time gracefully`() = runBlocking {
        // Should not throw exception when requestStartTime is null
        val result = ExternalServiceTimer.time(
            serviceName = "TestService",
            operation = "testOperation",
            correlationId = "test-123",
            requestStartTime = null,
        ) {
            delay(50)
            "test result"
        }

        assertTrue(result == "test result")
    }
}
