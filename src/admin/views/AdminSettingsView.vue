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
  server: {
    publicBaseUrl: string;
  };
  passwordReset: {
    ttlMinutes: number;
    limitPer24h: number;
  };
  email: {
    enabled: boolean;
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser: string;
    smtpPassword?: string;
    smtpPasswordConfigured: boolean;
    fromAddress: string;
    fromName: string;
    replyTo: string;
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
  smtpHost: '',
  smtpPort: '',
  fromAddress: '',
  replyTo: '',
  passwordResetTtlMinutes: '',
  passwordResetLimitPer24h: '',
  publicBaseUrl: '',
});
const form = reactive<AdminSettingsPayload['auth']>({
  adminJwtTtlMinutes: 60,
  userJwtTtlMinutes: 10080,
});
const emailForm = reactive<AdminSettingsPayload['email']>({
  enabled: false,
  smtpHost: '',
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: '',
  smtpPassword: '',
  smtpPasswordConfigured: false,
  fromAddress: '',
  fromName: 'Herzgarten',
  replyTo: '',
});
const serverForm = reactive<AdminSettingsPayload['server']>({
  publicBaseUrl: 'http://localhost:5173',
});
const passwordResetForm = reactive<AdminSettingsPayload['passwordReset']>({
  ttlMinutes: 30,
  limitPer24h: 3,
});

function applySettings(payload: AdminSettingsPayload) {
  form.adminJwtTtlMinutes = payload.auth.adminJwtTtlMinutes;
  form.userJwtTtlMinutes = payload.auth.userJwtTtlMinutes;
  serverForm.publicBaseUrl = payload.server.publicBaseUrl;
  passwordResetForm.ttlMinutes = payload.passwordReset.ttlMinutes;
  passwordResetForm.limitPer24h = payload.passwordReset.limitPer24h;
  Object.assign(emailForm, {
    ...payload.email,
    smtpPassword: '',
  });
}

function validateForm() {
  fieldErrors.adminJwtTtlMinutes = '';
  fieldErrors.userJwtTtlMinutes = '';
  fieldErrors.smtpHost = '';
  fieldErrors.smtpPort = '';
  fieldErrors.fromAddress = '';
  fieldErrors.replyTo = '';
  fieldErrors.passwordResetTtlMinutes = '';
  fieldErrors.passwordResetLimitPer24h = '';
  fieldErrors.publicBaseUrl = '';

  if (!Number.isInteger(form.adminJwtTtlMinutes) || form.adminJwtTtlMinutes < 1 || form.adminJwtTtlMinutes > 1440) {
    fieldErrors.adminJwtTtlMinutes = t('admin.settings.errors.adminJwtTtl');
  }
  if (!Number.isInteger(form.userJwtTtlMinutes) || form.userJwtTtlMinutes < 1 || form.userJwtTtlMinutes > 43200) {
    fieldErrors.userJwtTtlMinutes = t('admin.settings.errors.userJwtTtl');
  }
  if (emailForm.enabled && !emailForm.smtpHost.trim()) {
    fieldErrors.smtpHost = t('admin.settings.errors.smtpHost');
  }
  if (!Number.isInteger(emailForm.smtpPort) || emailForm.smtpPort < 1 || emailForm.smtpPort > 65535) {
    fieldErrors.smtpPort = t('admin.settings.errors.smtpPort');
  }
  if (emailForm.enabled && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.fromAddress.trim())) {
    fieldErrors.fromAddress = t('admin.settings.errors.fromAddress');
  }
  if (emailForm.replyTo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.replyTo.trim())) {
    fieldErrors.replyTo = t('admin.settings.errors.replyTo');
  }
  try {
    new URL(serverForm.publicBaseUrl);
  } catch {
    fieldErrors.publicBaseUrl = t('admin.settings.errors.publicBaseUrl');
  }
  if (!Number.isInteger(passwordResetForm.ttlMinutes) || passwordResetForm.ttlMinutes < 15 || passwordResetForm.ttlMinutes > 1440) {
    fieldErrors.passwordResetTtlMinutes = t('admin.settings.errors.passwordResetTtlMinutes');
  }
  if (!Number.isInteger(passwordResetForm.limitPer24h) || passwordResetForm.limitPer24h < 1 || passwordResetForm.limitPer24h > 100) {
    fieldErrors.passwordResetLimitPer24h = t('admin.settings.errors.passwordResetLimitPer24h');
  }

  return Object.values(fieldErrors).every((error) => !error);
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
      body: JSON.stringify({
        auth: { ...form },
        server: { ...serverForm },
        passwordReset: { ...passwordResetForm },
        email: {
          ...emailForm,
          smtpPassword: emailForm.smtpPassword?.trim() || undefined,
          smtpPasswordConfigured: undefined,
        },
      }),
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

    <section class="admin-panel admin-form admin-settings-block" data-testid="admin-settings-server-block">
      <div class="admin-form-head">
        <div>
          <h2>{{ t('admin.settings.server.title') }}</h2>
          <p class="muted">{{ t('admin.settings.server.intro') }}</p>
        </div>
      </div>

      <label>
        {{ t('admin.settings.server.publicBaseUrl') }}
        <input v-model="serverForm.publicBaseUrl" data-testid="admin-settings-public-base-url" />
        <small>{{ t('admin.settings.server.publicBaseUrlHelp') }}</small>
        <p v-if="fieldErrors.publicBaseUrl" class="form-error admin-settings-field-error" data-testid="admin-settings-error">
          {{ fieldErrors.publicBaseUrl }}
        </p>
      </label>
    </section>

    <section class="admin-panel admin-form admin-settings-block" data-testid="admin-settings-password-reset-block">
      <div class="admin-form-head">
        <div>
          <h2>{{ t('admin.settings.passwordReset.title') }}</h2>
          <p class="muted">{{ t('admin.settings.passwordReset.intro') }}</p>
        </div>
      </div>

      <label>
        {{ t('admin.settings.passwordReset.ttlMinutes') }}
        <input
          v-model.number="passwordResetForm.ttlMinutes"
          type="number"
          min="15"
          max="1440"
          step="1"
          data-testid="admin-settings-reset-ttl"
        />
        <small>{{ t('admin.settings.passwordReset.ttlHelp') }}</small>
        <p v-if="fieldErrors.passwordResetTtlMinutes" class="form-error admin-settings-field-error" data-testid="admin-settings-error">
          {{ fieldErrors.passwordResetTtlMinutes }}
        </p>
      </label>

      <label>
        {{ t('admin.settings.passwordReset.limitPer24h') }}
        <input
          v-model.number="passwordResetForm.limitPer24h"
          type="number"
          min="1"
          max="100"
          step="1"
          data-testid="admin-settings-reset-limit"
        />
        <small>{{ t('admin.settings.passwordReset.limitHelp') }}</small>
        <p v-if="fieldErrors.passwordResetLimitPer24h" class="form-error admin-settings-field-error" data-testid="admin-settings-error">
          {{ fieldErrors.passwordResetLimitPer24h }}
        </p>
      </label>
    </section>

    <section class="admin-panel admin-form admin-settings-block" data-testid="admin-settings-email-block">
      <div class="admin-form-head">
        <div>
          <h2>{{ t('admin.settings.email.title') }}</h2>
          <p class="muted">{{ t('admin.settings.email.intro') }}</p>
        </div>
      </div>

      <label class="admin-checkbox-row">
        <input v-model="emailForm.enabled" type="checkbox" data-testid="admin-settings-email-enabled" />
        <span>{{ t('admin.settings.email.enabled') }}</span>
      </label>

      <label>
        {{ t('admin.settings.email.smtpHost') }}
        <input v-model="emailForm.smtpHost" data-testid="admin-settings-email-host" />
        <p v-if="fieldErrors.smtpHost" class="form-error admin-settings-field-error" data-testid="admin-settings-error">
          {{ fieldErrors.smtpHost }}
        </p>
      </label>

      <label>
        {{ t('admin.settings.email.smtpPort') }}
        <input v-model.number="emailForm.smtpPort" type="number" min="1" max="65535" step="1" data-testid="admin-settings-email-port" />
        <p v-if="fieldErrors.smtpPort" class="form-error admin-settings-field-error" data-testid="admin-settings-error">
          {{ fieldErrors.smtpPort }}
        </p>
      </label>

      <label class="admin-checkbox-row">
        <input v-model="emailForm.smtpSecure" type="checkbox" data-testid="admin-settings-email-secure" />
        <span>{{ t('admin.settings.email.smtpSecure') }}</span>
      </label>

      <label>
        {{ t('admin.settings.email.smtpUser') }}
        <input v-model="emailForm.smtpUser" autocomplete="off" data-testid="admin-settings-email-user" />
      </label>

      <label>
        {{ t('admin.settings.email.smtpPassword') }}
        <input v-model="emailForm.smtpPassword" autocomplete="new-password" type="password" data-testid="admin-settings-email-password" />
        <small>
          {{
            emailForm.smtpPasswordConfigured
              ? t('admin.settings.email.smtpPasswordConfigured')
              : t('admin.settings.email.smtpPasswordEmpty')
          }}
        </small>
      </label>

      <label>
        {{ t('admin.settings.email.fromAddress') }}
        <input v-model="emailForm.fromAddress" type="email" data-testid="admin-settings-email-from" />
        <p v-if="fieldErrors.fromAddress" class="form-error admin-settings-field-error" data-testid="admin-settings-error">
          {{ fieldErrors.fromAddress }}
        </p>
      </label>

      <label>
        {{ t('admin.settings.email.fromName') }}
        <input v-model="emailForm.fromName" data-testid="admin-settings-email-from-name" />
      </label>

      <label>
        {{ t('admin.settings.email.replyTo') }}
        <input v-model="emailForm.replyTo" type="email" data-testid="admin-settings-email-reply-to" />
        <p v-if="fieldErrors.replyTo" class="form-error admin-settings-field-error" data-testid="admin-settings-error">
          {{ fieldErrors.replyTo }}
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
