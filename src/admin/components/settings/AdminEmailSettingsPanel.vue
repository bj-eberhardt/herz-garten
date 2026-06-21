<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AdminPanel from '@/admin/components/common/AdminPanel.vue';

defineProps<{
  modelValue: {
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
  errors: {
    smtpHost: string;
    smtpPort: string;
    fromAddress: string;
    replyTo: string;
  };
}>();

const { t } = useI18n();
</script>

<template>
  <AdminPanel :title="t('admin.settings.email.title')" :intro="t('admin.settings.email.intro')" form test-id="admin-settings-email-block" class="admin-settings-block">
    <label class="admin-checkbox-row">
      <input v-model="modelValue.enabled" type="checkbox" data-testid="admin-settings-email-enabled" />
      <span>{{ t('admin.settings.email.enabled') }}</span>
    </label>

    <label>
      {{ t('admin.settings.email.smtpHost') }}
      <input v-model="modelValue.smtpHost" data-testid="admin-settings-email-host" />
      <p v-if="errors.smtpHost" class="form-error admin-settings-field-error" data-testid="admin-settings-error">{{ errors.smtpHost }}</p>
    </label>

    <label>
      {{ t('admin.settings.email.smtpPort') }}
      <input v-model.number="modelValue.smtpPort" type="number" min="1" max="65535" step="1" data-testid="admin-settings-email-port" />
      <p v-if="errors.smtpPort" class="form-error admin-settings-field-error" data-testid="admin-settings-error">{{ errors.smtpPort }}</p>
    </label>

    <label class="admin-checkbox-row">
      <input v-model="modelValue.smtpSecure" type="checkbox" data-testid="admin-settings-email-secure" />
      <span>{{ t('admin.settings.email.smtpSecure') }}</span>
    </label>

    <label>
      {{ t('admin.settings.email.smtpUser') }}
      <input v-model="modelValue.smtpUser" autocomplete="off" data-testid="admin-settings-email-user" />
    </label>

    <label>
      {{ t('admin.settings.email.smtpPassword') }}
      <input v-model="modelValue.smtpPassword" autocomplete="new-password" type="password" data-testid="admin-settings-email-password" />
      <small>
        {{ modelValue.smtpPasswordConfigured ? t('admin.settings.email.smtpPasswordConfigured') : t('admin.settings.email.smtpPasswordEmpty') }}
      </small>
    </label>

    <label>
      {{ t('admin.settings.email.fromAddress') }}
      <input v-model="modelValue.fromAddress" type="email" data-testid="admin-settings-email-from" />
      <p v-if="errors.fromAddress" class="form-error admin-settings-field-error" data-testid="admin-settings-error">{{ errors.fromAddress }}</p>
    </label>

    <label>
      {{ t('admin.settings.email.fromName') }}
      <input v-model="modelValue.fromName" data-testid="admin-settings-email-from-name" />
    </label>

    <label>
      {{ t('admin.settings.email.replyTo') }}
      <input v-model="modelValue.replyTo" type="email" data-testid="admin-settings-email-reply-to" />
      <p v-if="errors.replyTo" class="form-error admin-settings-field-error" data-testid="admin-settings-error">{{ errors.replyTo }}</p>
    </label>
  </AdminPanel>
</template>
