<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Save } from '@lucide/vue';
import { adminApiRequest } from '@/admin/services/adminApi';
import { ApiError } from '@/services/api';
import AdminAuthSettingsPanel from '@/admin/components/settings/AdminAuthSettingsPanel.vue';
import AdminEmailSettingsPanel from '@/admin/components/settings/AdminEmailSettingsPanel.vue';
import AdminPageHeader from '@/admin/components/common/AdminPageHeader.vue';
import AdminPasswordResetSettingsPanel from '@/admin/components/settings/AdminPasswordResetSettingsPanel.vue';
import AdminServerSettingsPanel from '@/admin/components/settings/AdminServerSettingsPanel.vue';

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
    <AdminPageHeader :title="t('admin.settings.title')" :badge="t('admin.settings.subtitle')" />
    <p class="muted">{{ t('admin.settings.intro') }}</p>

    <AdminAuthSettingsPanel :model-value="form" :errors="fieldErrors" />
    <AdminServerSettingsPanel :model-value="serverForm" :error="fieldErrors.publicBaseUrl" />
    <AdminPasswordResetSettingsPanel :model-value="passwordResetForm" :errors="fieldErrors" />
    <AdminEmailSettingsPanel :model-value="emailForm" :errors="fieldErrors" />

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
