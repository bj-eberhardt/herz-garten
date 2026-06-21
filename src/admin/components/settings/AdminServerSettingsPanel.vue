<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AdminPanel from '@/admin/components/common/AdminPanel.vue';

defineProps<{
  modelValue: { publicBaseUrl: string };
  error: string;
}>();

const { t } = useI18n();
</script>

<template>
  <AdminPanel :title="t('admin.settings.server.title')" :intro="t('admin.settings.server.intro')" form test-id="admin-settings-server-block" class="admin-settings-block">
    <label>
      {{ t('admin.settings.server.publicBaseUrl') }}
      <input v-model="modelValue.publicBaseUrl" data-testid="admin-settings-public-base-url" />
      <small>{{ t('admin.settings.server.publicBaseUrlHelp') }}</small>
      <p v-if="error" class="form-error admin-settings-field-error" data-testid="admin-settings-error">{{ error }}</p>
    </label>
  </AdminPanel>
</template>
