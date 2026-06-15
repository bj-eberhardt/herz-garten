# Herzgarten E2E-Testplan

## Ziel

Die Playwright-Suite prueft den MVP-Kernloop mit zwei Partnern: Registrierung, Paarraum, Tagesfrage, Aufgaben, Love Jar, Erinnerungen, Gartenobjekte, Benachrichtigungen und Basis-Datenschutz.

## Ausfuehrung

- Headless: `npm run test:e2e`
- Sichtbarer Browser: `npm run test:e2e:headed`
- Playwright UI: `npm run test:e2e:ui`
- Report: `npm run test:e2e:report`

Die Tests laufen gegen ein eigenes E2E-Docker-Projekt:

- Frontend: `http://localhost:5174`
- Backend: `http://localhost:3001`
- PostgreSQL: `localhost:5433`

Playwright startet `docker compose -f docker-compose.yml -f docker-compose.e2e.yml -p herzgarten-e2e`. Vor jedem Lauf wird dieses Projekt inklusive Volumes geloescht, damit die E2E-Datenbank sauber startet und der lokale Dev-Stack auf `5173/3000/5432` parallel weiterlaufen kann.

## Testdaten

- Jeder Test erzeugt eindeutige Nutzer per Zeitstempel und Zufallssuffix.
- Die E2E-Datenbank wird pro Lauf neu erstellt.
- Laengere Flows nutzen API-Setup fuer Nutzer/Paarraum und testen danach die UI.
- Onboarding wird bewusst komplett ueber die UI getestet.

## Szenarien

### Onboarding und Paarraum

- Nutzer A registriert sich und erstellt einen Paarraum.
- Nutzer B registriert sich separat und tritt spaeter per Partnercode bei.
- Nutzer ohne Paarraum wird beim Aufruf geschuetzter Seiten ins Onboarding geleitet.
- Falscher Partnercode zeigt einen Fehlerzustand.

### Tagesfrage

- Partner A beantwortet die Tagesfrage.
- A sieht den Wartestatus.
- Partner B bekommt eine Notification.
- Partner B beantwortet die Tagesfrage.
- Beide sehen die freigeschalteten Antworten.
- Im Garten entsteht ein Objekt mit Detailinhalt zur Tagesfrage.

### Aufgaben

- Offene Aufgaben werden in einem eigenen Bereich angezeigt.
- Aufgaben-Filter nach Kategorie, Aufwand, Dauer und Modus grenzen Vorschlaege sichtbar ein.
- Angenommene Aufgaben wechseln in den aktiven Bereich.
- Bei Partneraufgaben wartet die Aufgabe auf die zweite Bestaetigung.
- Nach Bestaetigung beider Partner landet die Aufgabe im abgeschlossenen Bereich.
- Im Garten entsteht ein Aufgaben-Objekt.

### Love Jar

- Ein neuer Paarraum zeigt einen leeren Love-Jar-Zustand.
- Partner A legt einen kategorisierten Zettel ins Glas.
- Partner B bekommt eine Notification.
- Partner B zieht den Zettel und sieht den Text.
- Ein zweiter Ziehversuch am selben Tag ist gesperrt.

### Wie gut kennst du mich?

- Partner A sucht im Fragenkatalog per Autocomplete und waehlt einen Vorschlag aus.
- Bereits von Partner A verwendete Katalogfragen verschwinden fuer Partner A aus der Vorschlagsliste.
- Dieselbe Katalogfrage bleibt fuer Partner B weiterhin vorschlagbar.
- Partner A erstellt eine eigene Multiple-Choice-Frage mit richtiger Antwort.
- Partner B bekommt eine Notification und landet im Spiel.
- Richtige Antwort erzeugt Verlaufseintrag und Gartenbelohnung.
- Falsche Antwort wird liebevoll aufgeloest, erzeugt aber kein Gartenobjekt.
- Gartenobjekt-Detail zeigt Frage, richtige Antwort und geratene Antwort.

### Erinnerungen und Garten

- Partner A erstellt eine Erinnerung mit Titel, Beschreibung, Datum und Kategorie.
- Die Erinnerung erscheint in der Timeline.
- Partner B bekommt eine Notification.
- Im Garten entsteht ein Erinnerungsstein.
- Klick auf das Gartenobjekt oeffnet die Detailansicht.

### Notifications

- Ungelesene Notifications erzeugen einen Header-Badge.
- Klick auf eine Notification markiert sie als gelesen und navigiert zur passenden Seite.
- `Alle gelesen` setzt den Badge zurueck.
- Fremde Notifications sind in der UI nicht sichtbar.

### Settings und Datenschutz

- Datenexport ist ausloesbar.
- Logout fuehrt zurueck in den Login-/Onboarding-Flow.
- Paarraum verlassen akzeptiert den Confirm-Dialog und fuehrt zum Paarraum-Onboarding.

## Nicht enthalten

- Keine Screenshot- oder Pixeltests.
- Keine echten Push-Notifications.
- Keine Foto-Uploads.
- Keine Tests gegen Firefox/WebKit im MVP-Default.
