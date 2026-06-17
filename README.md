# Herzgarten

Herzgarten ist ein Vue-3-MVP fuer eine warme, spielerische Paar-App. Der aktuelle Stand enthaelt ein Frontend-Skeleton, ein kleines Express-Backend und PostgreSQL fuer lokale Entwicklung.

## Dev-Start mit Docker

Voraussetzung: Docker Desktop muss laufen.

```bash
docker compose up --build
```

Danach sind die Services erreichbar:

- Frontend: `http://localhost:5173`
- Backend Healthcheck: `http://localhost:3000/health`
- PostgreSQL: `localhost:5432`

Lokale Datenbankdaten:

- Datenbank: `herzgarten`
- User: `herzgarten`
- Passwort: `herzgarten`

Frontend und Backend laufen im Watch-Modus. Aenderungen in `src/` und `backend/src/` werden live neu geladen. Unter Windows ist Polling aktiviert, damit Dateiaenderungen in Docker zuverlaessig erkannt werden.

## Stoppen

```bash
docker compose down
```

Nur Container stoppen, Datenbankdaten behalten:

```bash
docker compose stop
```

Datenbank komplett zuruecksetzen:

```bash
docker compose down -v
docker compose up --build
```

## Datenbank-Migrationen

Die PostgreSQL-Skripte liegen versioniert unter:

```text
database/migrations/
```

Beim Backend-Start wird automatisch ausgefuehrt:

```bash
npm run db:migrate
```

Docker ruft das im Backend-Container vor dem Dev-Server auf. Neue SQL-Dateien werden alphabetisch angewendet, zum Beispiel:

```text
database/migrations/0003_add_notifications.sql
```

Bereits angewendete Migrationen werden in der Tabelle `schema_migrations` gespeichert. Wenn eine bereits angewendete Datei nachtraeglich veraendert wird, bricht der Runner wegen geaendertem Checksum ab. Bestehende Migrationen daher nicht umschreiben, sondern eine neue Datei anlegen.

Migration manuell im Backend-Container ausfuehren:

```bash
docker compose exec backend npm run db:migrate
```

## E2E-Tests mit Playwright

Einmalig installieren:

```bash
npm install
npx playwright install
```

Headless ausfuehren:

```bash
npm run test:e2e
```

Mit sichtbarem Browser:

```bash
npm run test:e2e:headed
```

Playwright UI-Modus:

```bash
npm run test:e2e:ui
```

Letzten HTML-Report anzeigen:

```bash
npm run test:e2e:report
```

Die Tests starten ein eigenes Docker-Setup ueber Playwright: Projekt `herzgarten-e2e`, Frontend `http://localhost:5174`, Backend `http://localhost:3001`, PostgreSQL `localhost:5433`. Vor jedem Lauf wird dieses E2E-Projekt mit `down -v` geleert, damit Tests nicht von Daten aus der lokalen Dev-Datenbank abhaengen. Der normale Dev-Stack auf `5173/3000/5432` bleibt davon getrennt.

## Lokale Entwicklung ohne Docker

Frontend:

```bash
npm install
npm run dev
```

Backend:

```bash
cd backend
npm install
npm run dev
```

Dafuer muss PostgreSQL lokal laufen und `DATABASE_URL` auf die Datenbank zeigen.

## Browser-Push lokal testen

Browser-Push ist kostenlos und nutzt standardsbasierten Web Push mit VAPID. Ohne VAPID-Keys meldet die API `enabled: false` und die App zeigt Push als nicht konfiguriert an.

VAPID-Keys einmalig im Backend erzeugen:

```bash
cd backend
npx web-push generate-vapid-keys
```

Dann die Werte als Umgebungsvariablen setzen, zum Beispiel in einer lokalen `.env` oder vor `docker compose up`:

```bash
PUSH_ENABLED=true
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@herzgarten.local
```

Auf `localhost` funktionieren Service Worker und Notifications in modernen Desktop-Browsern. Fuer Tests auf echten Mobilgeraeten braucht die App eine HTTPS-URL, zum Beispiel ueber ngrok, Cloudflare Tunnel oder mkcert. Auf iOS/iPadOS funktioniert Web Push ab 16.4 fuer Web-Apps, die zum Home-Bildschirm hinzugefuegt wurden.

## Production-Image bauen und pushen

Das Production-Image baut Frontend und Backend in getrennten Stages und liefert die Vue-App ueber das Express-Backend auf Port `3000` aus. Beim Container-Start werden zuerst die SQL-Migrationen ausgefuehrt.

Windows PowerShell:

```powershell
$tag = "0.1.0"
docker build -f Dockerfile.prod -t "beberhardt/herzgarten:$tag" .
docker push "beberhardt/herzgarten:$tag"
```

Linux/macOS Shell:

```bash
tag=0.1.0
docker build -f Dockerfile.prod -t "beberhardt/herzgarten:$tag" .
docker push "beberhardt/herzgarten:$tag"
```

Multi-Arch-Image fuer Linux-Hosts und Windows mit Docker Desktop im Linux-Container-Modus bauen und direkt pushen:

Windows PowerShell:

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

Linux/macOS Shell:

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

Falls der Builder bereits existiert, reicht stattdessen:

```bash
docker buildx use herzgarten-builder
```

Hinweis: Das Image ist ein Linux-Container, weil `Dockerfile.prod` auf `node:24-alpine` basiert. Es laeuft auf Windows ueber Docker Desktop/WSL2 im Linux-Container-Modus. Fuer native Windows-Container waere ein separates Windows-Dockerfile mit einem Windows-Node-Base-Image noetig.

Ein Beispiel-Deployment mit dem gepushten Image und PostgreSQL-Sidecar liegt unter [`release/docker-compose.prod.yml`](release/docker-compose.prod.yml). Die Platzhalter stehen in [`release/.env.example`](release/.env.example); lokal kann dieselbe Struktur als `release/.env` genutzt werden.
Das Compose-Setup persistiert Datenbankdaten im Volume `postgres_data` und Admin-Uploads im Volume `app_uploads`; im Container werden Uploads unter `/app/uploads` abgelegt und unter `/uploads/...` ausgeliefert.

Starten:

```bash
cd release
docker compose -f docker-compose.prod.yml up -d
```

Logs ansehen:

```bash
docker compose -f docker-compose.prod.yml logs -f app
```

Vor dem Push einmal bei Docker Hub anmelden:

```bash
docker login
```

Lokaler Testlauf mit einer erreichbaren PostgreSQL-Datenbank:

```bash
docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  -e UPLOAD_DIR=/app/uploads \
  -e DATABASE_URL=postgresql://herzgarten:herzgarten@host.docker.internal:5432/herzgarten \
  -e JWT_SECRET=replace-with-a-long-random-secret \
  -e ADMIN_JWT_SECRET=replace-with-another-long-random-secret \
  -e ADMIN_PASSWORD=replace-with-a-strong-password \
  -v herzgarten_uploads:/app/uploads \
  beberhardt/herzgarten:0.1.0
```

Unter Linux funktioniert `host.docker.internal` je nach Docker-Version nicht automatisch. Dann entweder den Container in ein Docker-Compose-Netz mit PostgreSQL haengen oder beim Testlauf `--add-host=host.docker.internal:host-gateway` ergaenzen.

## Stack

- Vue 3 + Vite + TypeScript
- Pinia
- Vue Router
- Express + TypeScript
- PostgreSQL
- eigener SQL-Migration-Runner im Backend

## Projektstruktur

- `src/views`: Hauptseiten aus dem MVP-Scope
- `src/components`: Feature-Komponenten fuer Garten, Fragen, Aufgaben, Love Jar und Erinnerungen
- `src/stores`: Lokale Demo-Logik als Vorstufe zur Backend-Anbindung
- `src/content`: Start-Content fuer Fragen, Aufgaben und Love-Jar-Vorlagen
- `backend`: Express-API-Skeleton mit PostgreSQL-Verbindung
- `backend/src/migrate.ts`: Migration-Runner fuer versionierte SQL-Dateien
- `database/migrations`: PostgreSQL-Migrationen fuer die Docker-DB
- `supabase/migrations`: Supabase-spezifischer Entwurf mit RLS-Regeln
