package no.bekk.tests

import net.mamoe.yamlkt.Yaml
import no.bekk.configuration.mergeConfigYaml
import org.junit.jupiter.api.Test
import kotlin.test.expect

class YamlConfigTest {
    @Test
    fun `Merge Yaml`() {
        val mainYaml = Yaml.decodeYamlMapFromString(
            """
          server:
            protocol: http
            http_port: 8080

          schema_sources:
            airtable_base_url: "base"
          #   sources:
          #   - id: ""
          #   - id: ""

          database:
            max_open_conn: ~
            max_idle_conn: 2
          """,
        )

        val userYaml = Yaml.decodeYamlMapFromString(
            """
          schema_sources:
            airtable_base_url: "base"
            sources:
            - id: "a"
            - id: "b"

          database:
            max_open_conn: 1
          """,
        )

        val output = mergeConfigYaml(userYaml, mainYaml)

        expect(
            Yaml.decodeYamlMapFromString(
                """
            server:
              protocol: http
              http_port: 8080
            schema_sources:
              airtable_base_url: base
              sources:
              - id: a
              - id: b
            database:
              max_open_conn: 1
              max_idle_conn: 2
            """,
            ),
            { output },
        )
    }
}
