# syntax=docker/dockerfile:1

ARG BASE_IMAGE=eclipse-temurin:21-jre-alpine
ARG JS_IMAGE=node:22-alpine
ARG JS_PLATFORM=linux/amd64
ARG GRADLE_IMAGE=gradle:8.14-jdk21-alpine

ARG KOTLIN_SRC=kt-builder
ARG JS_SRC=js-builder


FROM --platform=${JS_PLATFORM} ${JS_IMAGE} AS js-base
WORKDIR /tmp/regelrett
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
COPY app/ app/
COPY conf/defaults.yaml ./conf/defaults.yaml

FROM js-base AS js-prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM js-base AS js-builder
COPY tsconfig.json vite.config.ts components.json eslint.config.ts .editorconfig .prettierrc ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
ENV NODE_ENV=production
RUN pnpm build


FROM ${GRADLE_IMAGE} AS kt-cache
RUN mkdir -p /home/gradle/cache_home
ENV GRADLE_USER_HOME=/home/gradle/cache_home
WORKDIR /tmp/regelrett
COPY build.gradle.* gradle.properties ./
COPY gradle ./gradle
RUN gradle clean build -i --stacktrace

FROM ${GRADLE_IMAGE} AS kt-builder
WORKDIR /tmp/regelrett
COPY conf conf
COPY --from=kt-cache /home/gradle/cache_home /tmp/regelrett/.gradle

COPY src src
COPY build.gradle.* gradle.properties ./
COPY gradle ./gradle


# Build the fat JAR, Gradle also supports shadow
# and boot JAR by default.
RUN gradle shadowJar --no-daemon

FROM ${KOTLIN_SRC} AS kt-src
FROM ${JS_SRC} AS js-src

FROM ${BASE_IMAGE}

RUN apk update && apk add --no-cache --upgrade libpng gnutls

LABEL maintainer="Bekk Consulting"
LABEL org.opencontainers.image.source="https://github.com/bekk/regelrett"

ARG RR_UID="472"
ARG RR_GID="0"

ENV RR_PATHS_PROVISIONING="/etc/regelrett/provisioning" \
    RR_PATHS_CONFIG="/etc/regelrett/regelrett.yaml" \
    RR_PATHS_HOME="/usr/share/regelrett" \
    RR_PATHS_JAR="/app/regelrett.jar"

WORKDIR $RR_PATHS_HOME

COPY --from=kt-src /tmp/regelrett/conf conf
COPY --from=kt-src /tmp/regelrett/build/libs/*.jar ${RR_PATHS_JAR}

RUN if [ ! $(getent group "$RR_GID") ]; then \
    if grep -i -q alpine /etc/issue; then \
    addgroup -S -g $RR_GID regelrett; \
    elif grep -i -q ubuntu /etc/issue; then \
    DEBIAN_FRONTEND=noninteractive && \
    addgroup --system --gid $RR_GID regelrett; \
    else \
    echo 'ERROR: Unsupported base image' && /bin/false; \
    fi; \
    fi && \
    RR_GID_NAME=$(getent group $RR_GID | cut -d':' -f1) && \
    if grep -i -q alpine /etc/issue; then \
    adduser -S -u $RR_UID -G "$RR_GID_NAME" regelrett; \
    else \
    adduser --system --uid $RR_UID --ingroup "$RR_GID_NAME" regelrett; \
    fi && \
    mkdir -p "$RR_PATHS_PROVISIONING/schemasources" && \
    cp conf/provisioning/schemasources/sample.yaml "$RR_PATHS_PROVISIONING/schemasources/" && \
    cp conf/sample.yaml "$RR_PATHS_CONFIG" && \
    chown -R "regelrett:$RR_GID_NAME" "$RR_PATHS_HOME" "$RR_PATHS_PROVISIONING" "$RR_PATHS_JAR" && \
    chmod -R 777 "$RR_PATHS_PROVISIONING"

ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="${JAVA_HOME}/bin:${PATH}"

COPY --from=kt-src /tmp/regelrett/build/libs/*.jar ./app/regelrett.jar
COPY --from=js-src /tmp/regelrett/dist ./dist

ENV RR_SERVER_HTTP_PORT=8080
EXPOSE $RR_SERVER_HTTP_PORT
HEALTHCHECK NONE

USER "$RR_UID"
ENTRYPOINT ["sh", "-c", "java -Duser.timezone=Europe/Oslo -jar /app/regelrett.jar --homepath=$RR_PATHS_HOME --config=$RR_PATHS_CONFIG"]

