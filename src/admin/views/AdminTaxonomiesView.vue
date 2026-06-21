<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus, Save } from '@lucide/vue';
import { adminApiRequest } from '@/admin/services/adminApi';
import AdminFormPanel from '@/admin/components/common/AdminFormPanel.vue';
import AdminLocalizedLabelForm from '@/admin/components/domain/AdminLocalizedLabelForm.vue';
import AdminPageHeader from '@/admin/components/common/AdminPageHeader.vue';
import AdminTable from '@/admin/components/common/AdminTable.vue';
import AdminTabs from '@/admin/components/common/AdminTabs.vue';
import { localizeAdminApiError } from '@/admin/composables/useAdminApiError';
import { useAdminFormPanel } from '@/admin/composables/useAdminFormPanel';
import { useAdminTranslations } from '@/admin/composables/useAdminTranslations';

type PreferenceKind = 'relationship-modes' | 'content-styles';

interface LocaleOption {
  locale: string;
  label: string;
  isDefault: boolean;
}

interface PreferenceItem {
  id?: string;
  value: string;
  label: string;
  active: boolean;
  sortOrder: number;
  translations: Record<string, Record<string, string>>;
}

const { t } = useI18n();

const preferenceKinds = computed<Array<{ id: PreferenceKind; label: string }>>(() => [
  { id: 'relationship-modes', label: t('admin.taxonomies.relationshipModes') },
  { id: 'content-styles', label: t('admin.taxonomies.contentStyles') },
]);

const selectedKind = ref<PreferenceKind>('relationship-modes');
const locales = ref<LocaleOption[]>([]);
const items = ref<Record<PreferenceKind, PreferenceItem[]>>({
  'relationship-modes': [],
  'content-styles': [],
});
const saving = ref(false);
const error = ref('');
const form = reactive<PreferenceItem>(emptyForm());
const { showForm, formAnchor, openForm, closeForm } = useAdminFormPanel();

const currentItems = computed(() => items.value[selectedKind.value]);
const currentKindLabel = computed(() => preferenceKinds.value.find((kind) => kind.id === selectedKind.value)?.label ?? '');
const { defaultLocale, additionalLocales, ensureTranslations } = useAdminTranslations(locales, form);

function replaceForm(nextForm: PreferenceItem) {
  for (const key of Object.keys(form)) {
    delete (form as unknown as Record<string, unknown>)[key];
  }
  Object.assign(form, nextForm);
}

function preferencePayload() {
  const defaultTranslation = defaultLocale.value ? form.translations[defaultLocale.value.locale] ?? {} : {};
  return {
    value: form.value,
    label: defaultTranslation.label ?? form.label,
    active: form.active,
    sortOrder: form.sortOrder,
    translations: form.translations,
  };
}

function emptyForm(): PreferenceItem {
  return {
    value: '',
    label: '',
    active: true,
    sortOrder: 0,
    translations: {},
  };
}

function resetForm(open = false) {
  replaceForm(emptyForm());
  ensureTranslations();
  error.value = '';
  showForm.value = open;
}

async function openNew() {
  resetForm(false);
  await openForm();
}

async function editPreference(preference: PreferenceItem) {
  replaceForm(JSON.parse(JSON.stringify(preference)));
  ensureTranslations();
  error.value = '';
  await openForm();
}

async function loadLocales() {
  const payload = await adminApiRequest<{ locales: LocaleOption[] }>('/api/admin/content/locales');
  locales.value = payload.locales;
}

async function loadItems() {
  const [relationshipModes, contentStyles] = await Promise.all([
    adminApiRequest<{ items: PreferenceItem[] }>('/api/admin/relationship-modes'),
    adminApiRequest<{ items: PreferenceItem[] }>('/api/admin/content-styles'),
  ]);
  items.value = {
    'relationship-modes': relationshipModes.items,
    'content-styles': contentStyles.items,
  };
}

function switchKind(kind: PreferenceKind) {
  selectedKind.value = kind;
  resetForm(false);
}

async function savePreference() {
  const defaultLabel = defaultLocale.value ? form.translations[defaultLocale.value.locale]?.label : '';
  if (!form.value.trim() || !defaultLabel?.trim()) {
    error.value = t('admin.taxonomies.errors.required');
    return;
  }
  saving.value = true;
  try {
    const path = form.id ? `/api/admin/${selectedKind.value}/${form.id}` : `/api/admin/${selectedKind.value}`;
    const method = form.id ? 'PATCH' : 'POST';
    const payload = await adminApiRequest<{ items: PreferenceItem[] }>(path, {
      method,
      body: JSON.stringify(preferencePayload()),
    });
    items.value[selectedKind.value] = payload.items;
    resetForm(false);
  } catch (caught) {
    error.value = localizeAdminApiError(caught, t, 'admin.taxonomies.errors.save');
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await Promise.all([loadLocales(), loadItems()]);
  resetForm(false);
});
</script>

<template>
  <section class="admin-view" data-testid="admin-taxonomies">
    <AdminPageHeader :title="t('admin.taxonomies.title')" :badge="currentKindLabel" />

    <AdminTabs v-model="selectedKind" :options="preferenceKinds" test-id-prefix="admin-preference-tab" @change="switchKind" />

    <AdminFormPanel
      v-if="showForm"
      ref="formAnchor"
      :title="form.id ? t('admin.taxonomies.editTitle') : t('admin.taxonomies.newTitle')"
      :error="error"
      test-id="admin-preference-form"
      close-test-id="admin-preference-form-close"
      @close="closeForm"
    >
      <template #error><span data-testid="admin-preference-error">{{ error }}</span></template>
      <AdminLocalizedLabelForm
        :model-value="form"
        :default-locale="defaultLocale"
        :additional-locales="additionalLocales"
        :value-help="t('admin.taxonomies.technicalValueHelp')"
        value-test-id="admin-preference-value"
        sort-order-test-id="admin-preference-sort-order"
        active-test-id="admin-preference-active"
        label-test-id="admin-preference-label"
        @update:model-value="Object.assign(form, $event)"
      />

      <button class="primary-button" type="button" :disabled="saving" data-testid="admin-preference-save" @click="savePreference">
        <Save :size="18" aria-hidden="true" />
        {{ saving ? t('admin.common.saving') : t('admin.common.save') }}
      </button>
    </AdminFormPanel>

    <div class="admin-table-header">
      <p class="muted">{{ t('admin.taxonomies.help') }}</p>
      <button class="primary-button" type="button" data-testid="admin-preference-new" @click="openNew">
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
            <th>{{ t('admin.common.sortOrder') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="preference in currentItems" :key="preference.id" :data-testid="`admin-preference-row-${preference.id}`">
            <td><code>{{ preference.value }}</code></td>
            <td>{{ preference.label }}</td>
            <td>{{ preference.active ? t('admin.common.activeLower') : t('admin.common.inactiveLower') }}</td>
            <td>{{ preference.sortOrder }}</td>
            <td class="admin-actions">
              <button class="secondary-button admin-small-button" type="button" :data-testid="`admin-preference-edit-${preference.id}`" @click="editPreference(preference)">{{ t('admin.common.edit') }}</button>
            </td>
          </tr>
        </tbody>
    </AdminTable>
  </section>
</template>
