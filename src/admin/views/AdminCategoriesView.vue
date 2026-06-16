<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
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

const { t } = useI18n();

const contentTypes = computed<Array<{ id: ContentType; label: string }>>(() => [
  { id: 'daily-questions', label: t('admin.categories.labels.dailyQuestions') },
  { id: 'quests', label: t('admin.categories.labels.quests') },
  { id: 'know-me-catalog', label: t('admin.categories.labels.knowMe') },
  { id: 'love-jar-templates', label: t('admin.categories.labels.loveJar') },
  { id: 'memories', label: t('admin.categories.labels.memories') },
]);

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

function localizeAdminError(caught: unknown, fallbackKey: string) {
  if (caught instanceof ApiError && caught.errorKey) {
    const key = `admin.serverErrors.${caught.errorKey}`;
    const translated = t(key, caught.params ?? {});
    if (translated !== key) return translated;
  }

  return t(fallbackKey);
}

async function saveCategory() {
  if (!form.value.trim() || !form.label.trim()) {
    error.value = t('admin.categories.errors.required');
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
    error.value = localizeAdminError(caught, 'admin.categories.errors.save');
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
  } catch (caught) {
    error.value = localizeAdminError(caught, 'admin.categories.errors.delete');
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
      <h1>{{ t('admin.categories.title') }}</h1>
      <span>{{ filteredItems.length }}</span>
    </div>
    <p class="muted">{{ t('admin.categories.help') }}</p>

    <div class="admin-tabs" role="tablist">
      <button v-for="type in contentTypes" :key="type.id" type="button" :class="{ active: selectedType === type.id }" @click="switchType(type.id)">
        {{ type.label }}
      </button>
    </div>

    <section v-if="showForm" ref="formAnchor" class="admin-panel admin-form" data-testid="admin-category-form">
      <div class="admin-form-head">
        <h2>{{ form.id ? t('admin.categories.editTitle') : t('admin.categories.newTitle') }}</h2>
        <button class="secondary-button admin-small-button" type="button" @click="resetForm(false)">{{ t('admin.common.close') }}</button>
      </div>
      <p v-if="error" class="form-error">{{ error }}</p>
      <label>
        {{ t('admin.common.technicalValue') }}
        <input v-model="form.value" :disabled="Boolean(form.id)" placeholder="z.B. ritual" data-testid="admin-category-value" />
        <small>{{ t('admin.categories.technicalValueHelp') }}</small>
      </label>
      <label>{{ t('admin.common.label') }}<input v-model="form.label" data-testid="admin-category-label" /></label>
      <label>{{ t('admin.common.sortOrder') }}<input v-model.number="form.sortOrder" type="number" /></label>
      <label>
        {{ t('admin.categories.relationshipModes') }}
        <select v-model="form.relationshipModes" multiple data-testid="admin-category-relationship-modes">
          <option v-for="mode in relationshipModeOptions" :key="mode.value" :value="mode.value">{{ mode.label }}</option>
        </select>
        <small>{{ t('admin.categories.emptySelectionHelp') }}</small>
      </label>
      <label>
        {{ t('admin.categories.contentStyles') }}
        <select v-model="form.contentStyles" multiple data-testid="admin-category-content-styles">
          <option v-for="style in contentStyleOptions" :key="style.value" :value="style.value">{{ style.label }}</option>
        </select>
        <small>{{ t('admin.categories.emptySelectionHelp') }}</small>
      </label>
      <label class="admin-checkbox"><input v-model="form.active" type="checkbox" /> {{ t('admin.common.active') }}</label>

      <section class="admin-translation-box">
        <h2>{{ t('admin.common.translations') }}</h2>
        <div v-for="locale in locales" :key="locale.locale" class="admin-translation-row">
          <strong>{{ locale.locale }}</strong>
          <input v-model="form.translations[locale.locale].label" :placeholder="t('admin.common.labelPlaceholder', { locale: locale.locale })" />
        </div>
      </section>

      <button class="primary-button" type="button" :disabled="saving" data-testid="admin-category-save" @click="saveCategory">
        <Save :size="18" aria-hidden="true" />
        {{ saving ? t('admin.common.saving') : t('admin.common.save') }}
      </button>
    </section>

    <div class="admin-table-header">
      <div class="admin-toolbar">
        <p class="muted">{{ t('admin.categories.deleteHelp') }}</p>
      </div>
      <button class="primary-button" type="button" data-testid="admin-category-new" @click="openNew">
        <Plus :size="18" aria-hidden="true" />
        {{ t('admin.common.new') }}
      </button>
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>{{ t('admin.common.value') }}</th>
            <th>{{ t('admin.common.label') }}</th>
            <th>{{ t('admin.common.status') }}</th>
            <th>{{ t('admin.categories.suitableFor') }}</th>
            <th>{{ t('admin.categories.usage') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in filteredItems" :key="category.id">
            <td><code>{{ category.value }}</code></td>
            <td>{{ category.label }}</td>
            <td>{{ category.active ? t('admin.common.activeLower') : t('admin.common.inactiveLower') }}</td>
            <td>
              <span v-if="!category.relationshipModes.length && !category.contentStyles.length" class="muted">{{ t('admin.categories.neutralAll') }}</span>
              <span v-for="mode in category.relationshipModes" v-else :key="`mode-${mode}`" class="admin-chip">{{ mode }}</span>
              <span v-for="style in category.contentStyles" :key="`style-${style}`" class="admin-chip">{{ style }}</span>
            </td>
            <td>{{ category.usageCount ?? 0 }}</td>
            <td class="admin-actions">
              <button class="secondary-button admin-small-button" type="button" @click="editCategory(category)">{{ t('admin.common.edit') }}</button>
              <button class="danger-button admin-small-button" type="button" :disabled="Boolean(category.usageCount)" @click="deleteCategory(category)">
                <Trash2 :size="16" aria-hidden="true" />
                {{ t('admin.common.delete') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
