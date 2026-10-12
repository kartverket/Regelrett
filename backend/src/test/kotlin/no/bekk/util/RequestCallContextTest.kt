package no.bekk.util

import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class RequestCallContextTest {

    @Test
    fun `should work correctly with ExternalServiceTimer when no context is available`() = runBlocking {
        // Enable external service timing for this test
        ExternalServiceTimingConfig.setEnabled(true)

        try {
            // Call ExternalServiceTimer without context - should handle gracefully
            val result = ExternalServiceTimer.time(
                serviceName = "TestService",
                operation = "testOperation",
            ) {
                delay(50)
                "test result"
            }

            assertEquals("test result", result)

            // The timer should handle missing context gracefully without throwing
        } finally {
            ExternalServiceTimingConfig.setEnabled(false)
        }
    }
}
