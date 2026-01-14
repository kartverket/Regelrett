import com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar
import org.gradle.api.tasks.testing.logging.TestExceptionFormat

plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.ktor)
    alias(libs.plugins.kotlin.plugin.serialization)
    alias(libs.plugins.flywaydb)
    alias(libs.plugins.ktlint)
}

group = "no.bekk"
version = "0.0.1"

application {
    mainClass = "no.bekk.ApplicationKt"
}

repositories {
    mavenCentral()
}

dependencies {
    implementation(libs.ktor.server.core)
    implementation(libs.ktor.server.html.builder)
    implementation(libs.kotlinx.html)
    implementation(libs.ktor.server.call.logging)
    implementation(libs.ktor.server.host.common)
    implementation(libs.ktor.serialization.kotlinx.json)
    implementation(libs.ktor.server.content.negotiation)
    implementation(libs.ktor.server.sessions)
    implementation(libs.ktor.server.auth)
    implementation(libs.ktor.client.auth)
    implementation(libs.ktor.client.core)
    implementation(libs.ktor.client.cio)
    implementation(libs.ktor.client.content.negotiation)
    implementation(libs.ktor.client.apache)
    implementation(libs.ktor.server.auth.jwt)
    implementation(libs.ktor.server.default.headers)
    implementation(libs.ktor.server.forwarded.header)
    implementation(libs.ktor.server.cors)
    implementation(libs.ktor.server.netty)
    implementation(libs.logback.classic)
    implementation(libs.ajalt.clikt)
    implementation(libs.mamoe.yamlkt)
    implementation(libs.zaxxer.hikari)
    implementation(libs.postgresql.driver)
    implementation(libs.flyway.database.core)
    implementation(libs.flyway.database.postgresql)
    implementation(libs.ben.manes.caffeine)

    testImplementation(libs.testcontainers.testcontainers)
    testImplementation(libs.testcontainers.postgresql)
    testImplementation(libs.ktor.server.test.host)
    testImplementation(libs.kotlin.test.junit)
    testRuntimeOnly(libs.junit.platform.launcher)
}

tasks {
    withType<ShadowJar> {
        isZip64 = true
        mergeServiceFiles {
            include("META-INF/services/**")
            duplicatesStrategy = DuplicatesStrategy.INCLUDE
        }
    }
    withType<Test> {
        testLogging {
            showCauses = true
            showExceptions = true
            exceptionFormat = TestExceptionFormat.FULL
            events("passed", "skipped", "failed")
        }
        useJUnitPlatform {
            if (!project.hasProperty("integrationTest")) {
                excludeTags = setOf("IntegrationTest")
            }
        }
    }
}
