Nächste Schritte nach Priorität:

Aktuelle Know-Me-Erweiterung abschließen
Die neue Katalogfunktion ist schon implementiert und getestet. Als nächstes sollte sie sauber reviewed und committed werden.

MVP härten statt neue Features stapeln
Der Kernloop funktioniert. Jetzt fehlen eher Robustheitsthemen: leere Zustände, Fehlerzustände, doppelte Aktionen, bessere Validierung, Ladezustände, mobile Layout-Prüfung.

Datenschutz-Funktionen vervollständigen
Export ist getestet, Paarraum verlassen auch. Noch sinnvoll: Kontolöschung im UI testen, Datenisolation stärker absichern, ggf. Datenschutzseite/klare Sichtbarkeitstexte.

Content ausbauen
Der Plan nennt 100 Tagesfragen, 50 Quests, 30 Date-Ideen, 30 Love-Jar-Vorlagen, 20 Mini-Spiel-Fragen. Der Know-Me-Katalog hat jetzt 36 Fragen. Der nächste Content-Schritt wäre Tagesfragen/Quests/Love-Jar strukturiert auf MVP-Menge bringen.

Architekturentscheidung klären
Der Plan empfiehlt Supabase-first, der aktuelle Stand nutzt Express + PostgreSQL mit eigenen Migrationen. Das ist konsistent nutzbar, aber Supabase-Artefakte liegen zusätzlich im Repo. Entscheiden: bei Express/Postgres bleiben oder gezielt auf Supabase migrieren.

Produktionsreife vorbereiten
Deployment-Setup, echte Umgebungsvariablen, DB-Backup-Konzept, sichere JWT-Konfiguration, CORS/Rate-Limits, Passwort-Reset und Monitoring.

Kurz gesagt: Der MVP ist nicht mehr nur ein Prototyp-Skeleton, sondern ein funktionierender, getesteter Kern. Der sinnvollste nächste Schritt ist jetzt Stabilisierung + Abschluss der aktuellen Know-Me-Katalogänderung, danach Datenschutz/Content/Deployment.