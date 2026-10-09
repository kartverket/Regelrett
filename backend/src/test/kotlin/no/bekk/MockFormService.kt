package no.bekk

import no.bekk.providers.FormProvider
import no.bekk.services.FormService
import no.bekk.services.provisioning.schemasources.UpsertDataFromConfig

interface MockFormService : FormService {
    override fun getFormProvider(formId: String): FormProvider = TODO("Not yet implemented")
    override fun getFormProviders(): List<FormProvider> = TODO("Not yet implemented")
    override fun getFormProviderByName(name: String): FormProvider = TODO("Not yet implemented")
    override fun hasFormProvider(name: String): Boolean = TODO("Not yet implemented")

    override fun addFormProvider(command: UpsertDataFromConfig) = TODO("Not yet implemented")
}
