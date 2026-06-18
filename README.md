# Herzgarten

Herzgarten ist eine spielerische Paar-App, die eine Beziehung stärken und vertiefen soll. Gemeinsam können zwei Partner einen virtuellen Garten anlegen und diesen mit Fragen, Aufgaben und Liebesbriefen pflegen. Das Ziel ist es, spielerisch mehr über sich selbst und den Partner zu erfahren, die Kommunikation zu fördern und die Beziehung zu feiern.

Der Garten kann mit neuen Elementen gefüllt werden und neue Gartenbereiche freigespielt werden.

![](docs/screenshot.jpg)

Kurzüberblick der wichtigsten Funktionen:
- __tägliche Fragen__, die zum Nachdenken und Austausch anregen und von beiden Partnern beantwortet werden müssen, damit sie im Garten blühen
- __Aufgaben__, die gemeinsam erledigt werden können
- __Liebes-Zettel-Box__, um sich gegenseitig kleine Liebesbriefe zu hinterlassen
- __Erinnerungen__ an wichtige Termine oder gemeinsame Aktivitäten
- __Quiz__, um sich gegenseitig besser kennenzulernen


##  Entwicklung

Für Entwickler sind detaillierte [Anleitungen hier](DEV.md) zusammengefasst.

## Schnellstart

Für das Production-Deployment liegt ein Beispiel-Compose in [release/docker-compose.prod.yml](release/docker-compose.prod.yml) bereit. 

Kopiere die Datei [.env.example](release/.env.example) Datei als `.env` und ergänze die nötigen Informationen.

Starten den Docker Stack:

```bash
# im Projektstamm oder im release-Ordner
docker compose -f release/docker-compose.prod.yml up -d
```

Beispiel `.env` (Platzhalterwerte — ersetze durch echte Secrets):

```env
# App
NODE_ENV=production
PORT=3000
HERZGARTEN_TAG=0.1.0 # docker image version

# Database (Postgres)
POSTGRES_DB=herzgarten
POSTGRES_USER=herzgarten
POSTGRES_PASSWORD=changeme

# JWT-Secrets / Admin (wichtig in production)
JWT_SECRET=your-strong-jwt-secret
ADMIN_JWT_SECRET=your-strong-admin-jwt-secret
ADMIN_PASSWORD=your-admin-password

# JWT-Laufzeiten werden nicht per .env gesetzt. Sie werden im Adminbereich unter Einstellungen gepflegt und gelten fuer neu ausgestellte Tokens.

# Optional: Browser Push (Web Push / VAPID)
PUSH_ENABLED=true
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:admin@your-domain.tld
```

Für das Erstellen von Browser Push, siehe die [Entwickler Anleitungen](DEV.md).
