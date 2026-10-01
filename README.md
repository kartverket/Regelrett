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

## Kjøre tjenesten lokalt

Se [CONTRIBUTING](CONTRIBUTING.md)

### Info

- Applikasjonen bruker en PostgreSQL-database, og Flyway migration for å gjøre
  endringer på databaseskjemaer.
- Alle filer i Flyway migration script må ha følgende format:

`V<Version>__<Description>.sql` For eksempel: `V1.1__initial.sql`

- Migreringsfilene ligger i `src/main/resources/db/migration`.
- Databasen heter "regelrett", og må settes opp lokalt på utviklerens
  maskin utenfor Flyway.
- Databasemigreringer kjører automatisk ved oppstart av applikasjonen, eller så
  kan de kjøres manuelt med `./gradlew flywayMigrate`

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

### Verifisere containeren

Applikasjonsbildet bruker digest-låste Docker Hardened Images fra `dhi.io` og
bygges for `linux/amd64`. Runtime-bildet er en minimal variant uten skall eller
pakkehåndterer. Bruk `JAVA_TOOL_OPTIONS` i stedet for `JAVA_OPTS` for å sende
flagg til JVM-en. Logg inn med `docker login dhi.io` før lokal bygging. Kjør
containerkontrakten, inkludert lokal PostgreSQL og bind-montert provisjonering,
med:

```shell
./scripts/container-contract.sh
```

Skriptet bruker et midlertidig Buildx-oppsett under kjøringen, slik at det ikke
skriver til Buildx-tilstanden under brukerens Docker-konfigurasjon.

CI krever Actions secrets `DHI_USERNAME` og `DHI_TOKEN`. Legg de samme navnene
inn som Dependabot secrets, slik at Docker-oppdateringen kan lese `dhi.io`.
Oppdater DHI-referansene ved å beholde versjonstaggene i `FROM`-linjene og
erstatte digestene med de publiserte multi-arkitektur-digestene.

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
