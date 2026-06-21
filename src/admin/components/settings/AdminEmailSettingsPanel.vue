<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AdminPanel from '@/admin/components/common/AdminPanel.vue';

interface EmailSettingsModel {
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
}

defineProps<{
  errors: {
    smtpHost: string;
    smtpPort: string;
    fromAddress: string;
    replyTo: string;
  };
}>();

const model = defineModel<EmailSettingsModel>({ required: true });
const { t } = useI18n();

function updateBoolean(field: 'enabled' | 'smtpSecure', event: Event) {
  model.value = {
    ...model.value,
    [field]: (event.target as HTMLInputElement).checked,
  };
}

function updateNumber(field: 'smtpPort', event: Event) {
  const value = (event.target as HTMLInputElement).valueAsNumber;
  model.value = {
    ...model.value,
    [field]: Number.isNaN(value) ? 0 : value,
  };
}

function updateString(field: 'smtpHost' | 'smtpUser' | 'smtpPassword' | 'fromAddress' | 'fromName' | 'replyTo', event: Event) {
  model.value = {
    ...model.value,
    [field]: (event.target as HTMLInputElement).value,
  };
}
</script>

<template>
  <AdminPanel :title="t('admin.settings.email.title')" :intro="t('admin.settings.email.intro')" form test-id="admin-settings-email-block" class="admin-settings-block">
    <label class="admin-checkbox-row">
      <input :checked="model.enabled" type="checkbox" data-testid="admin-settings-email-enabled" @change="updateBoolean('enabled', $event)" />
      <span>{{ t('admin.settings.email.enabled') }}</span>
    </label>

    <label>
      {{ t('admin.settings.email.smtpHost') }}
      <input :value="model.smtpHost" data-testid="admin-settings-email-host" @input="updateString('smtpHost', $event)" />
      <p v-if="errors.smtpHost" class="form-error admin-settings-field-error" data-testid="admin-settings-error">{{ errors.smtpHost }}</p>
    </label>

    <label>
      {{ t('admin.settings.email.smtpPort') }}
      <input :value="model.smtpPort" type="number" min="1" max="65535" step="1" data-testid="admin-settings-email-port" @input="updateNumber('smtpPort', $event)" />
      <p v-if="errors.smtpPort" class="form-error admin-settings-field-error" data-testid="admin-settings-error">{{ errors.smtpPort }}</p>
    </label>

    <label class="admin-checkbox-row">
      <input :checked="model.smtpSecure" type="checkbox" data-testid="admin-settings-email-secure" @change="updateBoolean('smtpSecure', $event)" />
      <span>{{ t('admin.settings.email.smtpSecure') }}</span>
    </label>

    <label>
      {{ t('admin.settings.email.smtpUser') }}
      <input :value="model.smtpUser" autocomplete="off" data-testid="admin-settings-email-user" @input="updateString('smtpUser', $event)" />
    </label>

    <label>
      {{ t('admin.settings.email.smtpPassword') }}
      <input :value="model.smtpPassword" autocomplete="new-password" type="password" data-testid="admin-settings-email-password" @input="updateString('smtpPassword', $event)" />
      <small>
        {{ model.smtpPasswordConfigured ? t('admin.settings.email.smtpPasswordConfigured') : t('admin.settings.email.smtpPasswordEmpty') }}
      </small>
    </label>

    <label>
      {{ t('admin.settings.email.fromAddress') }}
      <input :value="model.fromAddress" type="email" data-testid="admin-settings-email-from" @input="updateString('fromAddress', $event)" />
      <p v-if="errors.fromAddress" class="form-error admin-settings-field-error" data-testid="admin-settings-error">{{ errors.fromAddress }}</p>
    </label>

    <label>
      {{ t('admin.settings.email.fromName') }}
      <input :value="model.fromName" data-testid="admin-settings-email-from-name" @input="updateString('fromName', $event)" />
    </label>

    <label>
      {{ t('admin.settings.email.replyTo') }}
      <input :value="model.replyTo" type="email" data-testid="admin-settings-email-reply-to" @input="updateString('replyTo', $event)" />
      <p v-if="errors.replyTo" class="form-error admin-settings-field-error" data-testid="admin-settings-error">{{ errors.replyTo }}</p>
    </label>
  </AdminPanel>
</template>
