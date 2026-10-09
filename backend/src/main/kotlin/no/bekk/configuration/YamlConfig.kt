package no.bekk.configuration

import net.mamoe.yamlkt.Yaml
import net.mamoe.yamlkt.YamlElement
import net.mamoe.yamlkt.YamlLiteral
import net.mamoe.yamlkt.YamlMap
import net.mamoe.yamlkt.YamlNull
import net.mamoe.yamlkt.asLiteralOrNull
import net.mamoe.yamlkt.literalContentOrNull
import org.slf4j.LoggerFactory
import java.nio.file.Path
import kotlin.io.path.Path
import kotlin.io.path.pathString
import kotlin.io.path.readText

private val logger = LoggerFactory.getLogger("no.bekk.configuration.YamlConfig")

class YamlConfig(
    private val config: YamlMap,
) {
    private fun propertyPath(
        section: String? = null,
        key: String,
    ) = if (section != null) {
        "$section.$key"
    } else {
        "$key"
    }

    fun sectionOrNull(section: String): YamlMap? {
        val sectionYaml = config.get(section)
        if (sectionYaml !is YamlMap) {
            throw IllegalArgumentException("Invalid section '$section'. Type was ${sectionYaml?.let{ it::class.qualifiedName?.split(".")?.last() } ?: "null"}, expected YamlMap.")
        } else {
            return sectionYaml
        }
    }

    fun section(section: String): YamlMap = this.sectionOrNull(section)
        ?: throw IllegalArgumentException("Missing section $section")

    private fun YamlMap.getPropertyOrNull(key: String): YamlElement? = this.get(key)

    private fun YamlMap.getProperty(key: String): YamlElement = this.getPropertyOrNull(key)
        ?: throw IllegalArgumentException("Missing property $key")

    private fun getValueOrNull(
        section: String,
        key: String,
    ): YamlElement? = this.sectionOrNull(section)?.getPropertyOrNull(key)

    private fun getValue(
        section: String,
        key: String,
    ): YamlElement {
        try {
            return this.section(section).getProperty(key)
        } catch (e: Exception) {
            logger.error("Unable to build ${propertyPath(section, key)} from Yaml:", e)
            throw e
        }
    }
    fun getStringOrNull(
        section: String,
        key: String,
    ): String? = this
        .getValueOrNull(section, key)
        ?.asLiteralOrNull()
        ?.literalContentOrNull

    fun getString(
        section: String,
        key: String,
    ): String {
        val value = getValue(section, key)
        if (value is YamlNull) {
            throw IllegalArgumentException("The value of ${propertyPath(section, key)} is null. Expected string.")
        } else if (value !is YamlLiteral) {
            throw IllegalArgumentException("The value of ${propertyPath(section, key)} is invalid. Expected string.")
        } else {
            return value.toString()
        }
    }

    fun getBoolOrNull(
        section: String,
        key: String,
    ): Boolean? = this
        .getValueOrNull(section, key)?.asLiteralOrNull()?.toBoolean()

    fun getIntOrNull(
        section: String,
        key: String,
    ): Int? = this
        .getValueOrNull(section, key)?.asLiteralOrNull()?.toIntOrNull()
}

fun decodeYamlFromFile(path: String): YamlMap {
    val file = Path(path)

    var yamlString = try {
        file.readText()
    } catch (e: Exception) {
        logger.error("Failed to read: ${file.pathString}", e)
        throw e
    }

    // Yamlkt crashes if it encounters a file with only commented fields.
    // This is a workaround.
    yamlString = yamlString.plus(
        "\n__workaround:\n\ttrue: true",
    )

    return try {
        Yaml.decodeYamlMapFromString(yamlString)
    } catch (e: Exception) {
        logger.error("Failed to parse: ${file.pathString}", e)
        throw e
    }
}

fun mergeConfigYaml(overrideYaml: YamlMap, mainYaml: YamlMap): YamlMap {
    val map: MutableMap<YamlElement, YamlElement> = mainYaml.toMutableMap()

    for (entry in overrideYaml) {
        if (entry.value == map.get(entry.key)) continue

        if (entry.value is YamlMap) {
            map.set(
                entry.key,
                mergeConfigYaml(entry.value as YamlMap, map.get(entry.key) as YamlMap),
            )
        } else {
            map.set(entry.key, entry.value)
        }
    }

    return mainYaml.copy(map)
}
