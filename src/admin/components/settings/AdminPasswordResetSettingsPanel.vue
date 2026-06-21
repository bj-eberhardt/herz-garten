<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AdminPanel from '@/admin/components/common/AdminPanel.vue';

interface PasswordResetSettingsModel {
  ttlMinutes: number;
  limitPer24h: number;
}

defineProps<{
  errors: {
    passwordResetTtlMinutes: string;
    passwordResetLimitPer24h: string;
  };
}>();

const model = defineModel<PasswordResetSettingsModel>({ required: true });
const { t } = useI18n();

function updateNumber(field: keyof PasswordResetSettingsModel, event: Event) {
  const value = (event.target as HTMLInputElement).valueAsNumber;
  model.value = {
    ...model.value,
    [field]: Number.isNaN(value) ? 0 : value,
  };
}
</script>

<template>
  <AdminPanel :title="t('admin.settings.passwordReset.title')" :intro="t('admin.settings.passwordReset.intro')" form test-id="admin-settings-password-reset-block" class="admin-settings-block">
    <label>
      {{ t('admin.settings.passwordReset.ttlMinutes') }}
      <input :value="model.ttlMinutes" type="number" min="15" max="1440" step="1" data-testid="admin-settings-reset-ttl" @input="updateNumber('ttlMinutes', $event)" />
      <small>{{ t('admin.settings.passwordReset.ttlHelp') }}</small>
      <p v-if="errors.passwordResetTtlMinutes" class="form-error admin-settings-field-error" data-testid="admin-settings-error">
        {{ errors.passwordResetTtlMinutes }}
      </p>
    </label>

    <label>
      {{ t('admin.settings.passwordReset.limitPer24h') }}
      <input :value="model.limitPer24h" type="number" min="1" max="100" step="1" data-testid="admin-settings-reset-limit" @input="updateNumber('limitPer24h', $event)" />
      <small>{{ t('admin.settings.passwordReset.limitHelp') }}</small>
      <p v-if="errors.passwordResetLimitPer24h" class="form-error admin-settings-field-error" data-testid="admin-settings-error">
        {{ errors.passwordResetLimitPer24h }}
      </p>
    </label>
  </AdminPanel>
</template>
