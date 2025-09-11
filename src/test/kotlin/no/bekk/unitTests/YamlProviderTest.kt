package no.bekk.unitTests

import kotlinx.coroutines.test.runTest
import no.bekk.providers.YamlProvider
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class YamlProviderTest {

    @Test
    fun `Should correctly deserialize YAML`() = runTest {
        val yamlProvider = YamlProvider(id = "1", name = "YamlTest", resourcePath = "questions/testQuestions.yaml")
        val form = yamlProvider.getForm()

        assertEquals(form.records.size, 7)

        val question = yamlProvider.getQuestion("Z-424")

        assertEquals(question.question, "Hvor lang er gjennomsnittlig responstid?")
    }
}
