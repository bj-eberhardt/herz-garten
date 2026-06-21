<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AdminPanel from '@/admin/components/common/AdminPanel.vue';

defineProps<{
  modelValue: {
    ttlMinutes: number;
    limitPer24h: number;
  };
  errors: {
    passwordResetTtlMinutes: string;
    passwordResetLimitPer24h: string;
  };
}>();

const { t } = useI18n();
</script>

<template>
  <AdminPanel :title="t('admin.settings.passwordReset.title')" :intro="t('admin.settings.passwordReset.intro')" form test-id="admin-settings-password-reset-block" class="admin-settings-block">
    <label>
      {{ t('admin.settings.passwordReset.ttlMinutes') }}
      <input v-model.number="modelValue.ttlMinutes" type="number" min="15" max="1440" step="1" data-testid="admin-settings-reset-ttl" />
      <small>{{ t('admin.settings.passwordReset.ttlHelp') }}</small>
      <p v-if="errors.passwordResetTtlMinutes" class="form-error admin-settings-field-error" data-testid="admin-settings-error">
        {{ errors.passwordResetTtlMinutes }}
      </p>
    </label>

    <label>
      {{ t('admin.settings.passwordReset.limitPer24h') }}
      <input v-model.number="modelValue.limitPer24h" type="number" min="1" max="100" step="1" data-testid="admin-settings-reset-limit" />
      <small>{{ t('admin.settings.passwordReset.limitHelp') }}</small>
      <p v-if="errors.passwordResetLimitPer24h" class="form-error admin-settings-field-error" data-testid="admin-settings-error">
        {{ errors.passwordResetLimitPer24h }}
      </p>
    </label>
  </AdminPanel>
</template>
