package no.bekk.services.provisioning.schemasources

import kotlinx.serialization.serializer
import net.mamoe.yamlkt.Yaml
import org.slf4j.LoggerFactory
import java.nio.file.Path
import kotlin.io.path.Path
import kotlin.io.path.listDirectoryEntries
import kotlin.io.path.pathString
import kotlin.io.path.readText
import kotlin.text.substring

val logger = LoggerFactory.getLogger("no.bekk.services.provisioning.schemasources.ConfigReader")

class ConfigReader {
    fun readConfig(configPath: String): List<Configs> {
        val schemasources = mutableListOf<Configs>()

        val files = Path(configPath).listDirectoryEntries()

        for (file in files) {
            if (!file.pathString.endsWith(".yaml") && !file.pathString.endsWith(".yml")) {
                continue
            }
            schemasources.add(parseSchemasourceConfig(file))
        }

        return schemasources
    }

    fun parseSchemasourceConfig(file: Path): Configs {
        val yamlFile = file.readText()

        val yamlConfigs = Yaml.decodeFromString<Configs>(serializer(), yamlFile)

        return yamlConfigs.copy(
            yamlConfigs.schemasources.map {
                UpsertDataFromConfig(
                    expandEnv(it.name),
                    expandEnv(it.type),
                    expandEnv(it.uid),
                    expandEnv(it.url),
                    expandEnv(it.access_token),
                    expandEnv(it.base_id),
                    expandEnv(it.table_id),
                    expandEnv(it.view_id),
                    expandEnv(it.webhook_id),
                    expandEnv(it.webhook_secret),
                )
            },
        )
    }

    inline fun <reified T : String?> expandEnv(value: T): T {
        if (value?.get(0) == '$') {
            val key = value.substring(1)
            val envVal = System.getenv(key)

            if (envVal == null || envVal == "") logger.warn("WARNING: Provisoning datasources: Env variable $key is not set, or is set to an empty string.")
            return envVal as T
        } else {
            return value
        }
    }
}
