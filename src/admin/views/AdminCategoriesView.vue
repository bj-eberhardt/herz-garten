<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { Plus, Save, Trash2 } from '@lucide/vue';
import { adminApiRequest } from '@/admin/services/adminApi';
import { ApiError } from '@/services/api';

type ContentType = 'daily-questions' | 'quests' | 'know-me-catalog' | 'love-jar-templates' | 'memories';

interface LocaleOption {
  locale: string;
  label: string;
  isDefault: boolean;
}

interface CategoryItem {
  id?: string;
  contentType: ContentType;
  value: string;
  label: string;
  active: boolean;
  sortOrder: number;
  relationshipModes: string[];
  contentStyles: string[];
  usageCount?: number;
  translations: Record<string, Record<string, string>>;
}

const contentTypes: Array<{ id: ContentType; label: string }> = [
  { id: 'daily-questions', label: 'Daily-Question-Kategorien' },
  { id: 'quests', label: 'Quest-Kategorien' },
  { id: 'know-me-catalog', label: 'Know-Me-Kategorien' },
  { id: 'love-jar-templates', label: 'Love-Jar-Kategorien' },
  { id: 'memories', label: 'Memory-Kategorien' },
];

const selectedType = ref<ContentType>('daily-questions');
const locales = ref<LocaleOption[]>([]);
const items = ref<CategoryItem[]>([]);
const showForm = ref(false);
const saving = ref(false);
const error = ref('');
const formAnchor = ref<HTMLElement | null>(null);
const form = reactive<CategoryItem>(emptyForm('daily-questions'));

const filteredItems = computed(() => items.value.filter((item) => item.contentType === selectedType.value));
const relationshipModeOptions = ref<Array<{ value: string; label: string; active: boolean }>>([]);
const contentStyleOptions = ref<Array<{ value: string; label: string; active: boolean }>>([]);

function replaceForm(nextForm: CategoryItem) {
  for (const key of Object.keys(form)) {
    delete (form as unknown as Record<string, unknown>)[key];
  }
  Object.assign(form, nextForm);
}

function categoryPayload() {
  return {
    contentType: form.contentType,
    value: form.value,
    label: form.label,
    active: form.active,
    sortOrder: form.sortOrder,
    relationshipModes: form.relationshipModes,
    contentStyles: form.contentStyles,
    translations: form.translations,
  };
}

function emptyForm(contentType: ContentType): CategoryItem {
  return {
    contentType,
    value: '',
    label: '',
    active: true,
    sortOrder: 0,
    relationshipModes: [],
    contentStyles: [],
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
  replaceForm(emptyForm(selectedType.value));
  ensureTranslations();
  error.value = '';
  showForm.value = open;
}

async function scrollToForm() {
  await nextTick();
  formAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function openNew() {
  resetForm(true);
  await scrollToForm();
}

async function editCategory(category: CategoryItem) {
  replaceForm(JSON.parse(JSON.stringify(category)));
  ensureTranslations();
  showForm.value = true;
  error.value = '';
  await scrollToForm();
}

async function loadLocales() {
  const payload = await adminApiRequest<{ locales: LocaleOption[] }>('/api/admin/content/locales');
  locales.value = payload.locales;
}

async function loadCategories() {
  const payload = await adminApiRequest<{ items: CategoryItem[] }>('/api/admin/categories');
  items.value = payload.items;
}

async function loadPreferences() {
  const [relationshipModes, contentStyles] = await Promise.all([
    adminApiRequest<{ items: Array<{ value: string; label: string; active: boolean }> }>('/api/admin/relationship-modes'),
    adminApiRequest<{ items: Array<{ value: string; label: string; active: boolean }> }>('/api/admin/content-styles'),
  ]);
  relationshipModeOptions.value = relationshipModes.items.filter((item) => item.active);
  contentStyleOptions.value = contentStyles.items.filter((item) => item.active);
}

async function switchType(type: ContentType) {
  selectedType.value = type;
  resetForm(false);
}

async function saveCategory() {
  if (!form.value.trim() || !form.label.trim()) {
    error.value = 'Bitte gib technischen Wert und Label ein.';
    return;
  }
  saving.value = true;
  try {
    const path = form.id ? `/api/admin/categories/${form.id}` : '/api/admin/categories';
    const method = form.id ? 'PATCH' : 'POST';
    const payload = await adminApiRequest<{ items: CategoryItem[] }>(path, {
      method,
      body: JSON.stringify(categoryPayload()),
    });
    items.value = payload.items;
    resetForm(false);
  } catch (caught) {
    error.value =
      caught instanceof ApiError && caught.serverMessage
        ? caught.serverMessage
        : 'Kategorie konnte nicht gespeichert werden. Pruefe technischen Wert, Label und Zuordnungen.';
  } finally {
    saving.value = false;
  }
}

async function deleteCategory(category: CategoryItem) {
  if (!category.id || category.usageCount) return;
  try {
    const payload = await adminApiRequest<{ items: CategoryItem[] }>(`/api/admin/categories/${category.id}`, {
      method: 'DELETE',
    });
    items.value = payload.items;
  } catch {
    error.value = 'Kategorie kann nur gelöscht werden, wenn sie nicht verwendet wird.';
  }
}

onMounted(async () => {
  await Promise.all([loadLocales(), loadCategories(), loadPreferences()]);
  resetForm(false);
});
</script>

<template>
  <section class="admin-view" data-testid="admin-categories">
    <div class="admin-heading">
      <h1>Content-Kategorien</h1>
      <span>{{ filteredItems.length }}</span>
    </div>
    <p class="muted">Hier pflegst du Kategorien fuer Inhalte. Einzelne Daily Questions bearbeitest du unter Content.</p>

    <div class="admin-tabs" role="tablist">
      <button v-for="type in contentTypes" :key="type.id" type="button" :class="{ active: selectedType === type.id }" @click="switchType(type.id)">
        {{ type.label }}
      </button>
    </div>

    <section v-if="showForm" ref="formAnchor" class="admin-panel admin-form" data-testid="admin-category-form">
      <div class="admin-form-head">
        <h2>{{ form.id ? 'Kategorie bearbeiten' : 'Neue Kategorie' }}</h2>
        <button class="secondary-button admin-small-button" type="button" @click="resetForm(false)">Schliessen</button>
      </div>
      <p v-if="error" class="form-error">{{ error }}</p>
      <label>
        Technischer Wert
        <input v-model="form.value" :disabled="Boolean(form.id)" placeholder="z.B. ritual" data-testid="admin-category-value" />
        <small>Dieser Wert wird im Content gespeichert und kann nach dem Anlegen nicht umbenannt werden.</small>
      </label>
      <label>Label<input v-model="form.label" data-testid="admin-category-label" /></label>
      <label>Sortierung<input v-model.number="form.sortOrder" type="number" /></label>
      <label>
        Passende Beziehungsmodi
        <select v-model="form.relationshipModes" multiple data-testid="admin-category-relationship-modes">
          <option v-for="mode in relationshipModeOptions" :key="mode.value" :value="mode.value">{{ mode.label }}</option>
        </select>
        <small>Keine Auswahl bedeutet: neutral / alle.</small>
      </label>
      <label>
        Passende Content-Stile
        <select v-model="form.contentStyles" multiple data-testid="admin-category-content-styles">
          <option v-for="style in contentStyleOptions" :key="style.value" :value="style.value">{{ style.label }}</option>
        </select>
        <small>Keine Auswahl bedeutet: neutral / alle.</small>
      </label>
      <label class="admin-checkbox"><input v-model="form.active" type="checkbox" /> Aktiv</label>

      <section class="admin-translation-box">
        <h2>Übersetzungen</h2>
        <div v-for="locale in locales" :key="locale.locale" class="admin-translation-row">
          <strong>{{ locale.locale }}</strong>
          <input v-model="form.translations[locale.locale].label" :placeholder="`Label ${locale.locale}`" />
        </div>
      </section>

      <button class="primary-button" type="button" :disabled="saving" data-testid="admin-category-save" @click="saveCategory">
        <Save :size="18" aria-hidden="true" />
        {{ saving ? 'Speichere...' : 'Speichern' }}
      </button>
    </section>

    <div class="admin-table-header">
      <div class="admin-toolbar">
        <p class="muted">Kategorien können nur gelöscht werden, solange sie nicht verwendet werden.</p>
      </div>
      <button class="primary-button" type="button" data-testid="admin-category-new" @click="openNew">
        <Plus :size="18" aria-hidden="true" />
        Neu
      </button>
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Wert</th>
            <th>Label</th>
            <th>Status</th>
            <th>Passend fuer</th>
            <th>Nutzung</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in filteredItems" :key="category.id">
            <td><code>{{ category.value }}</code></td>
            <td>{{ category.label }}</td>
            <td>{{ category.active ? 'aktiv' : 'inaktiv' }}</td>
            <td>
              <span v-if="!category.relationshipModes.length && !category.contentStyles.length" class="muted">neutral / alle</span>
              <span v-for="mode in category.relationshipModes" v-else :key="`mode-${mode}`" class="admin-chip">{{ mode }}</span>
              <span v-for="style in category.contentStyles" :key="`style-${style}`" class="admin-chip">{{ style }}</span>
            </td>
            <td>{{ category.usageCount ?? 0 }}</td>
            <td class="admin-actions">
              <button class="secondary-button admin-small-button" type="button" @click="editCategory(category)">Bearbeiten</button>
              <button class="danger-button admin-small-button" type="button" :disabled="Boolean(category.usageCount)" @click="deleteCategory(category)">
                <Trash2 :size="16" aria-hidden="true" />
                Loeschen
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
