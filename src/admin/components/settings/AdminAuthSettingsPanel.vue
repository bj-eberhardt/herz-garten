<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AdminPanel from '@/admin/components/common/AdminPanel.vue';

defineProps<{
  modelValue: {
    adminJwtTtlMinutes: number;
    userJwtTtlMinutes: number;
  };
  errors: {
    adminJwtTtlMinutes: string;
    userJwtTtlMinutes: string;
  };
}>();

const { t } = useI18n();
</script>

<template>
  <AdminPanel :title="t('admin.settings.jwt.title')" :intro="t('admin.settings.jwt.intro')" form test-id="admin-settings-jwt-block" class="admin-settings-block">
    <label>
      {{ t('admin.settings.adminJwtTtlMinutes') }}
      <input v-model.number="modelValue.adminJwtTtlMinutes" type="number" min="1" max="1440" step="1" data-testid="admin-settings-admin-jwt-ttl" />
      <small>{{ t('admin.settings.adminJwtTtlHelp') }}</small>
      <p v-if="errors.adminJwtTtlMinutes" class="form-error admin-settings-field-error" data-testid="admin-settings-error">
        {{ errors.adminJwtTtlMinutes }}
      </p>
    </label>

    <label>
      {{ t('admin.settings.userJwtTtlMinutes') }}
      <input v-model.number="modelValue.userJwtTtlMinutes" type="number" min="1" max="43200" step="1" data-testid="admin-settings-user-jwt-ttl" />
      <small>{{ t('admin.settings.userJwtTtlHelp') }}</small>
      <p v-if="errors.userJwtTtlMinutes" class="form-error admin-settings-field-error" data-testid="admin-settings-error">
        {{ errors.userJwtTtlMinutes }}
      </p>
    </label>
  </AdminPanel>
</template>
