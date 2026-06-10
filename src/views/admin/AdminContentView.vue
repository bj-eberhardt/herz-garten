<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Eye, Plus, RotateCcw, Save, Trash2 } from '@lucide/vue';
import { adminApiRequest } from '@/services/adminApi';

type ContentType = 'daily-questions' | 'quests' | 'know-me-catalog' | 'love-jar-templates';
type ActiveFilter = 'all' | 'true' | 'false';

interface LocaleOption {
  locale: string;
  label: string;
  isDefault: boolean;
}

interface ContentItem {
  id?: string;
  text?: string;
  title?: string;
  description?: string;
  questionText?: string;
  category?: string;
  categoryLabel?: string;
  depthLevel?: number;
  longDistanceSuitable?: boolean;
  estimatedMinutes?: number;
  effortLevel?: string;
  rewardPoints?: number;
  rewardSeedType?: string;
  requiresBothPartners?: boolean;
  sortOrder?: number;
  active?: boolean;
  translations: Record<string, Record<string, string>>;
}

const contentTypes: Array<{ id: ContentType; label: string }> = [
  { id: 'daily-questions', label: 'Daily Questions' },
  { id: 'quests', label: 'Quests' },
  { id: 'know-me-catalog', label: 'Know Me' },
  { id: 'love-jar-templates', label: 'Love Jar' },
];

const selectedType = ref<ContentType>('daily-questions');
const activeFilter = ref<ActiveFilter>('all');
const locales = ref<LocaleOption[]>([]);
const items = ref<ContentItem[]>([]);
const selectedLocale = ref('de');
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const form = reactive<ContentItem>(emptyForm());

const currentTypeLabel = computed(() => contentTypes.find((type) => type.id === selectedType.value)?.label ?? '');
const preview = computed(() => {
  const translation = form.translations?.[selectedLocale.value];
  if (selectedType.value === 'quests') {
    return {
      title: translation?.title || form.title || '',
      body: translation?.description || form.description || '',
      meta: `${form.category ?? ''} · ${form.estimatedMinutes ?? 0} min · ${form.rewardPoints ?? 0} Punkte`,
    };
  }
  if (selectedType.value === 'know-me-catalog') {
    return {
      title: translation?.questionText || form.questionText || '',
      body: translation?.categoryLabel || form.category || '',
      meta: `Sortierung ${form.sortOrder ?? 0}`,
    };
  }
  return {
    title: translation?.text || form.text || '',
    body: form.category ?? '',
    meta: selectedType.value === 'daily-questions' ? `Tiefe ${form.depthLevel ?? 1}` : `Sortierung ${form.sortOrder ?? 0}`,
  };
});

function emptyForm(): ContentItem {
  return {
    active: true,
    text: '',
    title: '',
    description: '',
    questionText: '',
    category: selectedType.value === 'love-jar-templates' ? 'compliment' : '',
    depthLevel: 1,
    longDistanceSuitable: true,
    estimatedMinutes: 10,
    effortLevel: 'low',
    rewardPoints: 10,
    rewardSeedType: '',
    requiresBothPartners: true,
    sortOrder: 0,
    translations: {},
  };
}

function resetForm() {
  Object.assign(form, emptyForm());
  ensureTranslations();
}

function editItem(item: ContentItem) {
  Object.assign(form, JSON.parse(JSON.stringify(item)));
  ensureTranslations();
}

function ensureTranslations() {
  form.translations ??= {};
  for (const locale of locales.value) {
    form.translations[locale.locale] ??= {};
  }
}

async function loadLocales() {
  const payload = await adminApiRequest<{ locales: LocaleOption[] }>('/api/admin/content/locales');
  locales.value = payload.locales;
  selectedLocale.value = locales.value.find((locale) => locale.isDefault)?.locale ?? 'de';
  ensureTranslations();
}

async function loadItems() {
  loading.value = true;
  error.value = '';
  try {
    const params = activeFilter.value === 'all' ? '' : `?active=${activeFilter.value}`;
    const payload = await adminApiRequest<{ items: ContentItem[] }>(`/api/admin/content/${selectedType.value}${params}`);
    items.value = payload.items;
  } catch {
    error.value = 'Content konnte nicht geladen werden.';
  } finally {
    loading.value = false;
  }
}

async function switchType(type: ContentType) {
  selectedType.value = type;
  resetForm();
  await loadItems();
}

async function saveItem() {
  saving.value = true;
  error.value = '';
  try {
    const path = form.id ? `/api/admin/content/${selectedType.value}/${form.id}` : `/api/admin/content/${selectedType.value}`;
    const method = form.id ? 'PATCH' : 'POST';
    const payload = await adminApiRequest<{ items: ContentItem[] }>(path, {
      method,
      body: JSON.stringify(form),
    });
    items.value = payload.items;
    resetForm();
  } catch {
    error.value = 'Content-Daten sind ungueltig.';
  } finally {
    saving.value = false;
  }
}

async function setActive(item: ContentItem, active: boolean) {
  await editItem(item);
  form.active = active;
  await saveItem();
}

onMounted(async () => {
  await loadLocales();
  await loadItems();
});
</script>

<template>
  <section class="admin-view" data-testid="admin-content">
    <div class="admin-heading">
      <h1>Content</h1>
      <span>{{ currentTypeLabel }}</span>
    </div>

    <div class="admin-tabs" role="tablist">
      <button
        v-for="type in contentTypes"
        :key="type.id"
        type="button"
        :class="{ active: selectedType === type.id }"
        @click="switchType(type.id)"
      >
        {{ type.label }}
      </button>
    </div>

    <div class="admin-toolbar">
      <select v-model="activeFilter" data-testid="admin-content-active-filter" @change="loadItems">
        <option value="all">Alle</option>
        <option value="true">Aktiv</option>
        <option value="false">Inaktiv</option>
      </select>
      <button class="secondary-button" type="button" @click="resetForm">
        <Plus :size="18" aria-hidden="true" />
        Neu
      </button>
    </div>

    <p v-if="error" class="form-error">{{ error }}</p>

    <div class="admin-content-layout">
      <form class="admin-panel admin-form" data-testid="admin-content-form" @submit.prevent="saveItem">
        <div class="admin-form-head">
          <h2>{{ form.id ? 'Bearbeiten' : 'Neu' }}</h2>
          <label class="admin-checkbox">
            <input v-model="form.active" type="checkbox" />
            Aktiv
          </label>
        </div>

        <template v-if="selectedType === 'daily-questions'">
          <label>Text<input v-model="form.text" data-testid="admin-content-text" /></label>
          <label>Kategorie<input v-model="form.category" data-testid="admin-content-category" /></label>
          <label>Tiefe<input v-model.number="form.depthLevel" min="1" max="4" type="number" /></label>
          <label class="admin-checkbox"><input v-model="form.longDistanceSuitable" type="checkbox" /> Fernbeziehung</label>
        </template>

        <template v-if="selectedType === 'quests'">
          <label>Titel<input v-model="form.title" data-testid="admin-content-title" /></label>
          <label>Beschreibung<textarea v-model="form.description" rows="3" data-testid="admin-content-description" /></label>
          <label>
            Kategorie
            <select v-model="form.category">
              <option value="romance">romance</option>
              <option value="date">date</option>
              <option value="humor">humor</option>
              <option value="memory">memory</option>
              <option value="teamwork">teamwork</option>
              <option value="long_distance">long_distance</option>
            </select>
          </label>
          <label>Minuten<input v-model.number="form.estimatedMinutes" min="1" type="number" /></label>
          <label>
            Aufwand
            <select v-model="form.effortLevel">
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>
          <label>Punkte<input v-model.number="form.rewardPoints" min="0" type="number" /></label>
          <label>Seed<input v-model="form.rewardSeedType" /></label>
          <label class="admin-checkbox"><input v-model="form.requiresBothPartners" type="checkbox" /> Beide Partner</label>
        </template>

        <template v-if="selectedType === 'know-me-catalog'">
          <label>Frage<input v-model="form.questionText" data-testid="admin-content-question-text" /></label>
          <label>Kategorie<input v-model="form.category" /></label>
          <label>Sortierung<input v-model.number="form.sortOrder" type="number" /></label>
        </template>

        <template v-if="selectedType === 'love-jar-templates'">
          <label>Text<input v-model="form.text" data-testid="admin-content-love-jar-text" /></label>
          <label>
            Kategorie
            <select v-model="form.category">
              <option value="compliment">compliment</option>
              <option value="memory">memory</option>
              <option value="voucher">voucher</option>
              <option value="wish">wish</option>
              <option value="surprise">surprise</option>
            </select>
          </label>
          <label>Sortierung<input v-model.number="form.sortOrder" type="number" /></label>
        </template>

        <section class="admin-translation-box">
          <h2>Übersetzungen</h2>
          <div v-for="locale in locales" :key="locale.locale" class="admin-translation-row">
            <strong>{{ locale.locale }}</strong>
            <template v-if="selectedType === 'quests'">
              <input v-model="form.translations[locale.locale].title" :placeholder="`Titel ${locale.locale}`" />
              <textarea v-model="form.translations[locale.locale].description" rows="2" :placeholder="`Beschreibung ${locale.locale}`" />
            </template>
            <template v-else-if="selectedType === 'know-me-catalog'">
              <input v-model="form.translations[locale.locale].questionText" :placeholder="`Frage ${locale.locale}`" />
              <input v-model="form.translations[locale.locale].categoryLabel" :placeholder="`Kategorie ${locale.locale}`" />
            </template>
            <template v-else>
              <input v-model="form.translations[locale.locale].text" :placeholder="`Text ${locale.locale}`" />
            </template>
          </div>
        </section>

        <button class="primary-button" type="submit" :disabled="saving" data-testid="admin-content-save">
          <Save :size="18" aria-hidden="true" />
          {{ saving ? 'Speichere...' : 'Speichern' }}
        </button>
      </form>

      <aside class="admin-panel admin-preview" data-testid="admin-content-preview">
        <div class="admin-form-head">
          <h2>Preview</h2>
          <label>
            <Eye :size="16" aria-hidden="true" />
            <select v-model="selectedLocale">
              <option v-for="locale in locales" :key="locale.locale" :value="locale.locale">{{ locale.locale }}</option>
            </select>
          </label>
        </div>
        <article class="admin-preview-card">
          <strong>{{ preview.title || '...' }}</strong>
          <p>{{ preview.body }}</p>
          <small>{{ preview.meta }}</small>
        </article>
      </aside>
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Titel/Text</th>
            <th>Kategorie</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>{{ item.title || item.questionText || item.text }}</td>
            <td>{{ item.category }}</td>
            <td>{{ item.active ? 'aktiv' : 'inaktiv' }}</td>
            <td class="admin-actions">
              <button class="secondary-button admin-small-button" type="button" @click="editItem(item)">Bearbeiten</button>
              <button v-if="item.active" class="danger-button admin-small-button" type="button" @click="setActive(item, false)">
                <Trash2 :size="16" aria-hidden="true" />
                Deaktivieren
              </button>
              <button v-else class="secondary-button admin-small-button" type="button" @click="setActive(item, true)">
                <RotateCcw :size="16" aria-hidden="true" />
                Reaktivieren
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="loading" class="muted">Lade...</p>
  </section>
</template>
