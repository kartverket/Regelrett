package no.bekk

import no.bekk.services.provisioning.ProvisioningService

interface MockProvisioningService : ProvisioningService {
    override fun runInitialProvisioners() = TODO("Not implemented")
    override fun provisionSchemaSources() = TODO("Not implemented")
}
