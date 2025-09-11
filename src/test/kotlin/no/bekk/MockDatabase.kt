package no.bekk

import no.bekk.configuration.Database
import java.sql.Connection

interface MockDatabase : Database {
    override fun getConnection(): Connection = TODO("Not yet implemented")
}
