<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus, Save } from '@lucide/vue';
import { adminApiRequest } from '@/admin/services/adminApi';
import { ApiError } from '@/services/api';

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
const showForm = ref(false);
const saving = ref(false);
const error = ref('');
const formAnchor = ref<HTMLElement | null>(null);
const form = reactive<PreferenceItem>(emptyForm());

const currentItems = computed(() => items.value[selectedKind.value]);
const currentKindLabel = computed(() => preferenceKinds.value.find((kind) => kind.id === selectedKind.value)?.label ?? '');

function replaceForm(nextForm: PreferenceItem) {
  for (const key of Object.keys(form)) {
    delete (form as unknown as Record<string, unknown>)[key];
  }
  Object.assign(form, nextForm);
}

function preferencePayload() {
  return {
    value: form.value,
    label: form.label,
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

function ensureTranslations() {
  form.translations ??= {};
  for (const locale of locales.value) {
    form.translations[locale.locale] ??= {};
  }
}

function resetForm(open = false) {
  replaceForm(emptyForm());
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

async function editPreference(preference: PreferenceItem) {
  replaceForm(JSON.parse(JSON.stringify(preference)));
  ensureTranslations();
  error.value = '';
  showForm.value = true;
  await scrollToForm();
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

function localizeAdminError(caught: unknown, fallbackKey: string) {
  if (caught instanceof ApiError && caught.errorKey) {
    const key = `admin.serverErrors.${caught.errorKey}`;
    const translated = t(key, caught.params ?? {});
    if (translated !== key) return translated;
  }

  return t(fallbackKey);
}

async function savePreference() {
  if (!form.value.trim() || !form.label.trim()) {
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
    error.value = localizeAdminError(caught, 'admin.taxonomies.errors.save');
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
    <div class="admin-heading">
      <h1>{{ t('admin.taxonomies.title') }}</h1>
      <span>{{ currentKindLabel }}</span>
    </div>

    <div class="admin-tabs" role="tablist">
      <button v-for="kind in preferenceKinds" :key="kind.id" type="button" :class="{ active: selectedKind === kind.id }" @click="switchKind(kind.id)">
        {{ kind.label }}
      </button>
    </div>

    <section v-if="showForm" ref="formAnchor" class="admin-panel admin-form" data-testid="admin-preference-form">
      <div class="admin-form-head">
        <h2>{{ form.id ? t('admin.taxonomies.editTitle') : t('admin.taxonomies.newTitle') }}</h2>
        <button class="secondary-button admin-small-button" type="button" @click="resetForm(false)">{{ t('admin.common.close') }}</button>
      </div>
      <p v-if="error" class="form-error">{{ error }}</p>
      <label>
        {{ t('admin.common.technicalValue') }}
        <input v-model="form.value" :disabled="Boolean(form.id)" data-testid="admin-preference-value" />
        <small>{{ t('admin.taxonomies.technicalValueHelp') }}</small>
      </label>
      <label>{{ t('admin.common.label') }}<input v-model="form.label" data-testid="admin-preference-label" /></label>
      <label>{{ t('admin.common.sortOrder') }}<input v-model.number="form.sortOrder" type="number" /></label>
      <label class="admin-checkbox"><input v-model="form.active" type="checkbox" /> {{ t('admin.common.active') }}</label>

      <section class="admin-translation-box">
        <h2>{{ t('admin.common.translations') }}</h2>
        <div v-for="locale in locales" :key="locale.locale" class="admin-translation-row">
          <strong>{{ locale.locale }}</strong>
          <input v-model="form.translations[locale.locale].label" :placeholder="t('admin.common.labelPlaceholder', { locale: locale.locale })" />
        </div>
      </section>

      <button class="primary-button" type="button" :disabled="saving" data-testid="admin-preference-save" @click="savePreference">
        <Save :size="18" aria-hidden="true" />
        {{ saving ? t('admin.common.saving') : t('admin.common.save') }}
      </button>
    </section>

    <div class="admin-table-header">
      <p class="muted">{{ t('admin.taxonomies.help') }}</p>
      <button class="primary-button" type="button" data-testid="admin-preference-new" @click="openNew">
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
            <th>{{ t('admin.common.sortOrder') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="preference in currentItems" :key="preference.id">
            <td><code>{{ preference.value }}</code></td>
            <td>{{ preference.label }}</td>
            <td>{{ preference.active ? t('admin.common.activeLower') : t('admin.common.inactiveLower') }}</td>
            <td>{{ preference.sortOrder }}</td>
            <td class="admin-actions">
              <button class="secondary-button admin-small-button" type="button" @click="editPreference(preference)">{{ t('admin.common.edit') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
