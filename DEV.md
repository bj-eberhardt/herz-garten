# Development

Diese Datei enthält alle technischen Anweisungen für Entwickler: lokale Entwicklung mit Docker, E2E-Tests, Browser-Push (VAPID) und wie man Production-Images baut und pusht.


## Voraussetzungen

- Docker (Engine & Compose)
- Node.js + npm (siehe [.nvmrc](.nvmrc) für die benötigte Version)

---

## Quickstart: Dev-Stack mit Docker


### Starten

```bash
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

Uploads aus dem Adminbereich werden im Docker-Volume `backend_uploads` gespeichert.

### Stoppen

```bash
docker compose down
```

### Datenbank komplett zurücksetzen

Dies ist nötig, wenn an bestehenden SQL Migrationsskripten Änderungen vorgenommen wurden oder die Datenbank in einen sauberen Zustand zurückgesetzt werden soll. Alle Daten gehen dabei verloren.

```bash
docker compose down -v
docker compose up --build
```

---


## Linting

ESLint prüft das Frontend und läuft automatisch als Pre-Commit-Hook.

Manuell prüfen:

```bash
npm run lint
```

Automatisch fixbare Probleme korrigieren:

```bash
npm run lint:fix
```

---

## E2E-Tests mit Playwright

Die Playwright-Tests sind im Repo konfiguriert und nutzen ein eigenes Docker-Setup, damit sie vom lokalen Dev-Stack isoliert laufen.

### Einmalig installieren:

```bash
npm install
npx playwright install
```

### Headless ausführen:

```bash
npm run test:e2e
```

### Headed / UI-Modus (Test Runner UI):

```bash
npm run test:e2e:headed
# oder
npm run test:e2e:ui
```

### HTML-Report anzeigen:

```bash
npm run test:e2e:report
```


Die Tests starten ein eigenes Docker-Setup (Playwright):

- Projekt: `herzgarten-e2e`
- Frontend: http://localhost:5174
- Backend: http://localhost:3001
- PostgreSQL: localhost:5433
- Mailpit: http://localhost:8025

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

---

## Production-Image bauen & pushen

Das Production-Image baut Frontend und Backend in getrennten Stages und liefert die gebaute Vue-App über das Express-Backend auf Port `3000` aus. Beim Container-Start werden zuerst die SQL-Migrationen ausgeführt.

### Windows PowerShell:

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

### Linux/macOS (bash):

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
