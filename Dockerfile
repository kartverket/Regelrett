# syntax=docker/dockerfile:1

ARG JS_PLATFORM=linux/amd64
ARG OTEL_JAVA_AGENT_VERSION=2.29.0

# -----------------------------------------------------------------------------
# Build images
# -----------------------------------------------------------------------------

# JavaScript build
FROM --platform=${JS_PLATFORM} dhi.io/node:22.23.2-alpine3.24-dev@sha256:884fa94e9c3228138eeaa7376f40972647ac6eaf8c960e407b1ea374f9479b0d AS js-base
WORKDIR /tmp/regelrett
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY package.json pnpm-lock.yaml ./

FROM js-base AS js-builder
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY app/ app/
COPY conf/defaults.yaml ./conf/defaults.yaml
COPY tsconfig.json vite.config.ts components.json ./
ENV NODE_ENV=production
RUN pnpm build

# Kotlin build
FROM dhi.io/gradle:9.5.1-jdk21-alpine-dev@sha256:0fb4c1c5b3bf5b1a4d9a5af68f467ed6d830dd027d01e14c4e70435dfedb7c7b AS kt-builder
WORKDIR /tmp/regelrett
COPY conf conf
COPY src src
COPY build.gradle.* gradle.properties ./
COPY gradle ./gradle

# Build the fat JAR, Gradle also supports shadow
# and boot JAR by default.
RUN --mount=type=cache,id=gradle,target=/home/gradle/.gradle \
    gradle shadowJar --no-daemon

# OpenTelemetry agent
ARG OTEL_JAVA_AGENT_VERSION
FROM otel/autoinstrumentation-java:${OTEL_JAVA_AGENT_VERSION} AS otel-agent

# -----------------------------------------------------------------------------
# Runtime image
# -----------------------------------------------------------------------------
FROM dhi.io/eclipse-temurin:25.0.2.10-alpine3.23-dev@sha256:118aef9e9fa388809f0105f8e78e75bd4b4f4426f1e31a510bbe8719768f47dd

RUN apk add --no-cache \
    gnutls \
    libcrypto3=3.5.8-r0 \
    libpng \
    libssl3=3.5.8-r0

LABEL maintainer="Bekk Consulting" \
    org.opencontainers.image.source="https://github.com/bekk/regelrett"

ARG RR_UID="472"
ARG RR_GID="0"

ENV RR_PATHS_PROVISIONING="/etc/regelrett/provisioning" \
    RR_PATHS_CONFIG="/etc/regelrett/regelrett.yaml" \
    RR_PATHS_HOME="/usr/share/regelrett" \
    RR_PATHS_JAR="/app/regelrett.jar" \
    OTEL_JAVAAGENT_PATH="/agents/opentelemetry.jar"

WORKDIR $RR_PATHS_HOME

COPY --from=kt-builder /tmp/regelrett/conf conf
COPY --from=kt-builder /tmp/regelrett/build/libs/*.jar ${RR_PATHS_JAR}
COPY --from=otel-agent /javaagent.jar ${OTEL_JAVAAGENT_PATH}

RUN adduser -S -u "$RR_UID" -G root regelrett && \
    mkdir -p "$RR_PATHS_PROVISIONING/schemasources" && \
    cp conf/provisioning/schemasources/sample.yaml "$RR_PATHS_PROVISIONING/schemasources/" && \
    cp conf/sample.yaml "$RR_PATHS_CONFIG" && \
    chown -R "regelrett:$RR_GID" "$RR_PATHS_HOME" "$RR_PATHS_PROVISIONING" "$RR_PATHS_JAR" "$OTEL_JAVAAGENT_PATH" && \
    chmod -R 777 "$RR_PATHS_PROVISIONING"

COPY --from=js-builder /tmp/regelrett/dist ./dist

ENV RR_SERVER_HTTP_PORT=8080
ENV RR_MANAGEMENT_HTTP_PORT=8081
EXPOSE $RR_SERVER_HTTP_PORT $RR_MANAGEMENT_HTTP_PORT
HEALTHCHECK NONE

USER "$RR_UID"
ENTRYPOINT ["sh", "-c", "exec java ${JAVA_OPTS:-} -Duser.timezone=Europe/Oslo -jar /app/regelrett.jar --homepath=$RR_PATHS_HOME --config=$RR_PATHS_CONFIG"]
