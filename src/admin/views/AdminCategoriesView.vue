<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { Plus, Save, Trash2 } from '@lucide/vue';
import { adminApiRequest } from '@/admin/services/adminApi';

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
  usageCount?: number;
  translations: Record<string, Record<string, string>>;
}

const contentTypes: Array<{ id: ContentType; label: string }> = [
  { id: 'daily-questions', label: 'Daily Questions' },
  { id: 'quests', label: 'Quests' },
  { id: 'know-me-catalog', label: 'Know Me' },
  { id: 'love-jar-templates', label: 'Love Jar' },
  { id: 'memories', label: 'Memories' },
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

function emptyForm(contentType: ContentType): CategoryItem {
  return {
    contentType,
    value: '',
    label: '',
    active: true,
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
  Object.assign(form, JSON.parse(JSON.stringify(category)));
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
      body: JSON.stringify(form),
    });
    items.value = payload.items;
    resetForm(false);
  } catch {
    error.value = 'Kategorie konnte nicht gespeichert werden. Der technische Wert muss eindeutig sein.';
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
  await Promise.all([loadLocales(), loadCategories()]);
  resetForm(false);
});
</script>

<template>
  <section class="admin-view" data-testid="admin-categories">
    <div class="admin-heading">
      <h1>Categories</h1>
      <span>{{ filteredItems.length }}</span>
    </div>

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
            <th>Nutzung</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in filteredItems" :key="category.id">
            <td><code>{{ category.value }}</code></td>
            <td>{{ category.label }}</td>
            <td>{{ category.active ? 'aktiv' : 'inaktiv' }}</td>
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
