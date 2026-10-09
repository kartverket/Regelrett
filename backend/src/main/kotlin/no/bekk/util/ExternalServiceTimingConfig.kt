package no.bekk.util

/**
 * Global configuration for external service timing
 */
object ExternalServiceTimingConfig {
    @Volatile
    var isEnabled: Boolean = false
        private set

    fun setEnabled(enabled: Boolean) {
        isEnabled = enabled
    }
}
