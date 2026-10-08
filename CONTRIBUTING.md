# Bidra til Regelrett

Under finner du alt du trenger for å komme i gang med et lokalt utviklingsmiljø.

## Steg 1 - Konfigurere miljøvariabler

Du må konfigurere applikasjonen slik det beskrives i
[`conf/README.md`](conf/README.md). Du kan enten opprette en `conf/custom.yaml`
fil, eller bruke miljøvariabler der du kjører backenden.

Verdiene som _må_ overskrives, enten i fil - i conf/custom.yaml:

```yaml
oauth:
  tenant_id: <tenant_id>
  client_id: <client_id>
  client_secret: <client_secret>
```

Eller i `.env`-fil (forutsetning om du benytter Docker for å kjøre tjenesten):

```env
RR_OAUTH_TENANT_ID=<TENANT_ID>
RR_OAUTH_CLIENT_ID=<CLIENT_ID>
RR_OAUTH_CLIENT_SECRET=<CLIENT_SECRET>
RR_AIRTABLE_ACCESS_TOKEN=<AIRTABLE_ACCESS_TOKEN>
```

Om du setter base.mode til development skal KTOR appen kunne reloades
automatisk.

conf/custom.yaml:

```yaml
base:
  mode: development
```

Miljøvariabel:

```env
RR_BASE_MODE=development
```

Du kan sette miljøvariablene i IntelliJ ved å gå inn på `Run -> Edit
configurations`.

## Steg 2 - Kjøre tjenesten lokalt

#### Forutsetninger

Følgende må være installert

- Docker
- docker-compose
- Colima (eller tilsvarende)
- Node.js v24.x
- JDK v25.x
- pnpm

Backenden fungerer både som API og webserver for frontenden og vil være tilgjengelig på `http://localhost:8080`

#### Alternativ #1 - Docker

> Bør brukes når man ønsker en rask måte å starte tjenesten på, for eksempel under testing av ny funksjonalitet

Start database og backend

```sh
docker compose up
```

Start kun database

```sh
docker compose up regelrett-db
```

#### Alternativ 2 - pnpm og Gradle

> Bør brukes når man gjør utviklingsoppgaver og er avhengig av hot-reloading

Start frontend

```sh
pnpm dev
```

Start database

```sh
docker compose up regelrett-db
```

Start backend

```sh
./gradlew run
```

Backend kan også startes direkte i IntelliJ

1.  Gå inn på `Run -> Edit configurations`
2.  Trykk på + for å legge til ny konfigurasjon og velg KTOR
3.  Sett `no.bekk.ApplicationKt` som main class

<br>

## Kjøre tester

Testene kjøres med Gradle:

```sh
./gradlew test
```

Som standard utelater denne kommandoen testene som er merket med
`IntegrationTest`. De øvrige testene krever normalt ikke Docker.

For å kjøre alle testene, inkludert testene merket `IntegrationTest`, bruk:

```sh
./gradlew test -PintegrationTest
```

> Bruker man Colima krever det noe ekstra oppsett for å kjøre integrasjonstestene. Se [her](https://java.testcontainers.org/supported_docker_environment/).
