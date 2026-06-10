<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { LockKeyhole } from '@lucide/vue';
import { useAdminStore } from '@/admin/stores/adminStore';

const adminStore = useAdminStore();
const router = useRouter();
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
        <p class="eyebrow">Herzgarten</p>
        <h1>Admin</h1>
      </div>
      <label for="admin-password">Passwort</label>
      <input id="admin-password" v-model="password" autocomplete="current-password" type="password" data-testid="admin-password" />
      <p v-if="adminStore.error" class="form-error" data-testid="admin-login-error">{{ adminStore.error }}</p>
      <button class="primary-button" type="submit" :disabled="adminStore.loading" data-testid="admin-login-submit">
        <LockKeyhole :size="18" aria-hidden="true" />
        {{ adminStore.loading ? 'Prüfe...' : 'Login' }}
      </button>
    </form>
  </main>
</template>
