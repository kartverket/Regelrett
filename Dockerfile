# syntax=docker/dockerfile:1

# -----------------------------------------------------------------------------
# Build images
# -----------------------------------------------------------------------------

# JavaScript build
FROM dhi.io/node:24-alpine3.24-dev@sha256:0da0a63de2c7c4a094a85c3f286368426fcd16afc304d08dab62ffbc0e285a6d AS js-base
WORKDIR /tmp/regelrett
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY frontend/package.json frontend/pnpm-lock.yaml ./frontend/

FROM js-base AS js-builder
WORKDIR /tmp/regelrett/frontend
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY frontend/ ./
COPY conf/defaults.yaml ../conf/defaults.yaml
ENV NODE_ENV=production
RUN pnpm build

# Kotlin build
FROM dhi.io/gradle:9-jdk25-alpine3.23-dev@sha256:b0ae19d017beed75d91ff5d0dbeaa8c68081a4621bee2a1ee38d8ed44f75e1ab AS kt-builder
WORKDIR /tmp/regelrett/backend
COPY backend/src ./src
COPY backend/build.gradle.kts backend/settings.gradle.kts backend/gradle.properties backend/gradlew backend/gradlew.bat ./
COPY backend/gradle ./gradle
COPY conf ../conf

# Build the executable fat JAR with the Shadow plugin.
RUN --mount=type=cache,id=gradle,target=/home/gradle/.gradle \
    ./gradlew shadowJar --no-daemon && \
    install -d -m 0755 /tmp/runtime-root/etc/regelrett && \
    install -d -m 0777 /tmp/runtime-root/etc/regelrett/provisioning/schemasources && \
    install -m 0666 ../conf/provisioning/schemasources/sample.yaml \
        /tmp/runtime-root/etc/regelrett/provisioning/schemasources/sample.yaml && \
    install -m 0644 ../conf/sample.yaml /tmp/runtime-root/etc/regelrett/regelrett.yaml

# OpenTelemetry agent
FROM otel/autoinstrumentation-java:2.34.0-1@sha256:9e32040d5521bc5771c1290e7757131f7f4032fb3ecdece37781a5f118d4ae64 AS otel-agent

# -----------------------------------------------------------------------------
# Runtime image
# -----------------------------------------------------------------------------
FROM dhi.io/eclipse-temurin:25-alpine3.24@sha256:a2000057670f93826bd1e2fd69e291653ed89e220aeb96dd101f3abd98ba6976

ARG RR_UID="472"
ARG RR_GID="0"

ENV RR_PATHS_PROVISIONING="/etc/regelrett/provisioning" \
    RR_PATHS_CONFIG="/etc/regelrett/regelrett.yaml" \
    RR_PATHS_HOME="/usr/share/regelrett" \
    RR_PATHS_JAR="/app/regelrett.jar" \
    OTEL_JAVAAGENT_PATH="/agents/opentelemetry.jar"

WORKDIR $RR_PATHS_HOME

COPY --from=kt-builder --chown=${RR_UID}:${RR_GID} /tmp/regelrett/conf conf
COPY --from=kt-builder --chown=${RR_UID}:${RR_GID} /tmp/regelrett/backend/build/libs/*.jar ${RR_PATHS_JAR}
COPY --from=kt-builder --chown=${RR_UID}:${RR_GID} /tmp/runtime-root/etc/regelrett /etc/regelrett
COPY --from=otel-agent --chown=${RR_UID}:${RR_GID} /javaagent.jar ${OTEL_JAVAAGENT_PATH}
COPY --from=js-builder --chown=${RR_UID}:${RR_GID} /tmp/regelrett/frontend/dist ./dist

ENV RR_SERVER_HTTP_PORT=8080
ENV RR_MANAGEMENT_HTTP_PORT=8081
EXPOSE $RR_SERVER_HTTP_PORT $RR_MANAGEMENT_HTTP_PORT
HEALTHCHECK NONE

USER "$RR_UID"
ENTRYPOINT ["java", "-Duser.timezone=Europe/Oslo", "-jar", "/app/regelrett.jar", "--homepath=/usr/share/regelrett", "--config=/etc/regelrett/regelrett.yaml"]
