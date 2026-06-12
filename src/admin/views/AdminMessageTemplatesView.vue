<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { Save } from '@lucide/vue';
import { adminApiRequest } from '@/admin/services/adminApi';

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
  translations: Record<string, { text: string }>;
}

const placeholderPattern = /\{(\w+)\}/g;

const locales = ref<LocaleOption[]>([]);
const items = ref<MessageTemplateItem[]>([]);
const search = ref('');
const selectedKey = ref('');
const savingKey = ref('');
const loading = ref(false);
const error = ref('');
const validationErrors = ref<Record<string, string>>({});
const formAnchor = ref<HTMLElement | null>(null);

const filteredItems = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return items.value;
  return items.value.filter((item) => item.key.toLowerCase().includes(query) || item.description.toLowerCase().includes(query));
});

const selectedItem = computed(() => items.value.find((item) => item.key === selectedKey.value) ?? null);
const defaultLocale = computed(() => locales.value.find((locale) => locale.isDefault)?.locale ?? 'de');

function placeholdersIn(text: string) {
  return [...new Set([...text.matchAll(placeholderPattern)].map((match) => match[1]))].sort();
}

function validateItem(item: MessageTemplateItem) {
  const nextErrors: Record<string, string> = {};
  const expected = [...item.requiredParams].sort();

  for (const locale of locales.value.filter((entry) => entry.active)) {
    const text = item.translations[locale.locale]?.text?.trim() ?? '';
    if (!text && locale.locale !== defaultLocale.value) continue;
    if (!text && locale.locale === defaultLocale.value) {
      nextErrors[locale.locale] = 'Die Default-Übersetzung darf nicht leer sein.';
      continue;
    }

    const found = placeholdersIn(text);
    const matches = found.length === expected.length && found.every((placeholder, index) => placeholder === expected[index]);
    if (!matches) {
      nextErrors[locale.locale] = `Erwartete Platzhalter: ${expected.map((param) => `{${param}}`).join(', ') || 'keine'}.`;
    }
  }

  validationErrors.value = nextErrors;
  return Object.keys(nextErrors).length === 0;
}

function ensureTranslations(item: MessageTemplateItem) {
  for (const locale of locales.value) {
    item.translations[locale.locale] ??= { text: '' };
  }
}

function previewText(item: MessageTemplateItem) {
  return item.translations[defaultLocale.value]?.text || item.translations.de?.text || '';
}

async function editItem(item: MessageTemplateItem) {
  selectedKey.value = item.key;
  validationErrors.value = {};
  error.value = '';
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
  try {
    const payload = await adminApiRequest<{ items: MessageTemplateItem[] }>('/api/admin/message-templates?namespace=notifications');
    items.value = payload.items;
    for (const item of items.value) ensureTranslations(item);
  } finally {
    loading.value = false;
  }
}

async function saveItem(item: MessageTemplateItem) {
  error.value = '';
  if (!validateItem(item)) return;

  savingKey.value = item.key;
  try {
    const payload = await adminApiRequest<{ items: MessageTemplateItem[] }>(`/api/admin/message-templates/${encodeURIComponent(item.key)}`, {
      method: 'PATCH',
      body: JSON.stringify({ translations: item.translations }),
    });
    items.value = payload.items;
    for (const nextItem of items.value) ensureTranslations(nextItem);
    selectedKey.value = item.key;
    validationErrors.value = {};
  } catch (caught) {
    const apiError = caught as { serverMessage?: string };
    error.value = apiError.serverMessage ?? 'Message-Template konnte nicht gespeichert werden.';
  } finally {
    savingKey.value = '';
  }
}

onMounted(async () => {
  await loadLocales();
  await loadItems();
});
</script>

<template>
  <section class="admin-view" data-testid="admin-message-templates">
    <div class="admin-heading">
      <h1>Messages</h1>
      <span>Notifications</span>
    </div>

    <div class="admin-table-header">
      <div class="admin-toolbar">
        <input v-model="search" placeholder="Message-Key filtern" data-testid="admin-message-search" />
      </div>
    </div>

    <section v-if="selectedItem" ref="formAnchor" class="admin-panel admin-form" data-testid="admin-message-form">
      <div class="admin-form-head">
        <h2>{{ selectedItem.key }}</h2>
        <button class="secondary-button admin-small-button" type="button" @click="closeForm">Schliessen</button>
      </div>
      <p v-if="error" class="form-error">{{ error }}</p>
      <p class="muted">{{ selectedItem.description }}</p>
      <div>
        <span v-if="selectedItem.requiredParams.length === 0" class="muted">Keine Platzhalter erlaubt.</span>
        <span v-for="param in selectedItem.requiredParams" v-else :key="param" class="admin-chip">{ {{ param }} }</span>
      </div>

      <div v-for="locale in locales.filter((entry) => entry.active)" :key="locale.locale" class="admin-translation-row">
        <strong>{{ locale.label }} ({{ locale.locale }}){{ locale.locale === defaultLocale ? ' · Default' : '' }}</strong>
        <textarea v-model="selectedItem.translations[locale.locale].text" rows="4" :data-testid="`admin-message-text-${locale.locale}`" />
        <small v-if="validationErrors[locale.locale]" class="admin-field-error">{{ validationErrors[locale.locale] }}</small>
      </div>

      <button class="primary-button inline-button" type="button" :disabled="savingKey === selectedItem.key" data-testid="admin-message-save" @click="saveItem(selectedItem)">
        <Save :size="18" aria-hidden="true" />
        {{ savingKey === selectedItem.key ? 'Speichere...' : 'Speichern' }}
      </button>
    </section>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Text</th>
            <th>Parameter</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredItems" :key="item.key">
            <td>
              <strong>{{ item.key }}</strong>
              <p class="muted">{{ item.description }}</p>
            </td>
            <td>{{ previewText(item) }}</td>
            <td>
              <span v-if="item.requiredParams.length === 0" class="muted">keine</span>
              <span v-for="param in item.requiredParams" v-else :key="param" class="admin-chip">{ {{ param }} }</span>
            </td>
            <td class="admin-actions">
              <button class="secondary-button admin-small-button" type="button" @click="editItem(item)">Bearbeiten</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="loading" class="muted">Lade...</p>
    </div>
  </section>
</template>
