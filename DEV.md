# Development (DEV.md)

Diese Datei enthält alle technischen Anweisungen für Entwickler: lokale Entwicklung mit Docker, E2E-Tests, Browser-Push (VAPID) und wie man Production-Images baut und pusht.

Hinweis: Die Projekt-Intro und Funktionsübersicht findest du in `README.md`.

## Voraussetzungen

- Docker (Engine & Compose)
- Node.js + npm (nur für Playwright-Tasks und lokale npm-Skripte)

Optional:
- PowerShell (Windows) oder bash (Linux/macOS)

---

## Quickstart: Dev-Stack mit Docker

Voraussetzung: Docker ist installiert.

### Starten

```bash
# Im Projektstamm
docker compose up --build
```

Nach dem Start sind die Services erreichbar:

- Frontend: http://localhost:5173
- Backend Healthcheck: http://localhost:3000/health
- PostgreSQL: localhost:5432

Lokale Standarddatenbank-Zugangsdaten (Dev):

- Datenbank: `herzgarten`
- User: `herzgarten`
- Passwort: `herzgarten`

Frontend und Backend laufen im Watch-Modus.

Uploads aus dem Adminbereich werden im Docker-Volume `backend_uploads` gespeichert. Sie liegen bewusst nicht im `public/uploads`-Ordner, damit Git-Operationen oder lokale Cleanups keine hochgeladenen Gartenbilder entfernen.

### Stoppen

```bash
docker compose down
```

### Datenbank komplett zurücksetzen

```bash
docker compose down -v
docker compose up --build
```

Hinweis: `docker compose down -v` loescht neben der Datenbank auch das Upload-Volume. Nutze fuer normales Stoppen ohne Datenverlust nur `docker compose down`.

---

## Content-i18n Architektur

User-facing Seed-Content speichert Texte nur noch in den jeweiligen `_translations`-Tabellen. Die Basistabellen enthalten nur Struktur- und Steuerfelder:

- `daily_questions` -> `daily_question_translations.text`
- `quests` -> `quest_translations.title`, `quest_translations.description`
- `love_jar_templates` -> `love_jar_template_translations.text`
- `know_me_catalog_questions` -> `know_me_catalog_question_translations.question_text`
- `garden_levels` -> `garden_level_translations.name`
- `relationship_modes` -> `relationship_mode_translations.label`
- `content_styles` -> `content_style_translations.label`
- `content_categories` -> `content_category_translations.label`
- `message_templates` -> `message_template_translations.text`, `message_template_translations.description`

Die Default-Sprache kommt aus `I18N_DEFAULT_LOCALE` und faellt ohne Env-Var auf `de` zurueck. Admin-Schreibpfade muessen immer eine Translation fuer diese Default-Locale mitsenden. Public Queries nutzen `coalesce(requested, default)` und fallen nicht mehr auf Textspalten der Basistabellen zurueck.

Die aktive SQL-Basis ist konsolidiert: `database/migrations/0001_base_schema.sql` erzeugt die finale Struktur, `database/migrations/0002_final_data_import.sql` importiert den finalen Seed-/Stammdatenstand inklusive Translation-Tabellen und Message-Template-Defaults.

---

## Linting

ESLint prueft das Frontend und laeuft automatisch als Pre-Commit-Hook.

Manuell pruefen:

```bash
npm run lint
```

Automatisch fixbare Probleme korrigieren:

```bash
npm run lint:fix
```

Direkt mit ESLint geht dasselbe ueber:

```bash
npx eslint . --fix
```

---

## E2E-Tests mit Playwright

Die Playwright-Tests sind im Repo konfiguriert und nutzen ein eigenes Docker-Setup, damit sie vom lokalen Dev-Stack isoliert laufen.

Einmalig installieren (falls noch nicht geschehen):

```bash
npm install
npx playwright install
```

Headless ausführen:

```bash
npm run test:e2e
```

Headed / UI-Modus (Test Runner UI):

```bash
npm run test:e2e:headed
# oder
npm run test:e2e:ui
```

HTML-Report anzeigen:

```bash
npm run test:e2e:report
```

Die Tests starten ein eigenes Docker-Setup (Playwright):

- Projekt: `herzgarten-e2e`
- Frontend: http://localhost:5174
- Backend: http://localhost:3001
- PostgreSQL: localhost:5433

Vor jedem Lauf wird dieses E2E-Projekt mit `down -v` geleert, damit Tests nicht von Daten aus der lokalen Dev-Datenbank abhängen. Der normale Dev-Stack auf `5173/3000/5432` bleibt davon getrennt.

### E2E-Stack für Debugging stehen lassen

Standardmäßig fährt Playwright den E2E-Docker-Stack nach dem Testlauf wieder herunter und löscht die Volumes. Für Debugging kannst du das Abschalten per Env-Variable verhindern:

```bash
E2E_KEEP_DOCKER=1 npm run test:e2e
```

Windows PowerShell:

```powershell
$env:E2E_KEEP_DOCKER = "1"
npm run test:e2e
```

Danach bleiben Frontend, Backend, PostgreSQL und Mailpit erreichbar:

- Frontend: http://localhost:5174
- Backend: http://localhost:3001
- Mailpit: http://localhost:8025
- PostgreSQL: localhost:5433

Wenn du gegen den bereits laufenden E2E-Stack erneut testen willst, ohne dass Playwright Docker neu startet oder vorher `down -v` ausführt, nutze:

```bash
E2E_SKIP_DOCKER=1 npm run test:e2e
```

Windows PowerShell:

```powershell
$env:E2E_SKIP_DOCKER = "1"
npm run test:e2e
```

Manuelles Aufräumen:

```bash
docker compose -f docker-compose.yml -f docker-compose.e2e.yml -p herzgarten-e2e down -v --remove-orphans
```

---

## Browser-Push (Web Push / VAPID)

Browser-Push verwendet Web Push mit VAPID-Keys. Ohne gesetzte Keys meldet die API `enabled: false` und Push wird als nicht konfiguriert angezeigt.

VAPID-Keys einmalig im Backend erzeugen:

```bash
cd backend
npx web-push generate-vapid-keys
```

Die generierten Werte müssen als Umgebungsvariablen gesetzt werden (z.B. in einer lokalen `.env` oder vor `docker compose up`):

```bash
PUSH_ENABLED=true
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@herzgarten.local
```

Wichtig: Committe niemals echte Schlüssel in das Repo. Nutze stattdessen `.env.example` mit Platzhaltern.

---

## Production-Image bauen & pushen

Das Production-Image baut Frontend und Backend in getrennten Stages und liefert die gebaute Vue-App über das Express-Backend auf Port `3000` aus. Beim Container-Start werden zuerst die SQL-Migrationen ausgeführt.

Windows PowerShell (Beispiel):

```powershell
$tag = "0.1.0"
docker buildx rm herzgarten-builder
docker buildx create --use --name herzgarten-builder
docker buildx build `
  --platform linux/amd64,linux/arm64 `
  -f Dockerfile.prod `
  -t "beberhardt/herzgarten:$tag" `
  --push .
```

Linux/macOS (bash):

```bash
tag=0.1.0
docker buildx rm herzgarten-builder
docker buildx create --use --name herzgarten-builder
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f Dockerfile.prod \
  -t "beberhardt/herzgarten:$tag" \
  --push .
```
