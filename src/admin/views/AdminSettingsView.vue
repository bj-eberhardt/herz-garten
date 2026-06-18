<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Save } from '@lucide/vue';
import { adminApiRequest } from '@/admin/services/adminApi';
import { ApiError } from '@/services/api';

interface AdminSettingsPayload {
  auth: {
    adminJwtTtlMinutes: number;
    userJwtTtlMinutes: number;
  };
}

const { t } = useI18n();
const loading = ref(false);
const saving = ref(false);
const formError = ref('');
const success = ref('');
const fieldErrors = reactive({
  adminJwtTtlMinutes: '',
  userJwtTtlMinutes: '',
});
const form = reactive<AdminSettingsPayload['auth']>({
  adminJwtTtlMinutes: 60,
  userJwtTtlMinutes: 10080,
});

function applySettings(payload: AdminSettingsPayload) {
  form.adminJwtTtlMinutes = payload.auth.adminJwtTtlMinutes;
  form.userJwtTtlMinutes = payload.auth.userJwtTtlMinutes;
}

function validateForm() {
  fieldErrors.adminJwtTtlMinutes = '';
  fieldErrors.userJwtTtlMinutes = '';

  if (!Number.isInteger(form.adminJwtTtlMinutes) || form.adminJwtTtlMinutes < 1 || form.adminJwtTtlMinutes > 1440) {
    fieldErrors.adminJwtTtlMinutes = t('admin.settings.errors.adminJwtTtl');
  }
  if (!Number.isInteger(form.userJwtTtlMinutes) || form.userJwtTtlMinutes < 1 || form.userJwtTtlMinutes > 43200) {
    fieldErrors.userJwtTtlMinutes = t('admin.settings.errors.userJwtTtl');
  }
  return !fieldErrors.adminJwtTtlMinutes && !fieldErrors.userJwtTtlMinutes;
}

function localizeAdminError(caught: unknown) {
  if (caught instanceof ApiError && caught.errorKey) {
    const key = `admin.serverErrors.${caught.errorKey}`;
    const translated = t(key, caught.params ?? {});
    if (translated !== key) return translated;
  }

  return t('admin.settings.errors.save');
}

async function loadSettings() {
  loading.value = true;
  formError.value = '';
  try {
    applySettings(await adminApiRequest<AdminSettingsPayload>('/api/admin/settings'));
  } catch (caught) {
    formError.value = localizeAdminError(caught);
  } finally {
    loading.value = false;
  }
}

async function saveSettings() {
  formError.value = '';
  success.value = '';
  if (!validateForm()) return;

  saving.value = true;
  try {
    const payload = await adminApiRequest<AdminSettingsPayload>('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({ auth: { ...form } }),
    });
    applySettings(payload);
    success.value = t('admin.settings.saved');
  } catch (caught) {
    formError.value = localizeAdminError(caught);
  } finally {
    saving.value = false;
  }
}

onMounted(loadSettings);
</script>

<template>
  <section class="admin-view" data-testid="admin-settings">
    <div class="admin-heading">
      <h1>{{ t('admin.settings.title') }}</h1>
      <span>{{ t('admin.settings.subtitle') }}</span>
    </div>
    <p class="muted">{{ t('admin.settings.intro') }}</p>

    <section class="admin-panel admin-form admin-settings-block" data-testid="admin-settings-jwt-block">
      <div class="admin-form-head">
        <div>
          <h2>{{ t('admin.settings.jwt.title') }}</h2>
          <p class="muted">{{ t('admin.settings.jwt.intro') }}</p>
        </div>
      </div>

      <label>
        {{ t('admin.settings.adminJwtTtlMinutes') }}
        <input
          v-model.number="form.adminJwtTtlMinutes"
          type="number"
          min="1"
          max="1440"
          step="1"
          data-testid="admin-settings-admin-jwt-ttl"
        />
        <small>{{ t('admin.settings.adminJwtTtlHelp') }}</small>
        <p v-if="fieldErrors.adminJwtTtlMinutes" class="form-error admin-settings-field-error" data-testid="admin-settings-error">
          {{ fieldErrors.adminJwtTtlMinutes }}
        </p>
      </label>

      <label>
        {{ t('admin.settings.userJwtTtlMinutes') }}
        <input
          v-model.number="form.userJwtTtlMinutes"
          type="number"
          min="1"
          max="43200"
          step="1"
          data-testid="admin-settings-user-jwt-ttl"
        />
        <small>{{ t('admin.settings.userJwtTtlHelp') }}</small>
        <p v-if="fieldErrors.userJwtTtlMinutes" class="form-error admin-settings-field-error" data-testid="admin-settings-error">
          {{ fieldErrors.userJwtTtlMinutes }}
        </p>
      </label>
    </section>

    <div class="admin-settings-actions">
      <p v-if="formError" class="form-error" data-testid="admin-settings-error">{{ formError }}</p>
      <p v-if="success" class="success-note" data-testid="admin-settings-success">{{ success }}</p>
      <button class="primary-button inline-button" type="button" :disabled="loading || saving" data-testid="admin-settings-save" @click="saveSettings">
        <Save :size="18" aria-hidden="true" />
        {{ saving ? t('admin.common.saving') : t('admin.common.save') }}
      </button>
    </div>
  </section>
</template>
