<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus, Save, Trash2 } from '@lucide/vue';
import { adminApiRequest } from '@/admin/services/adminApi';
import { ApiError } from '@/services/api';

interface LocaleOption {
  locale: string;
  label: string;
  isDefault: boolean;
}

interface GardenLevelItem {
  id: string;
  stage: number;
  name: string;
  localizedName: string;
  pointsToNext: number | null;
  minimumPoints: number;
  translations: Record<string, { name?: string }>;
}

interface GardenLevelForm {
  id?: string;
  stage?: number;
  name: string;
  pointsToNext: number | null;
  translations: Record<string, { name?: string }>;
}

const locales = ref<LocaleOption[]>([]);
const { t } = useI18n();
const levels = ref<GardenLevelItem[]>([]);
const showForm = ref(false);
const saving = ref(false);
const deletingId = ref('');
const error = ref('');
const formAnchor = ref<HTMLElement | null>(null);
const form = reactive<GardenLevelForm>(emptyForm());

const isLastStage = computed(() => {
  const maxStage = Math.max(0, ...levels.value.map((level) => level.stage));
  return !form.id || form.stage === maxStage;
});

function emptyForm(): GardenLevelForm {
  return {
    name: '',
    pointsToNext: null,
    translations: {},
  };
}

function replaceForm(nextForm: GardenLevelForm) {
  for (const key of Object.keys(form)) {
    delete (form as unknown as Record<string, unknown>)[key];
  }
  Object.assign(form, nextForm);
}

function ensureTranslations() {
  form.translations ??= {};
  for (const locale of locales.value) {
    form.translations[locale.locale] ??= {};
  }
}

function levelPayload() {
  return {
    name: form.name,
    pointsToNext: form.pointsToNext === null || form.pointsToNext === undefined ? null : Number(form.pointsToNext),
    translations: form.translations,
  };
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
  replaceForm({
    ...emptyForm(),
    stage: Math.max(0, ...levels.value.map((level) => level.stage)) + 1,
    pointsToNext: 200,
  });
  ensureTranslations();
  error.value = '';
  showForm.value = true;
  await scrollToForm();
}

async function editLevel(level: GardenLevelItem) {
  replaceForm(JSON.parse(JSON.stringify(level)));
  ensureTranslations();
  error.value = '';
  showForm.value = true;
  await scrollToForm();
}

async function loadLocales() {
  const payload = await adminApiRequest<{ locales: LocaleOption[] }>('/api/admin/content/locales');
  locales.value = payload.locales;
}

async function loadLevels() {
  const payload = await adminApiRequest<{ items: GardenLevelItem[] }>('/api/admin/garden/levels');
  levels.value = payload.items;
}

function validateForm() {
  if (!form.name.trim()) return t('admin.garden.errors.name');
  if (!form.id && (!Number.isInteger(Number(form.pointsToNext)) || Number(form.pointsToNext) <= 0)) {
    return t('admin.garden.errors.newPoints');
  }
  if (!isLastStage.value && (!Number.isInteger(Number(form.pointsToNext)) || Number(form.pointsToNext) <= 0)) {
    return t('admin.garden.errors.nextPoints');
  }
  if (form.pointsToNext !== null && form.pointsToNext !== undefined && Number(form.pointsToNext) <= 0) {
    return t('admin.garden.errors.positivePoints');
  }
  return '';
}

async function saveLevel() {
  const validationError = validateForm();
  if (validationError) {
    error.value = validationError;
    return;
  }

  saving.value = true;
  try {
    const path = form.id ? `/api/admin/garden/levels/${form.id}` : '/api/admin/garden/levels';
    const method = form.id ? 'PATCH' : 'POST';
    const payload = await adminApiRequest<{ items: GardenLevelItem[] }>(path, {
      method,
      body: JSON.stringify(levelPayload()),
    });
    levels.value = payload.items;
    resetForm(false);
  } catch (caught) {
    error.value =
      caught instanceof ApiError && caught.serverMessage
        ? caught.serverMessage
        : t('admin.garden.errors.save');
  } finally {
    saving.value = false;
  }
}

async function deleteLevel(level: GardenLevelItem) {
  deletingId.value = level.id;
  error.value = '';
  try {
    const payload = await adminApiRequest<{ items: GardenLevelItem[] }>(`/api/admin/garden/levels/${level.id}`, { method: 'DELETE' });
    levels.value = payload.items;
    if (form.id === level.id) resetForm(false);
  } catch (caught) {
    error.value =
      caught instanceof ApiError && caught.serverMessage
        ? caught.serverMessage
        : t('admin.garden.errors.delete');
  } finally {
    deletingId.value = '';
  }
}

onMounted(async () => {
  await Promise.all([loadLocales(), loadLevels()]);
  resetForm(false);
});
</script>

<template>
  <section class="admin-view" data-testid="admin-garden">
    <div class="admin-heading">
      <h1>{{ t('admin.garden.title') }}</h1>
      <span>{{ t('admin.garden.subtitle') }}</span>
    </div>

    <section v-if="showForm" ref="formAnchor" class="admin-panel admin-form" data-testid="admin-garden-level-form">
      <div class="admin-form-head">
        <h2>{{ form.id ? t('admin.garden.editTitle', { stage: form.stage }) : t('admin.garden.newTitle') }}</h2>
        <button class="secondary-button admin-small-button" type="button" @click="resetForm(false)">{{ t('admin.common.close') }}</button>
      </div>
      <p class="admin-warning">
        {{ t('admin.garden.saveWarning') }}
      </p>
      <p v-if="error" class="form-error">{{ error }}</p>

      <label>{{ t('admin.common.name') }}<input v-model="form.name" data-testid="admin-garden-level-name" /></label>
      <label>
        {{ form.id ? t('admin.garden.pointsToNext') : t('admin.garden.pointsFromPrevious') }}
        <input v-model.number="form.pointsToNext" type="number" min="1" data-testid="admin-garden-level-points" />
        <small v-if="isLastStage">{{ t('admin.garden.lastStageHelp') }}</small>
      </label>

      <section class="admin-translation-box">
        <h2>{{ t('admin.common.translations') }}</h2>
        <div v-for="locale in locales" :key="locale.locale" class="admin-translation-row">
          <strong>{{ locale.locale }}</strong>
          <input v-model="form.translations[locale.locale].name" :placeholder="t('admin.common.namePlaceholder', { locale: locale.locale })" />
        </div>
      </section>

      <button class="primary-button" type="button" :disabled="saving" data-testid="admin-garden-level-save" @click="saveLevel">
        <Save :size="18" aria-hidden="true" />
        {{ saving ? t('admin.common.saving') : t('admin.common.save') }}
      </button>
    </section>

    <div class="admin-table-header">
      <p class="muted">{{ t('admin.garden.deltaHelp') }}</p>
      <button class="primary-button" type="button" data-testid="admin-garden-level-new" @click="openNew">
        <Plus :size="18" aria-hidden="true" />
        {{ t('admin.common.new') }}
      </button>
    </div>

    <p v-if="error && !showForm" class="form-error">{{ error }}</p>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>{{ t('admin.garden.stage') }}</th>
            <th>{{ t('admin.common.name') }}</th>
            <th>{{ t('admin.garden.minimumPoints') }}</th>
            <th>{{ t('admin.garden.untilNext') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="level in levels" :key="level.id">
            <td>{{ level.stage }}</td>
            <td>{{ level.localizedName }}</td>
            <td>{{ level.minimumPoints }}</td>
            <td>{{ level.pointsToNext ?? '-' }}</td>
            <td class="admin-actions">
              <button class="secondary-button admin-small-button" type="button" @click="editLevel(level)">{{ t('admin.common.edit') }}</button>
              <button
                class="secondary-button admin-small-button"
                type="button"
                :disabled="level.stage === 1 || deletingId === level.id"
                data-testid="admin-garden-level-delete"
                @click="deleteLevel(level)"
              >
                <Trash2 :size="14" aria-hidden="true" />
                {{ t('admin.common.delete') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
