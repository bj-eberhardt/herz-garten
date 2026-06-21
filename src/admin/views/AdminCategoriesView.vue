<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus, Save, Trash2 } from '@lucide/vue';
import { adminApiRequest } from '@/admin/services/adminApi';
import AdminFormPanel from '@/admin/components/common/AdminFormPanel.vue';
import AdminLocalizedLabelForm from '@/admin/components/domain/AdminLocalizedLabelForm.vue';
import AdminPageHeader from '@/admin/components/common/AdminPageHeader.vue';
import AdminTable from '@/admin/components/common/AdminTable.vue';
import AdminTabs from '@/admin/components/common/AdminTabs.vue';
import { localizeAdminApiError } from '@/admin/composables/useAdminApiError';
import { useAdminFormPanel } from '@/admin/composables/useAdminFormPanel';
import { useAdminTranslations } from '@/admin/composables/useAdminTranslations';

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
const saving = ref(false);
const error = ref('');
const form = reactive<CategoryItem>(emptyForm('daily-questions'));
const { showForm, formAnchor, openForm, closeForm } = useAdminFormPanel();

const filteredItems = computed(() => items.value.filter((item) => item.contentType === selectedType.value));
const { defaultLocale, additionalLocales, ensureTranslations } = useAdminTranslations(locales, form);
const relationshipModeOptions = ref<Array<{ value: string; label: string; active: boolean }>>([]);
const contentStyleOptions = ref<Array<{ value: string; label: string; active: boolean }>>([]);

function replaceForm(nextForm: CategoryItem) {
  for (const key of Object.keys(form)) {
    delete (form as unknown as Record<string, unknown>)[key];
  }
  Object.assign(form, nextForm);
}

function categoryPayload() {
  const defaultTranslation = defaultLocale.value ? form.translations[defaultLocale.value.locale] ?? {} : {};
  return {
    contentType: form.contentType,
    value: form.value,
    label: defaultTranslation.label ?? form.label,
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

function resetForm(open = false) {
  replaceForm(emptyForm(selectedType.value));
  ensureTranslations();
  error.value = '';
  showForm.value = open;
}

async function openNew() {
  resetForm(false);
  await openForm();
}

async function editCategory(category: CategoryItem) {
  replaceForm(JSON.parse(JSON.stringify(category)));
  ensureTranslations();
  error.value = '';
  await openForm();
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
  const defaultLabel = defaultLocale.value ? form.translations[defaultLocale.value.locale]?.label : '';
  if (!form.value.trim() || !defaultLabel?.trim()) {
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
    error.value = localizeAdminApiError(caught, t, 'admin.categories.errors.save');
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
    error.value = localizeAdminApiError(caught, t, 'admin.categories.errors.delete');
  }
}

onMounted(async () => {
  await Promise.all([loadLocales(), loadCategories(), loadPreferences()]);
  resetForm(false);
});
</script>

<template>
  <section class="admin-view" data-testid="admin-categories">
    <AdminPageHeader :title="t('admin.categories.title')" :badge="filteredItems.length" />
    <p class="muted">{{ t('admin.categories.help') }}</p>

    <AdminTabs v-model="selectedType" :options="contentTypes" test-id-prefix="admin-category-tab" @change="switchType" />

    <AdminFormPanel
      v-if="showForm"
      ref="formAnchor"
      :title="form.id ? t('admin.categories.editTitle') : t('admin.categories.newTitle')"
      :error="error"
      test-id="admin-category-form"
      close-test-id="admin-category-form-close"
      @close="closeForm"
    >
      <template #error><span data-testid="admin-category-error">{{ error }}</span></template>
      <AdminLocalizedLabelForm
        :model-value="form"
        :default-locale="defaultLocale"
        :additional-locales="additionalLocales"
        :value-help="t('admin.categories.technicalValueHelp')"
        value-test-id="admin-category-value"
        sort-order-test-id="admin-category-sort-order"
        active-test-id="admin-category-active"
        label-test-id="admin-category-label"
      >
        <template #before-active>
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
        </template>
      </AdminLocalizedLabelForm>

      <button class="primary-button" type="button" :disabled="saving" data-testid="admin-category-save" @click="saveCategory">
        <Save :size="18" aria-hidden="true" />
        {{ saving ? t('admin.common.saving') : t('admin.common.save') }}
      </button>
    </AdminFormPanel>

    <div class="admin-table-header">
      <div class="admin-toolbar">
        <p class="muted">{{ t('admin.categories.deleteHelp') }}</p>
      </div>
      <button class="primary-button" type="button" data-testid="admin-category-new" @click="openNew">
        <Plus :size="18" aria-hidden="true" />
        {{ t('admin.common.new') }}
      </button>
    </div>

    <AdminTable>
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
          <tr v-for="category in filteredItems" :key="category.id" :data-testid="`admin-category-row-${category.id}`">
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
              <button class="secondary-button admin-small-button" type="button" :data-testid="`admin-category-edit-${category.id}`" @click="editCategory(category)">{{ t('admin.common.edit') }}</button>
              <button class="danger-button admin-small-button" type="button" :disabled="Boolean(category.usageCount)" :data-testid="`admin-category-delete-${category.id}`" @click="deleteCategory(category)">
                <Trash2 :size="16" aria-hidden="true" />
                {{ t('admin.common.delete') }}
              </button>
            </td>
          </tr>
        </tbody>
    </AdminTable>
  </section>
</template>
