<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { Plus, RotateCcw, Save, Trash2 } from '@lucide/vue';
import { adminApiRequest } from '@/admin/services/adminApi';

type ContentType = 'daily-questions' | 'quests' | 'know-me-catalog' | 'love-jar-templates';
type ActiveFilter = 'all' | 'true' | 'false';

interface LocaleOption {
  locale: string;
  label: string;
  isDefault: boolean;
}

interface CategoryItem {
  id: string;
  contentType: ContentType;
  value: string;
  label: string;
  active: boolean;
}

interface ContentItem {
  id?: string;
  text?: string;
  title?: string;
  description?: string;
  questionText?: string;
  category?: string;
  depthLevel?: number;
  longDistanceSuitable?: boolean;
  estimatedMinutes?: number;
  effortLevel?: string;
  rewardPoints?: number;
  rewardSeedType?: string;
  requiresBothPartners?: boolean;
  sortOrder?: number;
  active: boolean;
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
const search = ref('');
const categoryFilter = ref('');
const locales = ref<LocaleOption[]>([]);
const categories = ref<CategoryItem[]>([]);
const items = ref<ContentItem[]>([]);
const loading = ref(false);
const saving = ref(false);
const showForm = ref(false);
const formAnchor = ref<HTMLElement | null>(null);
const errors = ref<Record<string, string>>({});
const form = reactive<ContentItem>(emptyForm('daily-questions'));

const currentTypeLabel = computed(() => contentTypes.find((type) => type.id === selectedType.value)?.label ?? '');
const currentCategories = computed(() => categories.value.filter((category) => category.contentType === selectedType.value && category.active));
const defaultLocale = computed(() => locales.value.find((locale) => locale.isDefault) ?? locales.value[0] ?? null);
const defaultLanguageHint = computed(() =>
  defaultLocale.value
    ? `Default-Sprache / Fallback: ${defaultLocale.value.label} (${defaultLocale.value.locale}). Die Basisfelder speichern den Fallback; ein Eintrag in den Übersetzungen kann diesen Text für dieselbe Sprache explizit überschreiben.`
    : 'Default-Sprache / Fallback. Die Basisfelder speichern den Fallback; Übersetzungen können ihn pro Sprache überschreiben.',
);

function emptyForm(type: ContentType): ContentItem {
  return {
    active: true,
    text: '',
    title: '',
    description: '',
    questionText: '',
    category: '',
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

function ensureTranslations() {
  form.translations ??= {};
  for (const locale of locales.value) {
    form.translations[locale.locale] ??= {};
  }
}

function resetForm(open = false) {
  Object.assign(form, emptyForm(selectedType.value));
  form.category = currentCategories.value[0]?.value ?? '';
  ensureTranslations();
  errors.value = {};
  showForm.value = open;
}

async function openFormForNew() {
  resetForm(true);
  await scrollToForm();
}

async function editItem(item: ContentItem) {
  Object.assign(form, JSON.parse(JSON.stringify(item)));
  ensureTranslations();
  showForm.value = true;
  errors.value = {};
  await scrollToForm();
}

async function scrollToForm() {
  await nextTick();
  formAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function validateForm() {
  const nextErrors: Record<string, string> = {};
  if (!form.category) nextErrors.category = 'Bitte wähle eine Kategorie aus den gepflegten Kategorien.';

  if (selectedType.value === 'daily-questions') {
    if (!form.text?.trim()) nextErrors.text = 'Bitte gib den Fragetext ein.';
    if (!form.depthLevel || form.depthLevel < 1 || form.depthLevel > 4) nextErrors.depthLevel = 'Tiefe muss zwischen 1 und 4 liegen.';
  }
  if (selectedType.value === 'quests') {
    if (!form.title?.trim()) nextErrors.title = 'Bitte gib einen Titel ein.';
    if (!form.description?.trim()) nextErrors.description = 'Bitte gib eine Beschreibung ein.';
    if (!form.estimatedMinutes || form.estimatedMinutes < 1) nextErrors.estimatedMinutes = 'Minuten müssen größer als 0 sein.';
    if (!form.rewardPoints || form.rewardPoints < 0) nextErrors.rewardPoints = 'Punkte duerfen nicht negativ sein.';
  }
  if (selectedType.value === 'know-me-catalog' && !form.questionText?.trim()) {
    nextErrors.questionText = 'Bitte gib die Frage ein.';
  }
  if (selectedType.value === 'love-jar-templates' && !form.text?.trim()) {
    nextErrors.text = 'Bitte gib den Vorlagentext ein.';
  }

  errors.value = nextErrors;
  return Object.keys(nextErrors).length === 0;
}

async function loadLocales() {
  const payload = await adminApiRequest<{ locales: LocaleOption[] }>('/api/admin/content/locales');
  locales.value = payload.locales;
}

async function loadCategories() {
  const payload = await adminApiRequest<{ items: CategoryItem[] }>('/api/admin/categories');
  categories.value = payload.items;
}

async function loadItems() {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (activeFilter.value !== 'all') params.set('active', activeFilter.value);
    if (search.value) params.set('search', search.value);
    if (categoryFilter.value) params.set('category', categoryFilter.value);
    const query = params.toString();
    const payload = await adminApiRequest<{ items: ContentItem[] }>(`/api/admin/content/${selectedType.value}${query ? `?${query}` : ''}`);
    items.value = payload.items;
  } finally {
    loading.value = false;
  }
}

async function switchType(type: ContentType) {
  selectedType.value = type;
  categoryFilter.value = '';
  resetForm(false);
  await loadItems();
}

async function saveItem() {
  if (!validateForm()) return;
  saving.value = true;
  try {
    const path = form.id ? `/api/admin/content/${selectedType.value}/${form.id}` : `/api/admin/content/${selectedType.value}`;
    const method = form.id ? 'PATCH' : 'POST';
    const payload = await adminApiRequest<{ items: ContentItem[] }>(path, {
      method,
      body: JSON.stringify(form),
    });
    items.value = payload.items;
    resetForm(false);
  } catch {
    errors.value = { form: 'Content-Daten konnten nicht gespeichert werden. Pruefe Pflichtfelder und Kategorie.' };
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
  await Promise.all([loadLocales(), loadCategories()]);
  resetForm(false);
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
      <button v-for="type in contentTypes" :key="type.id" type="button" :class="{ active: selectedType === type.id }" @click="switchType(type.id)">
        {{ type.label }}
      </button>
    </div>

    <section v-if="showForm" ref="formAnchor" class="admin-panel admin-form" data-testid="admin-content-form">
      <div class="admin-form-head">
        <h2>{{ form.id ? 'Bearbeiten' : 'Neuer Eintrag' }}</h2>
        <button class="secondary-button admin-small-button" type="button" @click="resetForm(false)">Schliessen</button>
      </div>
      <p v-if="errors.form" class="form-error">{{ errors.form }}</p>
      <p class="muted">{{ defaultLanguageHint }}</p>

      <label class="admin-checkbox">
        <input v-model="form.active" type="checkbox" />
        Aktiv
      </label>

      <label>
        Kategorie
        <select v-model="form.category" data-testid="admin-content-category">
          <option value="">Bitte wählen</option>
          <option v-for="category in currentCategories" :key="category.id" :value="category.value">{{ category.label }}</option>
        </select>
        <small v-if="errors.category" class="admin-field-error">{{ errors.category }}</small>
      </label>

      <template v-if="selectedType === 'daily-questions'">
        <label>
          Text in der Default-Sprache
          <input v-model="form.text" data-testid="admin-content-text" />
          <small v-if="errors.text" class="admin-field-error">{{ errors.text }}</small>
        </label>
        <label>
          Tiefe
          <input v-model.number="form.depthLevel" min="1" max="4" type="number" />
          <small>Beschreibt die emotionale Intensität der Frage: 1 ist leicht und alltagsnah, 4 ist sehr persönlich und tiefgehend.</small>
          <small v-if="errors.depthLevel" class="admin-field-error">{{ errors.depthLevel }}</small>
        </label>
        <label class="admin-checkbox">
          <input v-model="form.longDistanceSuitable" type="checkbox" />
          Fernbeziehung geeignet
        </label>
        <small>Wenn aktiv, darf diese Frage auch Paaren angezeigt werden, die nicht am selben Ort leben.</small>
      </template>

      <template v-if="selectedType === 'quests'">
        <label>Titel in der Default-Sprache<input v-model="form.title" data-testid="admin-content-title" /><small v-if="errors.title" class="admin-field-error">{{ errors.title }}</small></label>
        <label>Beschreibung in der Default-Sprache<textarea v-model="form.description" rows="3" data-testid="admin-content-description" /><small v-if="errors.description" class="admin-field-error">{{ errors.description }}</small></label>
        <label>Minuten<input v-model.number="form.estimatedMinutes" min="1" type="number" /><small v-if="errors.estimatedMinutes" class="admin-field-error">{{ errors.estimatedMinutes }}</small></label>
        <label>
          Aufwand
          <select v-model="form.effortLevel">
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </label>
        <label>Punkte<input v-model.number="form.rewardPoints" min="0" type="number" /><small v-if="errors.rewardPoints" class="admin-field-error">{{ errors.rewardPoints }}</small></label>
        <label>Seed<input v-model="form.rewardSeedType" /></label>
        <label class="admin-checkbox"><input v-model="form.requiresBothPartners" type="checkbox" /> Beide Partner müssen bestätigen</label>
      </template>

      <template v-if="selectedType === 'know-me-catalog'">
        <label>Frage in der Default-Sprache<input v-model="form.questionText" data-testid="admin-content-question-text" /><small v-if="errors.questionText" class="admin-field-error">{{ errors.questionText }}</small></label>
        <label>Sortierung<input v-model.number="form.sortOrder" type="number" /></label>
      </template>

      <template v-if="selectedType === 'love-jar-templates'">
        <label>Text in der Default-Sprache<input v-model="form.text" data-testid="admin-content-love-jar-text" /><small v-if="errors.text" class="admin-field-error">{{ errors.text }}</small></label>
        <label>Sortierung<input v-model.number="form.sortOrder" type="number" /></label>
      </template>

      <section class="admin-translation-box">
        <h2>Übersetzungen</h2>
        <p class="muted">Die Default-Sprache wird oben als Fallback gespeichert und ist hier sichtbar, falls sie explizit gepflegt oder überschrieben werden soll.</p>
        <div v-for="locale in locales" :key="locale.locale" class="admin-translation-row">
          <strong>{{ locale.locale }}{{ locale.isDefault ? ' · Default' : '' }}</strong>
          <template v-if="selectedType === 'quests'">
            <input v-model="form.translations[locale.locale].title" :placeholder="`Titel ${locale.locale}`" />
            <textarea v-model="form.translations[locale.locale].description" rows="2" :placeholder="`Beschreibung ${locale.locale}`" />
          </template>
          <template v-else-if="selectedType === 'know-me-catalog'">
            <input v-model="form.translations[locale.locale].questionText" :placeholder="`Frage ${locale.locale}`" />
            <input v-model="form.translations[locale.locale].categoryLabel" :placeholder="`Kategorielabel ${locale.locale}`" />
          </template>
          <template v-else>
            <input v-model="form.translations[locale.locale].text" :placeholder="`Text ${locale.locale}`" />
          </template>
        </div>
      </section>

      <button class="primary-button" type="button" :disabled="saving" data-testid="admin-content-save" @click="saveItem">
        <Save :size="18" aria-hidden="true" />
        {{ saving ? 'Speichere...' : 'Speichern' }}
      </button>
    </section>

    <div class="admin-table-header">
      <div class="admin-toolbar">
        <input v-model="search" placeholder="Content filtern" data-testid="admin-content-search" @keyup.enter="loadItems" />
        <select v-model="categoryFilter" data-testid="admin-content-category-filter" @change="loadItems">
          <option value="">Alle Kategorien</option>
          <option v-for="category in currentCategories" :key="category.id" :value="category.value">{{ category.label }}</option>
        </select>
        <select v-model="activeFilter" data-testid="admin-content-active-filter" @change="loadItems">
          <option value="all">Alle</option>
          <option value="true">Aktiv</option>
          <option value="false">Inaktiv</option>
        </select>
        <button class="secondary-button" type="button" @click="loadItems">Filtern</button>
      </div>
      <button class="primary-button" type="button" data-testid="admin-content-new" @click="openFormForNew">
        <Plus :size="18" aria-hidden="true" />
        Neu
      </button>
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
