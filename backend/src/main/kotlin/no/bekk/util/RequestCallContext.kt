package no.bekk.util

import io.ktor.server.application.*
import kotlin.coroutines.CoroutineContext

/**
 * CoroutineContext element that holds the current ApplicationCall for request-scoped operations.
 * This is used to provide correlation ID and timing context to external service calls.
 */
class RequestCallContext(val call: ApplicationCall) : CoroutineContext.Element {
    companion object Key : CoroutineContext.Key<RequestCallContext>

    override val key: CoroutineContext.Key<*> = Key
}
