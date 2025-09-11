package no.bekk.services.provisioning.schemasources

import no.bekk.services.FormService

class SchemaSourceProvisioner(
    val cfgReader: ConfigReader,
    val formService: FormService,
) {
    fun applyChanges(configPath: String) {
        val configs = cfgReader.readConfig(configPath)

        for (cfg in configs) {
            provisionDataSources(cfg)
        }
    }

    fun provisionDataSources(configs: Configs) {
        for (schemasource in configs.schemasources) {
            val providerExists = formService.hasFormProvider(schemasource.name)
            fun missingProperty(property: String, schemaType: String) = "Property $property is missing in ${schemasource.name} but is required in $schemaType schema specifications"

            if (providerExists) {
                // formService.updateFormProvider(provider)
                formService.addFormProvider(schemasource)
            } else {
                formService.addFormProvider(schemasource)
            }
        }
    }
    companion object {
        fun provision(configDirectory: String, formService: FormService) {
            val provisioner = SchemaSourceProvisioner(ConfigReader(), formService)
            provisioner.applyChanges(configDirectory)
        }
    }
}
