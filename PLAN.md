# Frontend/backend repository split

## Goal

Move the frontend and backend into dedicated top-level directories while
preserving local development, Docker builds, runtime behavior, CI, dependency
updates, and configuration.

The repository remains a monorepo: `frontend/` and `backend/` are deployed
together as one application image. This is a source-layout cleanup, not a
service split.

## Target layout

The following tree highlights the files affected by or relevant to the split;
other existing repository-level metadata remains at the root.

```text
/
├── backend/
│   ├── build.gradle.kts
│   ├── gradle.properties
│   ├── gradle/
│   ├── gradlew
│   ├── gradlew.bat
│   ├── settings.gradle.kts
│   └── src/
├── frontend/
│   ├── app/
│   ├── components.json
│   ├── eslint.config.ts
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── vitest.config.ts
├── conf/
├── .github/
├── .dockerignore
├── .editorconfig
├── .gitignore
├── .prettierignore
├── .prettierrc
├── .cplt.toml
├── .security/
├── catalog-info.yaml
├── compose.yaml
├── CONTRIBUTING.md
├── Dockerfile
├── LICENSE
├── README.md
└── PLAN.md
```

Keep `conf/` at the repository root. It is shared configuration: the backend
uses it at runtime, and the Vite development server reads
`conf/defaults.yaml` and optionally `conf/custom.yaml`.

Keep Docker, Docker Compose, repository-wide formatting configuration,
documentation, and GitHub workflows at the root because they orchestrate both
applications.

## Move source and build files

1. Use `git mv` to retain file history:
   - Move `src/`, Gradle wrapper files, `gradle/`, `build.gradle.kts`,
     `settings.gradle.kts`, and `gradle.properties` to `backend/`.
   - Move `app/`, `package.json`, `pnpm-lock.yaml`, `vite.config.ts`,
     `vitest.config.ts`, `tsconfig.json`, `eslint.config.ts`, and
     `components.json` to `frontend/`.
2. Do not move generated or ignored output such as `build/`, `dist/`,
   `node_modules/`, `.gradle/`, or `.react-router/`.
3. Run `pnpm install --frozen-lockfile` from `frontend/` after the move. The
   lockfile stays beside the package manifest; no pnpm workspace is needed
   because there is only one JavaScript package.

## Update frontend paths

1. In `frontend/vite.config.ts`, resolve configuration from the repository root
   (one directory above the config file), while retaining `frontend/` as the
   Vite project root:
   - Read `../conf/defaults.yaml`.
   - Optionally read `../conf/custom.yaml`.
   - Keep the `@` alias and Vite input relative to `frontend/`.
2. Update TypeScript include paths and aliases to remain relative to
   `frontend/`.
3. Update Vitest aliases, the shadcn `components.json` CSS path, and ESLint
   ignore paths as needed for the new project root.
4. Verify development mode still starts on the host and port configured through
   `conf/defaults.yaml`, `conf/custom.yaml`, and `RR_FRONTEND_DEV_SERVER_*`
   environment variables.

## Update Docker and Compose

1. Retain the root `Dockerfile` and full repository build context.
2. Update the JavaScript build stage:
   - Copy `frontend/package.json` and `frontend/pnpm-lock.yaml`.
   - Run dependency installation from `/tmp/regelrett/frontend`.
   - Copy `frontend/` and root `conf/defaults.yaml`.
   - Run the frontend build from `/tmp/regelrett/frontend`.
3. Update the Kotlin build stage:
   - Copy `backend/src`, Gradle build files, wrapper files, and `backend/gradle`.
   - Copy root `conf/` to `/tmp/regelrett/conf`; the backend configuration
     loader resolves it from the parent of the backend working directory.
   - Run `./gradlew shadowJar --no-daemon` from
     `/tmp/regelrett/backend`.
   - Update the sample configuration installation paths to read from
     `/tmp/regelrett/conf/`.
4. Update runtime-stage paths:
   - Copy the backend JAR from `/tmp/regelrett/backend/build/libs/`.
   - Continue copying root configuration from `/tmp/regelrett/conf`.
5. Copy the built frontend output from the frontend builder's `dist/` directory
   into `/usr/share/regelrett/dist` in the runtime image. This preserves the
   backend's existing `homePath/dist` static-file and manifest lookup.
6. Keep Compose at the root. Its build context remains `.` and its provisioning
   bind mount continues to use `./conf/provisioning/`.

## Update CI and automation

1. Update Gradle commands in:
   - `.github/workflows/build-deploy.yml`
   - `.github/workflows/backend-unit-tests.yml`
   - `.github/workflows/backend-integration-tests.yml`
   - `.github/workflows/codeql-analysis.yml`

   Each command should use `working-directory: backend` and invoke
   `./gradlew`. If a command must run from the repository root, invoke
   `./backend/gradlew -p backend`; calling `./backend/gradlew` without
   `-p backend` does not change Gradle's project directory.

2. Update the Gradle Dependabot entry in `.github/dependabot.yml` from `/` to
   `/backend`. Keep the GitHub Actions and Docker entries at `/`.
3. Add an `npm` Dependabot entry with directory `/frontend` so pnpm-managed
   frontend dependencies continue to receive updates.
4. Add a dedicated frontend workflow, limited to relevant frontend/shared
   changes, that runs from `frontend/`:
   - `pnpm install --frozen-lockfile`
   - `pnpm run lint`
   - `pnpm run typecheck`
   - `pnpm test`
   - `pnpm run build`
5. Add path filters carefully. Frontend checks must also run for changes to
   `conf/defaults.yaml`, root formatting configuration, Docker build inputs,
   and their own workflow. Backend checks must also run for `conf/**`,
   Docker-related files where appropriate, and backend files.
6. Retain the existing Docker image build as the integration-level packaging
   check for both applications.

## Update documentation and ignore rules

1. Update `README.md`:
   - Backend source and migration paths become `backend/src/...`.
   - Frontend commands are run with `pnpm --dir frontend ...` from the root,
     or after changing to `frontend/`.
   - Gradle commands are run as `./backend/gradlew -p backend ...` from the
     root, or as `./gradlew ...` after changing to `backend/`.
2. Update `CONTRIBUTING.md` local-development commands to use the new working
   directories.
3. Update `.gitignore` patterns so generated output is ignored in nested
   projects:
   - `frontend/node_modules/`
   - `frontend/dist/`
   - `frontend/.react-router/`
   - `backend/.gradle/`
   - `backend/build/`
4. Review `.dockerignore` to ensure it excludes generated output in the new
   locations without excluding required source or configuration.

## Validation

Run these commands from the repository root after the migration:

```sh
pnpm --dir frontend install --frozen-lockfile
pnpm --dir frontend run lint
pnpm --dir frontend run typecheck
pnpm --dir frontend test
pnpm --dir frontend run build
./backend/gradlew -p backend test --no-daemon
./backend/gradlew -p backend test -PintegrationTest --no-daemon
docker compose build
```

Then verify the combined application:

1. Start the database in the background with
   `docker compose up -d regelrett-db`.
2. In a separate terminal, start the frontend with
   `pnpm --dir frontend dev`.
3. In another terminal, start the backend with
   `./backend/gradlew -p backend run`.
4. Confirm Vite asset proxying works in development.
5. Stop the locally running backend to release port `8080`.
6. Start the complete Compose stack with `docker compose up --build`.
7. Confirm the backend serves the production frontend build and that the
   generated Vite manifest is found at `$RR_PATHS_HOME/dist/.vite/manifest.json`.

## Delivery approach

Implement the transition in one pull request, using `git mv` for source files
and making all path updates atomically. Do not mix application behavior changes
with the reorganization. The pull request should include the exact validation
results and explicitly confirm that the image still contains a frontend build
served by the backend.
