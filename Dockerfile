# syntax=docker/dockerfile:1

# -----------------------------------------------------------------------------
# Build images
# -----------------------------------------------------------------------------

# JavaScript build
FROM dhi.io/node:24-alpine3.24-dev-dev@sha256:884fa94e9c3228138eeaa7376f40972647ac6eaf8c960e407b1ea374f9479b0d AS js-base
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
FROM dhi.io/gradle:9-jdk25-alpine3.23-dev@sha256:0dd3d4f3b8544e44a039cefe0520f859b7fa5f0ee787aeb5542a65be420e4649 AS kt-builder
WORKDIR /tmp/regelrett
COPY conf conf
COPY src src
COPY build.gradle.* gradle.properties ./
COPY gradle ./gradle

# Build the executable fat JAR with the Shadow plugin.
RUN --mount=type=cache,id=gradle,target=/home/gradle/.gradle \
    gradle shadowJar --no-daemon && \
    install -d -m 0755 /tmp/runtime-root/etc/regelrett && \
    install -d -m 0777 /tmp/runtime-root/etc/regelrett/provisioning/schemasources && \
    install -m 0666 conf/provisioning/schemasources/sample.yaml \
        /tmp/runtime-root/etc/regelrett/provisioning/schemasources/sample.yaml && \
    install -m 0644 conf/sample.yaml /tmp/runtime-root/etc/regelrett/regelrett.yaml

# OpenTelemetry agent
FROM otel/autoinstrumentation-java:2.32.0-1@sha256:9dad1c6e3e2ecee48fc164a19bcfde703510bee972c8cb421689fde89b5f89e9 AS otel-agent

# -----------------------------------------------------------------------------
# Runtime image
# -----------------------------------------------------------------------------
FROM dhi.io/eclipse-temurin:25-alpine3.23@sha256:9a1468f69531dcd1604d7a9865a8826b5f94fc07e066417981c07d12ee737f98

ARG RR_UID="472"
ARG RR_GID="0"

ENV RR_PATHS_PROVISIONING="/etc/regelrett/provisioning" \
    RR_PATHS_CONFIG="/etc/regelrett/regelrett.yaml" \
    RR_PATHS_HOME="/usr/share/regelrett" \
    RR_PATHS_JAR="/app/regelrett.jar" \
    OTEL_JAVAAGENT_PATH="/agents/opentelemetry.jar"

WORKDIR $RR_PATHS_HOME

COPY --from=kt-builder --chown=${RR_UID}:${RR_GID} /tmp/regelrett/conf conf
COPY --from=kt-builder --chown=${RR_UID}:${RR_GID} /tmp/regelrett/build/libs/*.jar ${RR_PATHS_JAR}
COPY --from=kt-builder --chown=${RR_UID}:${RR_GID} /tmp/runtime-root/etc/regelrett /etc/regelrett
COPY --from=otel-agent --chown=${RR_UID}:${RR_GID} /javaagent.jar ${OTEL_JAVAAGENT_PATH}
COPY --from=js-builder --chown=${RR_UID}:${RR_GID} /tmp/regelrett/dist ./dist

ENV RR_SERVER_HTTP_PORT=8080
ENV RR_MANAGEMENT_HTTP_PORT=8081
EXPOSE $RR_SERVER_HTTP_PORT $RR_MANAGEMENT_HTTP_PORT
HEALTHCHECK NONE

USER "$RR_UID"
ENTRYPOINT ["java", "-Duser.timezone=Europe/Oslo", "-jar", "/app/regelrett.jar", "--homepath=/usr/share/regelrett", "--config=/etc/regelrett/regelrett.yaml"]
