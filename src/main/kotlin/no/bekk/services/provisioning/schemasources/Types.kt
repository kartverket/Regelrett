package no.bekk.services.provisioning.schemasources

import kotlinx.serialization.Serializable

@Serializable
data class Configs(
    val schemasources: List<UpsertDataFromConfig> = emptyList(),
)

@Serializable
data class UpsertDataFromConfig(
    val name: String,
    val type: String,
    val uid: String?,
    val url: String? = null,
    val access_token: String? = null,
    val base_id: String? = null,
    val table_id: String? = null,
    val view_id: String? = null,
    val webhook_id: String? = null,
    val webhook_secret: String? = null,
    val read_access_group_id: String? = null,
    val resource_path: String? = null,
    val answer_column: String = "Svar",
    val answer_type_column: String = "Svartype",
    val answer_unit_column: String = "Svarenhet",
    val answer_expiry_column: String = "Svarvarighet",
    val question_column: String = "Navn",
)
