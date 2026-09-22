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
COPY app/ app/
COPY conf/defaults.yaml ./conf/defaults.yaml

FROM js-base AS js-builder
COPY tsconfig.json vite.config.ts components.json eslint.config.ts .editorconfig .prettierrc ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
ENV NODE_ENV=production
RUN pnpm build

# Kotlin build
FROM dhi.io/gradle:8.14.5-r7-jdk21-alpine3.24-dev@sha256:59eed81f9bc6bd9915bb3f92a27b19a59fe79f76bc6b1d49e0c7238aa0bb5b85 AS kt-builder
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
FROM dhi.io/eclipse-temurin:25.0.2.10-alpine3.23-dev@sha256:118aef9e9fa388809f0105f8e78e75bd4b4f4426f1e31a510bbe8719768f47dd AS otel-agent
ARG OTEL_JAVA_AGENT_VERSION
RUN wget -q -O /opentelemetry-javaagent.jar \
    "https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v${OTEL_JAVA_AGENT_VERSION}/opentelemetry-javaagent.jar"

# -----------------------------------------------------------------------------
# Runtime image
# -----------------------------------------------------------------------------
FROM dhi.io/eclipse-temurin:25.0.2.10-alpine3.23-dev@sha256:118aef9e9fa388809f0105f8e78e75bd4b4f4426f1e31a510bbe8719768f47dd

RUN apk add --no-cache \
    gnutls \
    libcrypto3=3.5.8-r0 \
    libpng \
    libssl3=3.5.8-r0

LABEL maintainer="Bekk Consulting"
LABEL org.opencontainers.image.source="https://github.com/bekk/regelrett"

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
COPY --from=otel-agent /opentelemetry-javaagent.jar ${OTEL_JAVAAGENT_PATH}

RUN adduser -S -u "$RR_UID" -G root regelrett && \
    mkdir -p "$RR_PATHS_PROVISIONING/schemasources" && \
    cp conf/provisioning/schemasources/sample.yaml "$RR_PATHS_PROVISIONING/schemasources/" && \
    cp conf/sample.yaml "$RR_PATHS_CONFIG" && \
    chown -R "regelrett:$RR_GID" "$RR_PATHS_HOME" "$RR_PATHS_PROVISIONING" "$RR_PATHS_JAR" "$OTEL_JAVAAGENT_PATH" && \
    chmod -R 777 "$RR_PATHS_PROVISIONING"

ENV JAVA_HOME=/usr/lib/jvm/temurin-25
ENV PATH="${JAVA_HOME}/bin:${PATH}"

COPY --from=js-builder /tmp/regelrett/dist ./dist

ENV RR_SERVER_HTTP_PORT=8080
ENV RR_MANAGEMENT_HTTP_PORT=8081
EXPOSE $RR_SERVER_HTTP_PORT $RR_MANAGEMENT_HTTP_PORT
HEALTHCHECK NONE

USER "$RR_UID"
ENTRYPOINT ["sh", "-c", "exec java ${JAVA_OPTS:-} -Duser.timezone=Europe/Oslo -jar /app/regelrett.jar --homepath=$RR_PATHS_HOME --config=$RR_PATHS_CONFIG"]
