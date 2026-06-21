<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AdminPanel from '@/admin/components/common/AdminPanel.vue';

interface AuthSettingsModel {
  adminJwtTtlMinutes: number;
  userJwtTtlMinutes: number;
}

defineProps<{
  errors: {
    adminJwtTtlMinutes: string;
    userJwtTtlMinutes: string;
  };
}>();

const model = defineModel<AuthSettingsModel>({ required: true });
const { t } = useI18n();

function updateNumber(field: keyof AuthSettingsModel, event: Event) {
  const value = (event.target as HTMLInputElement).valueAsNumber;
  model.value = {
    ...model.value,
    [field]: Number.isNaN(value) ? 0 : value,
  };
}
</script>

<template>
  <AdminPanel :title="t('admin.settings.jwt.title')" :intro="t('admin.settings.jwt.intro')" form test-id="admin-settings-jwt-block" class="admin-settings-block">
    <label>
      {{ t('admin.settings.adminJwtTtlMinutes') }}
      <input :value="model.adminJwtTtlMinutes" type="number" min="1" max="1440" step="1" data-testid="admin-settings-admin-jwt-ttl" @input="updateNumber('adminJwtTtlMinutes', $event)" />
      <small>{{ t('admin.settings.adminJwtTtlHelp') }}</small>
      <p v-if="errors.adminJwtTtlMinutes" class="form-error admin-settings-field-error" data-testid="admin-settings-error">
        {{ errors.adminJwtTtlMinutes }}
      </p>
    </label>

    <label>
      {{ t('admin.settings.userJwtTtlMinutes') }}
      <input :value="model.userJwtTtlMinutes" type="number" min="1" max="43200" step="1" data-testid="admin-settings-user-jwt-ttl" @input="updateNumber('userJwtTtlMinutes', $event)" />
      <small>{{ t('admin.settings.userJwtTtlHelp') }}</small>
      <p v-if="errors.userJwtTtlMinutes" class="form-error admin-settings-field-error" data-testid="admin-settings-error">
        {{ errors.userJwtTtlMinutes }}
      </p>
    </label>
  </AdminPanel>
</template>
