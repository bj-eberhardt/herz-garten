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

Die Tests starten das Docker-Setup automatisch ueber `docker compose up --build` oder nutzen bereits laufende Container weiter. Testdaten werden mit eindeutigen E-Mail-Adressen erzeugt; die Datenbank muss fuer normale Testlaeufe nicht geloescht werden.

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

## Stack

- Vue 3 + Vite + TypeScript
- Pinia
- Vue Router
- Express + TypeScript
- PostgreSQL
- eigener SQL-Migration-Runner im Backend

## Projektstruktur

- `src/views`: Hauptseiten aus dem MVP-Scope
- `src/components`: Feature-Komponenten fuer Garten, Fragen, Quests, Love Jar und Erinnerungen
- `src/stores`: Lokale Demo-Logik als Vorstufe zur Backend-Anbindung
- `src/content`: Start-Content fuer Fragen, Quests und Love-Jar-Vorlagen
- `backend`: Express-API-Skeleton mit PostgreSQL-Verbindung
- `backend/src/migrate.ts`: Migration-Runner fuer versionierte SQL-Dateien
- `database/migrations`: PostgreSQL-Migrationen fuer die Docker-DB
- `supabase/migrations`: Supabase-spezifischer Entwurf mit RLS-Regeln
