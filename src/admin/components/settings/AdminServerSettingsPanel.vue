<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AdminPanel from '@/admin/components/common/AdminPanel.vue';

interface ServerSettingsModel {
  publicBaseUrl: string;
}

defineProps<{
  error: string;
}>();

const model = defineModel<ServerSettingsModel>({ required: true });
const { t } = useI18n();

function updatePublicBaseUrl(event: Event) {
  model.value = {
    ...model.value,
    publicBaseUrl: (event.target as HTMLInputElement).value,
  };
}
</script>

<template>
  <AdminPanel :title="t('admin.settings.server.title')" :intro="t('admin.settings.server.intro')" form test-id="admin-settings-server-block" class="admin-settings-block">
    <label>
      {{ t('admin.settings.server.publicBaseUrl') }}
      <input :value="model.publicBaseUrl" data-testid="admin-settings-public-base-url" @input="updatePublicBaseUrl" />
      <small>{{ t('admin.settings.server.publicBaseUrlHelp') }}</small>
      <p v-if="error" class="form-error admin-settings-field-error" data-testid="admin-settings-error">{{ error }}</p>
    </label>
  </AdminPanel>
</template>
