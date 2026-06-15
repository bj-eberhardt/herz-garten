<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { LockKeyhole } from '@lucide/vue';
import { useAdminStore } from '@/admin/stores/adminStore';
import '@/admin/admin.css';

const adminStore = useAdminStore();
const router = useRouter();
const { t } = useI18n();
const password = ref('');

async function submit() {
  try {
    await adminStore.login(password.value);
    router.push('/admin');
  } catch {
    password.value = '';
  }
}
</script>

<template>
  <main class="admin-login">
    <form class="admin-login-panel" data-testid="admin-login-form" @submit.prevent="submit">
      <div>
        <p class="eyebrow">{{ t('admin.auth.brand') }}</p>
        <h1>{{ t('admin.shell.brand') }}</h1>
      </div>
      <label for="admin-password">{{ t('admin.auth.password') }}</label>
      <input id="admin-password" v-model="password" autocomplete="current-password" type="password" data-testid="admin-password" />
      <p v-if="adminStore.error" class="form-error" data-testid="admin-login-error">{{ adminStore.error }}</p>
      <button class="primary-button" type="submit" :disabled="adminStore.loading" data-testid="admin-login-submit">
        <LockKeyhole :size="18" aria-hidden="true" />
        {{ adminStore.loading ? t('admin.auth.checking') : t('admin.auth.login') }}
      </button>
    </form>
  </main>
</template>
