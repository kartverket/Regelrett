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

## Mer informasjon om frontenden

- For å sikre kodekvalitet, kjør lint-verktøyet: `pnpm run lint`
- For å automatisk fikse lintingproblemer: `pnpm run lint-fix`
- For å formatere kodebasen med Prettier: `pnpm run format`. Dette vil formatere
  alle filer i `app`-mappen.
- For å kjøre typesjekk (inkludert `react-router` typegen): `pnpm run typecheck`.
- For å kjøre frontendtestene (Vitest): `pnpm test`.
- For å lage en produksjonsklar versjon av prosjektet: `pnpm run build`. Dette
  vil kompilere TypeScript-filene og pakke applikasjonen ved hjelp av Vite.
  Output vil bli plassert i `dist`-mappen, klar for utrulling.
- Før du ruller ut, kan du forhåndsvise produksjonsbygget lokalt:
  `pnpm run preview`. Denne kommandoen vil servere produksjonsbygget på en
  lokal server, slik at du kan verifisere at alt fungerer som forventet.
- Husky er konfigurert til å kjøre visse skript før commits blir fullført.
  Dette inkluderer linting og TypeScript-sjekker for å sikre kodekvalitet og
  konsistens. Disse kjøres via `lint-staged` på stage'ede filer.
- Dette prosjektet bruker TanStack Query (tidligere kjent som React Query) for
  å håndtere nettverksforespørsler og servertilstand. TanStack Query forenkler
  datainnhenting, caching, synkronisering og oppdatering av servertilstand i
  React-applikasjoner. Ved å bruke dette kraftige biblioteket sikrer prosjektet
  effektiv og pålitelig datahåndtering, minimerer unødvendige
  nettverksforespørsler, og gir en optimal brukeropplevelse med automatiske
  bakgrunnsoppdateringer og feilhåndtering. Se dokumentasjonen for TanStack
  Query her: https://tanstack.com/query/latest
