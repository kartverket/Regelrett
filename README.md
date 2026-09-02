# Regelrett

Et open-source verktøy for administrasjon av sikkerhets-compliance i komplekse
organisasjoner.

Denne applikasjonen er bygget for visning av data i tabellformat på en
oversiktlig og brukervennlig måte. Løsningen støtter data fra AirTable og
YAML-filer. Den er utviklet med fokus på å hjelpe brukere med å oppfylle krav
og standarder ved å gi en strukturert oversikt over nødvendige data. Brukere
kan legge inn svar i ulike formater samt legge til kommentarer direkte i
tabellens rader, noe som gjør det enkelt å holde oversikt over status og
nødvendig informasjon. Løsningen er fleksibel og tilrettelagt for videre
utvidelser etter behov.

Følg stegene nedenfor for å komme i gang, og bruk de tilgjengelige skriptene
for å administrere prosjektet effektivt.

## Konfigurasjon

Regelrett kan konfigureres for å tilpasse seg ulike behov. Med det følger en drøss av verdier man kan endre på. Nesten alt har en [default verdi](conf/defaults.yaml); de som MÅ bli satt (ikke har default verdi) for at Regelrett skal fungere er nevnt under i [Steg 1](#steg-1-konfigurasjon), andre er nevnt i [konfigurasjonsdokumentasjonen](conf/README.md).

Les mer:
[Konfigurasjon](conf/README.md)

## Provisjonering

Provisjoneringen til regelrett går ut på å fortelle til regelrett hvor og hvordan den finner skjemaene man etterhvert skal kunne fylle ut.
Det vil si at hvis du har konfigurert opp regelrett og fått den til å kjøre, vil den bare vise en blank side frem til du provisjonerer opp skjemakildene.

En kort intro til hvordan du gjør dette finner du i stegene under, men for mer utfyllende detaljer og eksempler bør du lese her:
[Provisjonering](conf/provisioning/README.md)

### Kjøre lokal PostgreSQL database

Du trenger `docker-compose` og en docker-daemon installert, der **Colima** er et greit valg. Følgende kommandoer tar deg langt på vei hvis du har Homebrew installert:

```
brew install docker
brew install docker-compose
brew install colima
```

Deretter kan du starte Colima med:

```
colima start --network-address
```

Alternativt kan du bruke Postgres desktop til å kjøre en database lokalt. Som standard antar Regelrett at du
har en bruker `postgres` uten passord. Dette er
[konfigurerbart](conf/README.md).

Start så databasen (i detached mode) med

```
docker compose up regelrett-db -d
```

Nå skal databasen være oppe og kjøre! Hvis du ønsker å kjøre opp databasen på en egen port må du huske å bytte ut porten i configen og i kommandoen over.

### Info

- Du kan stoppe containeren ved å kjøre `docker compose stop regelrett-db` og starte den igjen med
  `docker compose start regelrett-db`.
- Applikasjonen bruker en PostgreSQL-database, og Flyway migration for å gjøre
  endringer på databaseskjemaer.
- Alle filer i Flyway migration script må ha følgende format:

`V<Version>__<Description>.sql` For eksempel: `V1.1__initial.sql`

- Migreringsfilene ligger i `src/main/resources/db/migration`.
- Databasen heter "regelrett", og må settes opp lokalt på utviklerens
  maskin utenfor Flyway.
- Databasemigreringer kjører automatisk ved oppstart av applikasjonen, eller så
  kan de kjøres manuelt med `./gradlew flywayMigrate`

## Kjøre frontend og backend lokalt

Backend er bygget med KTOR og frontend er bygget med React, Vite og TypeScript.

### Steg 0

Før du begynner, sørg for at du har følgende installert:

- **[Node.js](https://nodejs.org)** (versjon 20.x eller nyere)
- **[pnpm](https://pnpm.io/)**
- **JDK 21** (eller nyere) for backend

### Steg 1: Konfigurasjon

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

Eller som miljøvariabler:

```env
RR_OAUTH_TENANT_ID=<TENANT_ID>
RR_OAUTH_CLIENT_ID=<CLIENT_ID>
RR_OAUTH_CLIENT_SECRET=<CLIENT_SECRET>
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

### Steg 2: Frontend dev server

- Installer avhengigheter med `pnpm i`
- Start utviklingsserveren ved å kjøre: `pnpm run dev`

### Steg 3: Web server

#### IntelliJ

- Gå inn på `Run -> Edit configurations`
- Trykk på + for å legge til ny konfigurasjon og velg KTOR
- Sett `no.bekk.ApplicationKt` som main class

#### Terminal

- `./gradlew -t build -x test` i ett shell
- `./gradlew run` i ett annet

Backenden fungerer som api og webserver for frontenden, som skal være
tilgjengelig på `http://localhost:8080`

### Steg 4: Provisjonering

Nå som Regelrett er oppe og kjører, må du provisjonere skjemakildene slik som beskrevet i [`conf/provisioning/README.md`](conf/provisioning/README.md).
I praksis betyr provisjonering at du forteller Regelrett hvor skjemaene ligger (Airtable eller Yaml) og hvordan man får tak i dem, slik at applikasjonen kan laste dem inn.  
I [`conf/provisioning/schemasources/sample.yaml`](conf/provisioning/schemasources/sample.yaml) finner du et eksempel på hvordan du provisjonerer opp et skjema.
Kopier eksempelet og endre verdiene til å stemme overens med dine skjemakilder og skjema. Du kan provisjonere opp flere skjemaer i samme fil.

Det finnes to typer skjemakilder: YAML og Airtable. For YAML-skjemaer lager du én `.yaml`-fil per skjema i mappen [src/main/resources/questions](src/main/resources/questions)

Hvis du provisjonerer opp en skjemakilde fra airtable og velger å beholde [airtable access_token som miljøvariabel](conf/provisioning/README.md#use-environment-variables) slik som i sample.yaml, må du sette denne som en miljøvariabel. Denne brukes i
conf/provisioning/<yourProvisioningFileName>.yaml og kan derfor ikke settes i conf/custom.yaml:

```env
RR_AIRTABLE_ACCESS_TOKEN=<PAT>
```

Les mer om [provisjonering](conf/provisioning/README.md).

## Kjøre testene

For å kunne kjøre flere av testene lokalt, så må du ha en fungerende
dockerinstallasjon. I tillegg, avhengig av oppsettet ditt, så er det noen
spesifikke miljøvariabler som må settes. Hvis du bruker colima, sett følgende i
.bashrc/.zshrc eller andre tilsvarende konfigurasjonsfiler for ditt shell;

```shell
export TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock
export TESTCONTAINERS_HOST_OVERRIDE=$(colima ls -j | jq -r '.address') export
DOCKER_HOST="unix://${HOME}/.colima/default/docker.sock"
```

Merk at det er viktig at colima startes med `--network-address` flagget, da det
er trengs for å hente ut adressen til `TESTCONTAINERS_HOST_OVERRIDE`.

Hvis du bruker noe annet, eksempelvis Podman eller Rancher, se dokumentasjonen
til testcontainers;
https://java.testcontainers.org/supported_docker_environment/

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
