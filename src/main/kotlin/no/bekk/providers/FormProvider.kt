package no.bekk.providers

import no.bekk.model.internal.*

interface FormProvider {
    val name: String
    val id: String
    val readAccessGroupId: String?
    suspend fun getForm(): Form
    suspend fun getQuestion(recordId: String): Question
    suspend fun getColumns(): List<Column>
    suspend fun getSchema(): Schema
}
