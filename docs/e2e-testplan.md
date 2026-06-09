# Herzgarten E2E-Testplan

## Ziel

Die Playwright-Suite prueft den MVP-Kernloop mit zwei Partnern: Registrierung, Paarraum, Tagesfrage, Quests, Love Jar, Erinnerungen, Gartenobjekte, Benachrichtigungen und Basis-Datenschutz.

## Ausfuehrung

- Headless: `npm run test:e2e`
- Sichtbarer Browser: `npm run test:e2e:headed`
- Playwright UI: `npm run test:e2e:ui`
- Report: `npm run test:e2e:report`

Die Tests laufen gegen `http://localhost:5173` und `http://localhost:3000`. Docker wird durch Playwright gestartet oder ein laufendes Setup wird wiederverwendet.

## Testdaten

- Jeder Test erzeugt eindeutige Nutzer per Zeitstempel und Zufallssuffix.
- Die Datenbank wird nicht zurueckgesetzt.
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

### Quests

- Offene Quests werden in einem eigenen Bereich angezeigt.
- Quest-Filter nach Kategorie, Aufwand, Dauer und Modus grenzen Vorschlaege sichtbar ein.
- Angenommene Quests wechseln in den aktiven Bereich.
- Bei Partnerquests wartet die Quest auf die zweite Bestaetigung.
- Nach Bestaetigung beider Partner landet die Quest im abgeschlossenen Bereich.
- Im Garten entsteht ein Quest-Objekt.

### Love Jar

- Ein neuer Paarraum zeigt einen leeren Love-Jar-Zustand.
- Partner A legt einen kategorisierten Zettel ins Glas.
- Partner B bekommt eine Notification.
- Partner B zieht den Zettel und sieht den Text.
- Ein zweiter Ziehversuch am selben Tag ist gesperrt.

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
