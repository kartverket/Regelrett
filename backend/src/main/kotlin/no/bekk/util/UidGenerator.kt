package no.bekk.util

import java.util.UUID

fun generateNewUid(): String = UUID.randomUUID().toString()
