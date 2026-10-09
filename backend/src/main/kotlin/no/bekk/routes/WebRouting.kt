package no.bekk.routes

import io.ktor.client.*
import io.ktor.client.request.get
import io.ktor.client.request.request
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.html.*
import io.ktor.server.http.content.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.html.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import no.bekk.configuration.FrontendDevServerConfig
import no.bekk.routes.*
import java.io.File

fun Route.webRouting(cfg: FrontendDevServerConfig, homePath: String) {
    if (application.developmentMode) {
        get("/{...}") {
            call.respondHtmlTemplate(DevTemplate(cfg)) {}
        }

        // Proxy static asset requests to dev server
        get("/app/{...}") {
            call.respondRedirect("http://${cfg.host}:${cfg.httpPort}${call.request.local.uri}")
        }
    } else {
        val frontendBuild = "$homePath/dist"
        val manifestFile = File("$frontendBuild/.vite/manifest.json")
        val manifest = Manifest(Json.decodeFromString<Map<String, Chunk>>(manifestFile.readText()))

        val root = RootTemplate(
            cfg,
            manifest,
            manifest.getEntry()
                ?: throw IllegalStateException("Unable to determine frontend entrypoint from: $frontendBuild/.vite/manifest.json"),
        )

        staticFiles("/assets", File("$frontendBuild/assets/"))

        get("/{...}") {
            call.respondHtmlTemplate(root) {}
        }
    }
}

class Manifest(
    val chunks: Map<String, Chunk>,
) {
    fun getEntry(): Chunk? {
        for (c in chunks) {
            if (c.value.isEntry) {
                return c.value
            }
        }
        return null
    }

    fun stylesheets(chunk: Chunk): List<String> {
        val files = chunk.css.toMutableList()

        for (i in chunk.imports) {
            val next = chunks[i]
            if (next != null) {
                files.addAll(stylesheets(next))
            }
        }

        return files
    }
}

@Serializable
class Chunk(
    val file: String,
    val name: String? = null,
    val imports: List<String> = emptyList(),
    val src: String? = null,
    val isDynamicEntry: Boolean = false,
    val isEntry: Boolean = false,
    val dynamicImports: List<String> = emptyList(),
    val css: List<String> = emptyList(),
    val assets: List<String> = emptyList(),
)

class RootTemplate(val cfg: FrontendDevServerConfig, val m: Manifest, val entry: Chunk) : Template<HTML> {
    override fun HTML.apply() {
        head {
            meta(charset = "UTF-8")
            title {
                +"Regelrett"
            }
            script(type = "module", src = "/${entry.file}") {}

            for (i in entry.imports) {
                link(rel = "modulepreload", href = "/${m.chunks[i]?.file}") {}
            }

            for (s in m.stylesheets(entry)) {
                link(href = "/$s", rel = "stylesheet") {}
            }
        }
        body(classes = "kartverket") {
            div { id = "root" }
        }
    }
}

class DevTemplate(val cfg: FrontendDevServerConfig) : Template<HTML> {
    override fun HTML.apply() {
        head {
            meta(charset = "UTF-8")
            link {
                rel = "preconnect"
                href = "https://fonts.googleapis.com"
            }
            link {
                rel = "preconnect"
                href = "https://fonts.gstatic.com"
            }
            link {
                rel = "stylesheet"
                href = "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
            }
            title {
                +"Regelrett"
            }
            script(
                type = "module",
            ) {
                unsafe {
                    +"""import RefreshRuntime from '${cfg.devUrl}/@react-refresh'
                    RefreshRuntime.injectIntoGlobalHook(window)
                    window.${'$'}RefreshReg$ = function () {}
                    window.${'$'}RefreshSig$ = function () { return function (type) { return type } }
                    window.__vite_plugin_react_preamble_installed__ = true
                    """
                }
            }

            script(type = "module", src = "${cfg.devUrl}/@vite/client") {}
            script(type = "module", src = "${cfg.devUrl}/app/main.tsx") {}
        }
        body(classes = "kartverket") {
            div { id = "root" }
        }
    }
}
