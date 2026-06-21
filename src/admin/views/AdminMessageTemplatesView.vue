<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Save } from '@lucide/vue';
import { adminApiRequest } from '@/admin/services/adminApi';
import { ApiError } from '@/services/api';

interface LocaleOption {
  locale: string;
  label: string;
  active: boolean;
  isDefault: boolean;
}

interface MessageTemplateItem {
  key: string;
  namespace: string;
  description: string;
  requiredParams: string[];
  active: boolean;
  translations: Record<string, { text: string; description: string }>;
}

interface MessageTemplateServerValidationError {
  locale: string;
  errorCode: string;
  params?: Record<string, unknown>;
}

const placeholderPattern = /\{(\w+)\}/g;

const locales = ref<LocaleOption[]>([]);
const { t } = useI18n();
const items = ref<MessageTemplateItem[]>([]);
const search = ref('');
const selectedKey = ref('');
const activeNamespace = ref<'notifications' | 'push' | 'email'>('notifications');
const savingKey = ref('');
const loading = ref(false);
const error = ref('');
const successMessage = ref('');
const validationErrors = ref<Record<string, string>>({});
const formAnchor = ref<HTMLElement | null>(null);
let successTimer: ReturnType<typeof window.setTimeout> | undefined;

const filteredItems = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return items.value;
  return items.value.filter((item) => item.key.toLowerCase().includes(query) || item.description.toLowerCase().includes(query));
});

const selectedItem = computed(() => items.value.find((item) => item.key === selectedKey.value) ?? null);
const defaultLocale = computed(() => locales.value.find((locale) => locale.isDefault)?.locale ?? 'de');
const activeLocales = computed(() => locales.value.filter((entry) => entry.active));
const namespaceOptions = computed(() => [
  { value: 'notifications' as const, label: t('admin.messages.channels.notifications') },
  { value: 'push' as const, label: t('admin.messages.channels.push') },
  { value: 'email' as const, label: t('admin.messages.channels.email') },
]);

function placeholdersIn(text: string) {
  return [...new Set([...text.matchAll(placeholderPattern)].map((match) => match[1]))].sort();
}

function validateItem(item: MessageTemplateItem) {
  const nextErrors: Record<string, string> = {};
  const expected = [...item.requiredParams].sort();

  for (const locale of locales.value.filter((entry) => entry.active)) {
    const text = item.translations[locale.locale]?.text?.trim() ?? '';
    const description = item.translations[locale.locale]?.description?.trim() ?? '';
    if (!text && locale.locale !== defaultLocale.value) continue;
    if (!text && locale.locale === defaultLocale.value) {
      nextErrors[locale.locale] = t('admin.messages.errors.defaultTranslationRequired');
      continue;
    }
    if (!description && locale.locale === defaultLocale.value) {
      nextErrors[locale.locale] = t('admin.messages.errors.defaultTranslationRequired');
      continue;
    }

    const found = placeholdersIn(text);
    const matches = found.length === expected.length && found.every((placeholder, index) => placeholder === expected[index]);
    if (!matches) {
      nextErrors[locale.locale] = t('admin.messages.expectedPlaceholders', {
        placeholders: expected.map((param) => `{${param}}`).join(', ') || t('admin.common.none'),
      });
    }
  }

  validationErrors.value = nextErrors;
  return Object.keys(nextErrors).length === 0;
}

function clearSuccessMessage() {
  if (successTimer) {
    window.clearTimeout(successTimer);
    successTimer = undefined;
  }
  successMessage.value = '';
}

function showSuccessMessage(message: string) {
  clearSuccessMessage();
  successMessage.value = message;
  successTimer = window.setTimeout(() => {
    successMessage.value = '';
    successTimer = undefined;
  }, 5000);
}

function localizedTemplateValidationError(error: MessageTemplateServerValidationError) {
  if (error.errorCode === 'admin.messageTemplate.placeholderMismatch') {
    const expected = Array.isArray(error.params?.expectedPlaceholders)
      ? error.params.expectedPlaceholders.map((placeholder) => `{${String(placeholder)}}`).join(', ')
      : '';
    return t('admin.messages.expectedPlaceholders', {
      placeholders: expected || t('admin.common.none'),
    });
  }
  if (error.errorCode === 'admin.messageTemplate.defaultDescriptionRequired') {
    return t('admin.serverErrors.admin.messageTemplate.defaultDescriptionRequired');
  }

  const key = `admin.serverErrors.${error.errorCode}`;
  const translated = t(key, error.params ?? {});
  return translated === key ? t('admin.messages.errors.save') : translated;
}

function applyServerValidationErrors(apiError: ApiError) {
  const validationErrorsPayload = apiError.params?.validationErrors;
  if (!Array.isArray(validationErrorsPayload)) return false;

  const nextErrors: Record<string, string> = {};
  for (const item of validationErrorsPayload) {
    if (!item || typeof item !== 'object') continue;
    const serverError = item as MessageTemplateServerValidationError;
    if (typeof serverError.locale !== 'string' || typeof serverError.errorCode !== 'string') continue;
    nextErrors[serverError.locale] = localizedTemplateValidationError(serverError);
  }

  validationErrors.value = nextErrors;
  return Object.keys(nextErrors).length > 0;
}

function ensureTranslations(item: MessageTemplateItem) {
  for (const locale of locales.value) {
    item.translations[locale.locale] ??= { text: '', description: '' };
    item.translations[locale.locale].text ??= '';
    item.translations[locale.locale].description ??= '';
  }
}

function previewText(item: MessageTemplateItem) {
  return item.translations[defaultLocale.value]?.text || item.translations.de?.text || '';
}

async function editItem(item: MessageTemplateItem) {
  selectedKey.value = item.key;
  validationErrors.value = {};
  error.value = '';
  clearSuccessMessage();
  await nextTick();
  formAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeForm() {
  selectedKey.value = '';
  validationErrors.value = {};
  error.value = '';
}

async function loadLocales() {
  const payload = await adminApiRequest<{ locales: LocaleOption[] }>('/api/admin/content/locales');
  locales.value = payload.locales;
}

async function loadItems() {
  loading.value = true;
  selectedKey.value = '';
  validationErrors.value = {};
  error.value = '';
  try {
    const payload = await adminApiRequest<{ items: MessageTemplateItem[] }>(`/api/admin/message-templates?namespace=${activeNamespace.value}`);
    items.value = payload.items;
    for (const item of items.value) ensureTranslations(item);
  } finally {
    loading.value = false;
  }
}

async function saveItem(item: MessageTemplateItem) {
  error.value = '';
  clearSuccessMessage();
  if (!validateItem(item)) return;

  savingKey.value = item.key;
  try {
    const payload = await adminApiRequest<{ items: MessageTemplateItem[] }>(`/api/admin/message-templates/${encodeURIComponent(item.key)}`, {
      method: 'PATCH',
      body: JSON.stringify({ translations: item.translations }),
    });
    items.value = payload.items;
    for (const nextItem of items.value) ensureTranslations(nextItem);
    selectedKey.value = '';
    validationErrors.value = {};
    showSuccessMessage(t('admin.messages.saved'));
  } catch (caught) {
    if (caught instanceof ApiError && applyServerValidationErrors(caught)) {
      error.value = t('admin.messages.errors.validation');
    } else {
      error.value = t('admin.messages.errors.save');
    }
  } finally {
    savingKey.value = '';
  }
}

onMounted(async () => {
  await loadLocales();
  await loadItems();
});

onBeforeUnmount(() => {
  if (successTimer) window.clearTimeout(successTimer);
});
</script>

<template>
  <section class="admin-view" data-testid="admin-message-templates">
    <div class="admin-heading">
      <h1>{{ t('admin.messages.title') }}</h1>
      <span>{{ t('admin.messages.subtitle') }}</span>
    </div>
    <p class="muted">{{ t('admin.messages.intro') }}</p>
    <p v-if="successMessage" class="success-note" data-testid="admin-message-success">{{ successMessage }}</p>

    <div class="admin-tabs" role="tablist" :aria-label="t('admin.messages.channelLabel')">
      <button
        v-for="option in namespaceOptions"
        :key="option.value"
        type="button"
        :class="{ active: activeNamespace === option.value }"
        :data-testid="`admin-message-channel-${option.value}`"
        @click="activeNamespace = option.value; loadItems()"
      >
        {{ option.label }}
      </button>
    </div>

    <div class="admin-table-header admin-message-table-header">
      <div class="admin-toolbar admin-message-toolbar">
        <input v-model="search" class="admin-message-search-input" :placeholder="t('admin.messages.searchPlaceholder')" data-testid="admin-message-search" />
      </div>
    </div>

    <section v-if="selectedItem" ref="formAnchor" class="admin-panel admin-form" data-testid="admin-message-form">
      <div class="admin-form-head">
        <h2>{{ selectedItem.key }}</h2>
        <button class="secondary-button admin-small-button" type="button" data-testid="admin-message-form-close" @click="closeForm">{{ t('admin.common.close') }}</button>
      </div>
      <p v-if="error" class="form-error" data-testid="admin-message-error">{{ error }}</p>
      <p class="muted">{{ selectedItem.description }}</p>
      <div>
        <span v-if="selectedItem.requiredParams.length === 0" class="muted">{{ t('admin.messages.noPlaceholders') }}</span>
        <span v-for="param in selectedItem.requiredParams" v-else :key="param" class="admin-chip">{ {{ param }} }</span>
      </div>

      <div v-for="locale in activeLocales" :key="locale.locale" class="admin-translation-row">
        <strong>{{ locale.label }} ({{ locale.locale }}){{ locale.locale === defaultLocale ? t('admin.messages.standardSuffix') : '' }}</strong>
        <input v-model="selectedItem.translations[locale.locale].description" :placeholder="t('admin.common.descriptionPlaceholder', { locale: locale.locale })" :data-testid="`admin-message-description-${locale.locale}`" />
        <textarea v-model="selectedItem.translations[locale.locale].text" rows="4" :data-testid="`admin-message-text-${locale.locale}`" />
        <small v-if="validationErrors[locale.locale]" class="admin-field-error">{{ validationErrors[locale.locale] }}</small>
      </div>

      <button class="primary-button inline-button" type="button" :disabled="savingKey === selectedItem.key" data-testid="admin-message-save" @click="saveItem(selectedItem)">
        <Save :size="18" aria-hidden="true" />
        {{ savingKey === selectedItem.key ? t('admin.common.saving') : t('admin.common.save') }}
      </button>
    </section>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>{{ t('admin.messages.key') }}</th>
            <th>{{ t('admin.messages.text') }}</th>
            <th>{{ t('admin.messages.parameters') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredItems" :key="item.key" :data-testid="`admin-message-row-${item.key}`">
            <td>
              <strong>{{ item.key }}</strong>
              <p class="muted">{{ item.description }}</p>
            </td>
            <td>{{ previewText(item) }}</td>
            <td>
              <span v-if="item.requiredParams.length === 0" class="muted">{{ t('admin.common.none') }}</span>
              <span v-for="param in item.requiredParams" v-else :key="param" class="admin-chip">{ {{ param }} }</span>
            </td>
            <td class="admin-actions">
              <button class="secondary-button admin-small-button" type="button" :data-testid="`admin-message-edit-${item.key}`" @click="editItem(item)">{{ t('admin.common.edit') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="loading" class="muted">{{ t('admin.common.loading') }}</p>
      <p v-else-if="filteredItems.length === 0" class="muted" data-testid="admin-message-empty">{{ t('admin.messages.empty') }}</p>
    </div>
  </section>
</template>
