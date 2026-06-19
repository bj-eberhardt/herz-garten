# PLAN: Translation-only Architektur mit Fallback und Config

Eine vollständige Refaktorierung, um Text-Duplikate zu eliminieren und ausschließlich Translation-Tabellen zu nutzen. Mit konfigurierbarem Fallback (default: `de`), sicherer Admin-Validierung und Performance-Optimierung.

## Überblick

Die App speichert derzeit Übersetzungstexte doppelt:
- In Basis-Tabellen: `daily_questions.text`, `quests.title`, `quests.description`, `love_jar_templates.text`, `know_me_catalog_questions.question_text`, `garden_levels.name`
- In `_translations`-Tabellen mit Locale-Spalten

**Ziel:** Nur noch `_translations`-Tabellen nutzen, mit konsistenter Fallback-Logik auf Default-Locale (`de`).

---

## Step 1: Config-Konstante für Default-Sprache

**Datei:** `backend/src/config.ts`

Füge hinzu:
```typescript
i18nDefaultLocale: process.env.I18N_DEFAULT_LOCALE ?? 'de',
```

Dies wird später in SQL-Queries, Validierung und API-Responses verwendet.

---

## Step 2: SQL-Migrations für Text-Spalten-Entfernung

**Neue Datei:** `database/migrations/000X_remove_text_columns_use_translations_only.sql`

### 2.1: Indizes auf `_translations`-Tabellen hinzufügen (für Performance)

```sql
-- Composite indices für schnellere JOINs
CREATE INDEX IF NOT EXISTS idx_daily_question_translations 
  ON daily_question_translations(question_id, locale);
  
CREATE INDEX IF NOT EXISTS idx_quest_translations 
  ON quest_translations(quest_id, locale);
  
CREATE INDEX IF NOT EXISTS idx_love_jar_template_translations 
  ON love_jar_template_translations(template_id, locale);
  
CREATE INDEX IF NOT EXISTS idx_know_me_catalog_question_translations 
  ON know_me_catalog_question_translations(catalog_question_id, locale);
  
CREATE INDEX IF NOT EXISTS idx_garden_level_translations 
  ON garden_level_translations(level_id, locale);
```

### 2.2: Migrate bestehende Daten in Translation-Tabellen (falls noch nicht geschehen)

```sql
-- Daily Questions
INSERT INTO daily_question_translations (question_id, locale, text)
SELECT id, 'de', text FROM daily_questions
ON CONFLICT (question_id, locale) DO NOTHING;

-- Quests
INSERT INTO quest_translations (quest_id, locale, title, description)
SELECT id, 'de', title, description FROM quests
ON CONFLICT (quest_id, locale) DO NOTHING;

-- Love Jar Templates
INSERT INTO love_jar_template_translations (template_id, locale, text)
SELECT id, 'de', text FROM love_jar_templates
ON CONFLICT (template_id, locale) DO NOTHING;

-- Know Me Catalog Questions
INSERT INTO know_me_catalog_question_translations (catalog_question_id, locale, question_text, category_label)
SELECT id, 'de', question_text, category FROM know_me_catalog_questions
ON CONFLICT (catalog_question_id, locale) DO NOTHING;

-- Garden Levels
INSERT INTO garden_level_translations (level_id, locale, name)
SELECT id, 'de', name FROM garden_levels
ON CONFLICT (level_id, locale) DO NOTHING;
```

### 2.3: Text-Spalten aus Basis-Tabellen entfernen

```sql
-- Daily Questions
ALTER TABLE daily_questions DROP COLUMN text;

-- Quests
ALTER TABLE quests DROP COLUMN title, DROP COLUMN description;

-- Love Jar Templates
ALTER TABLE love_jar_templates DROP COLUMN text;

-- Know Me Catalog Questions
ALTER TABLE know_me_catalog_questions DROP COLUMN question_text;

-- Garden Levels
ALTER TABLE garden_levels DROP COLUMN name;
```

### 2.4: NOT NULL Constraints auf Translation-Tabellen (damit kein leerer Text möglich ist)

```sql
ALTER TABLE daily_question_translations ALTER COLUMN text SET NOT NULL;
ALTER TABLE quest_translations ALTER COLUMN title SET NOT NULL;
ALTER TABLE quest_translations ALTER COLUMN description SET NOT NULL;
ALTER TABLE love_jar_template_translations ALTER COLUMN text SET NOT NULL;
ALTER TABLE know_me_catalog_question_translations ALTER COLUMN question_text SET NOT NULL;
ALTER TABLE garden_level_translations ALTER COLUMN name SET NOT NULL;
```

---

## Step 3: Backend SQL-Query-Pattern standardisieren

### 3.1 Repositories aktualisieren

**Betroffen:** `backend/src/admin/support.repository.ts`, `backend/src/api/support.repository.ts`, Services

**Altes Pattern:**
```sql
coalesce(requested.text, fallback.text, item.text) as text
```

**Neues Pattern:**
```sql
coalesce(requested.text, fallback.text) as text
```

Der Text existiert **nur noch** in Translation-Tabellen. Falls beide fehlen (sollte nicht vorkommen), liefert die DB NULL - Backend wirft Fehler oder gibt Fallback-Wert zurück.

### 3.2 SQL-Query-Beispiel (alte vs. neue Version)

**Alte Version (mit Text in Basis-Tabelle):**
```sql
SELECT 
  q.id,
  coalesce(requested.text, fallback.text, q.text) as question_text
FROM daily_questions q
LEFT JOIN daily_question_translations requested 
  ON requested.question_id = q.id AND requested.locale = $1
LEFT JOIN daily_question_translations fallback 
  ON fallback.question_id = q.id AND fallback.locale = 'de'
```

**Neue Version (nur Translation-Tabelle):**
```sql
SELECT 
  q.id,
  coalesce(requested.text, fallback.text) as question_text
FROM daily_questions q
LEFT JOIN daily_question_translations requested 
  ON requested.question_id = q.id AND requested.locale = $1
LEFT JOIN daily_question_translations fallback 
  ON fallback.question_id = q.id AND fallback.locale = $2 -- Parameter vom config.i18nDefaultLocale
```

Oder als SQL-Funktion (optional):
```sql
-- Helper-Funktion für konsistente Fallback-Logik
CREATE OR REPLACE FUNCTION coalesce_translation(
  requested_text TEXT,
  fallback_text TEXT,
  default_fallback TEXT DEFAULT ''
) RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(requested_text, fallback_text, default_fallback);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## Step 4: Backend-Validierung für Default-Locale

**Dateien:** `backend/src/admin/content/content.service.ts`, `backend/src/admin/preferences.repository.ts`, etc.

Vor jedem `INSERT/UPDATE` prüfen:
```typescript
function validateDefaultLocaleTranslation(translations: Record<string, TranslationObject>, defaultLocale: string) {
  if (!translations[defaultLocale]) {
    throw new Error(`Translation for default locale "${defaultLocale}" is required`);
  }
  if (!translations[defaultLocale].text?.trim()) {
    throw new Error(`Translation text for default locale "${defaultLocale}" cannot be empty`);
  }
}
```

Dies wird in allen Content-Services aufgerufen, bevor Daten in die DB geschrieben werden.

**Zusätzlich:** Backend sollte beim Laden auch prüfen, dass Default-Locale vorhanden ist. Falls nicht → Fallback-Fehler oder Logging.

---

## Step 5: Admin UI Formular-Struktur aktualisieren

### 5.1 Frontend-Komponente: `src/admin/views/AdminContentView.vue`

Die Admin-UI zeigt fortan zwei separate Bereiche:

**Oberer Bereich (Primary Language):**
```
┌─ [DE] Title (Default Language)
├─ [DE] Description
├─ [DE] Text
└─ [Badge: Diese Sprache ist erforderlich]
```

**Unterer Bereich (Additional Translations):**
```
┌─ Translations (Additional Languages)
├─ [EN] Title
├─ [EN] Description
├─ [EN] Text
└─ [FR] Title, etc.
```

### 5.2 Form-Logik

1. **Laden:** Lade bevorzugte Sprache des Users + Default-Locale aus API (`/api/config`)
2. **Rendern:** Default-Locale-Felder oben (mit Badge), Rest unten
3. **Validierung (Frontend):** Bevor Submit:
   - Check: Mindestens Default-Locale hat Text
   - Warnung: Falls Default-Locale Text fehlt
4. **Submit:** Sender alle Translations an Backend

### 5.3 Code-Beispiel (Vue-Template)

```vue
<template>
  <div class="admin-form">
    <!-- Primary Language (Default) -->
    <fieldset>
      <legend>
        {{ defaultLocale.label }} [{{ defaultLocale.locale }}]
        <span class="badge required">{{ t('admin.required') }}</span>
      </legend>
      <label>
        Title
        <input 
          v-model="form.translations[defaultLocale.locale].title" 
          required 
          :style="{ borderColor: missingDefault ? 'red' : '' }"
        />
      </label>
    </fieldset>

    <!-- Additional Translations -->
    <fieldset v-if="additionalLocales.length > 0">
      <legend>{{ t('admin.additionalTranslations') }}</legend>
      <div v-for="locale in additionalLocales" :key="locale.locale">
        <label>
          [{{ locale.label }}] Title
          <input v-model="form.translations[locale.locale].title" />
        </label>
      </div>
    </fieldset>
  </div>
</template>

<script setup>
const defaultLocale = computed(() => locales.value.find(l => l.isDefault) ?? locales.value[0]);
const additionalLocales = computed(() => locales.value.filter(l => l.locale !== defaultLocale.value.locale));

const missingDefault = computed(() => {
  const text = form.translations[defaultLocale.value.locale]?.title?.trim();
  return submitAttempted.value && !text;
});

function validateForm() {
  if (!form.translations[defaultLocale.value.locale]?.title?.trim()) {
    errors.value.title = `${defaultLocale.value.label} title is required`;
    return false;
  }
  return true;
}
</script>
```

### 5.4 Default-Locale-Felder Styling

- **readonly oder disabled:** Nein, aber mit deutlichem visuellem Unterschied (z.B. grauer Hintergrund, Label mit Badge `[ERFORDERLICH]`)
- **Position:** Immer oben im Formular
- **Hinweis-Text:** "Änderungen hier wirken sich auf alle Sprachen als Fallback aus"

---

## Step 6: API-Endpoints erweitern um `defaultLocale`-Feld

### 6.1 Neuer Endpoint: `/api/config`

**Response:**
```json
{
  "defaultLocale": "de",
  "supportedLocales": [
    { "locale": "de", "label": "Deutsch", "isDefault": true },
    { "locale": "en", "label": "English", "isDefault": false }
  ]
}
```

### 6.2 Zod-Schema

**Datei:** `backend/src/api/bodySchemas.ts`

```typescript
export const configResponseSchema = z.object({
  defaultLocale: z.string(),
  supportedLocales: z.array(z.object({
    locale: z.string(),
    label: z.string(),
    isDefault: z.boolean(),
  })),
});

export type ConfigResponse = z.infer<typeof configResponseSchema>;
```

### 6.3 Backend-Endpoint

**Datei:** `backend/src/api/routes/config.ts` (neu oder erweitern)

```typescript
export function registerConfigRoutes(router: Router) {
  router.get('/config', async (request, response) => {
    try {
      const locales = await supportedLocales(); // bestehende Funktion
      response.json({
        defaultLocale: config.i18nDefaultLocale,
        supportedLocales: locales,
      });
    } catch (error) {
      handleError(response, error);
    }
  });
}
```

### 6.4 Frontend-Integration

**Datei:** `src/stores/configStore.ts` (neu)

```typescript
import { defineStore } from 'pinia';
import { apiRequest } from '@/services/api';

export interface ConfigState {
  defaultLocale: string;
  supportedLocales: Array<{ locale: string; label: string; isDefault: boolean }>;
}

export const useConfigStore = defineStore('config', {
  state: (): ConfigState => ({
    defaultLocale: 'de',
    supportedLocales: [],
  }),

  actions: {
    async loadConfig() {
      try {
        const config = await apiRequest<ConfigState>('/api/config');
        this.defaultLocale = config.defaultLocale;
        this.supportedLocales = config.supportedLocales;
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    },
  },
});
```

---

## Step 7: Performance-Indizes und Optimierung

### 7.1 Index-Strategie

Alle `_translations`-Tabellen sollten zwei Indizes haben:

1. **Composite Index `(id, locale)`** - schnelle Lookup für Locale-Fallback
2. **Optional: Index nur auf `locale`** - falls viele Queries nach Sprache filtern

```sql
-- Composite Index (empfohlen für Performance)
CREATE INDEX idx_daily_question_translations_id_locale 
  ON daily_question_translations(question_id, locale);

-- Nur Locale (optional, falls häufig für Language-Filtering genutzt)
CREATE INDEX idx_daily_question_translations_locale 
  ON daily_question_translations(locale);
```

### 7.2 Query-Performance testen

Nutze `EXPLAIN ANALYZE` vor und nach Migration:

```sql
-- Vor Änderung
EXPLAIN ANALYZE 
SELECT q.id, coalesce(requested.text, fallback.text, q.text)
FROM daily_questions q
LEFT JOIN daily_question_translations requested ...
LEFT JOIN daily_question_translations fallback ...
WHERE q.id = $1;

-- Nach Änderung (sollte ähnlich schnell sein oder schneller)
EXPLAIN ANALYZE 
SELECT q.id, coalesce(requested.text, fallback.text)
FROM daily_questions q
LEFT JOIN daily_question_translations requested ...
LEFT JOIN daily_question_translations fallback ...
WHERE q.id = $1;
```

### 7.3 Zu erwartende Performance

- **Alte Queries (mit Text in Basis-Tabelle):** ~1-2ms (1 Table-Scan)
- **Neue Queries (nur Translations mit Indizes):** ~1-2ms (2 Index-Lookups via Composite Index)
- **Ohne Index:** ~10-20ms (2 Seqscans auf Translation-Tabellen)

→ **Fazit:** Composite Indizes sind **notwendig**, um Performance nicht zu verschlechtern.

---

## Step 8: E2E-Tests aktualisieren

### 8.1 Test-Fallback-Logik

**Datei:** `tests/e2e/api/translations.api.spec.ts` (neu)

```typescript
test('returns german translation if english not available', async ({ request }) => {
  // Setup: Create couple, fetch content in EN but only DE exists
  const payload = await apiGet(request, '/api/today?lang=en', token);
  
  // Daily Question sollte Deutsch-Text enthalten (Fallback)
  expect(payload.question.text).toBeTruthy();
  expect(payload.question.text).toContain('deutsch'); // Example DE question
});

test('returns requested locale if available', async ({ request }) => {
  // EN-Übersetzung exists
  const payloadEn = await apiGet(request, '/api/today?lang=en', token);
  expect(payloadEn.question.text).toContain('english'); // Example EN question
});
```

### 8.2 Admin-Tests

**Szenario 1:** Erzwinge Default-Locale-Validierung
```typescript
test('rejects content without default locale translation', async ({ request }) => {
  const response = await apiPost(request, '/api/admin/daily-questions', {
    text: 'Missing default locale',
    translations: {
      en: { text: 'English only' }, // DE fehlt
    },
  }, adminToken);
  
  expect(response.status).toBe(400);
  expect(response.body.errorCode).toContain('default_locale');
});
```

---

## Step 9: Rollout-Strategie

### 9.1 Schrittweise nach Content-Type

**Phase 1:** `daily_questions` + Tests + Code-Review
**Phase 2:** `quests` + Tests + Code-Review
**Phase 3:** `love_jar_templates` + Tests + Code-Review
**Phase 4:** `know_me_catalog_questions` + Tests + Code-Review
**Phase 5:** `garden_levels` + Tests + Code-Review

Nach jeder Phase: Commit + Code-Review + E2E-Tests im Staging.

### 9.2 Fallback-Plan

Falls Probleme nach Live-Schaltung:

1. **Fehlende Translation in Locale:** Fallback auf Default (`de`) greift ein → Users sehen deutschen Text
2. **NULL-Fehler:** Sollte **nicht** vorkommen (wegen Validierung), aber falls doch: Leerer String als Fallback
3. **Performance-Issue:** Indizes prüfen oder JOIN-Logik neu evaluieren

---

## Step 10: Dokumentation & Code-Review

### 10.1 Dokumentation aktualisieren

- `DEV.md`: Migration-Steps + Indizes
- Code-Kommentare in Repositories (warum kein Fallback auf `item.text` mehr)
- Migrations-File kommentieren

### 10.2 Architektur-Richtlinie für neue Content-Typen

Für zukünftige Content-Tabellen (z.B. neue Features):

**DO:**
```typescript
-- Neue Tabelle mit TEXT-Spalten nur in _translations
CREATE TABLE my_new_content (
  id UUID PRIMARY KEY,
  category TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE my_new_content_translations (
  content_id UUID NOT NULL REFERENCES my_new_content(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES supported_locales(locale),
  text TEXT NOT NULL,
  PRIMARY KEY (content_id, locale)
);
```

**DON'T:**
```typescript
-- Alte Struktur: Text in Basis-Tabelle + _translations
CREATE TABLE my_new_content (
  id UUID PRIMARY KEY,
  text TEXT NOT NULL, -- ❌ Nicht mehr machen!
  ...
);
```

---

## Checkliste zur Umsetzung

- [ ] Step 1: Config-Konstante hinzufügen
- [ ] Step 2: Migration mit Indizes schreiben + testen
- [ ] Step 3: Repositories aktualisieren (testen mit `EXPLAIN ANALYZE`)
- [ ] Step 4: Validierung im Backend implementieren
- [ ] Step 5: Admin UI überarbeiten (Mock-Test ohne BE)
- [ ] Step 6: `/api/config` Endpoint + Zod-Schemas
- [ ] Step 7: Indizes validieren, Performance-Baseline messen
- [ ] Step 8: E2E-Tests schreiben
- [ ] Step 9: Code-Review + Staging-Deploy
- [ ] Step 10: Dokumentation abschließen

---

## Offene Fragen & Entscheidungen

1. **SQL-Helper-Funktion nutzen?** Ja → Schreibe `coalesce_translation()`, Nein → Nutze COALESCE direkt in Queries
   - **Empfehlung:** COALESCE direkt in Queries (einfacher, keine zusätzliche DB-Function)

2. **Admin UI: Readonly für Default-Locale?** Ja → Field disabled, Nein → Normal editable mit Badge
   - **Empfehlung:** Normal editable, aber mit deutlichem Badge/Styling

3. **Fallback-Reihenfolge bei mehreren Default-Locales?** 
   - **Antwort:** Nur eine Default-Locale in `supported_locales.is_default = true`

4. **E2E-Test-Coverage:** Alle 5 Content-Typen oder nur Samples?
   - **Empfehlung:** Samples (daily_questions + quests), da Logik identisch

---

## Zeitschätzung

- Config & Migrations: **1-2 Stunden**
- Repositories refaktorieren: **3-4 Stunden**
- Validierung + Backend: **2-3 Stunden**
- Admin UI: **3-4 Stunden**
- API `/config`: **1 Stunde**
- Tests + Performance-Check: **2-3 Stunden**
- Code-Review + Fixes: **1-2 Stunden**

**Gesamt:** ~15-20 Stunden für vollständige Umsetzung (mit Tests & Docs).
