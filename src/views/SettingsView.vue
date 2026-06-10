<script setup lang="ts">
import { ref } from 'vue';
import { ShieldCheck } from '@lucide/vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/authStore';
import { localizeApiError } from '@/services/errorMessages';

const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();
const message = ref('');
const error = ref('');

async function exportData() {
  error.value = '';
  message.value = '';
  try {
    const data = await authStore.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `herzgarten-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    message.value = t('settings.exportCreated');
  } catch (caught) {
    error.value = localizeApiError(caught, 'errors.fallback.export');
  }
}

async function leaveCouple() {
  error.value = '';
  message.value = '';
  if (!window.confirm(t('settings.confirmLeave'))) return;
  try {
    await authStore.leaveCouple();
    await router.push('/onboarding');
  } catch (caught) {
    error.value = localizeApiError(caught, 'errors.fallback.leaveCouple');
  }
}

async function deleteAccount() {
  error.value = '';
  message.value = '';
  if (!window.confirm(t('settings.confirmDelete'))) return;
  try {
    await authStore.deleteAccount();
    await router.push('/onboarding');
  } catch (caught) {
    error.value = localizeApiError(caught, 'errors.fallback.deleteAccount');
  }
}
</script>

<template>
  <div class="view-grid">
    <section>
      <p class="eyebrow">{{ t('settings.eyebrow') }}</p>
      <h1>{{ t('settings.title') }}</h1>
    </section>

    <section class="panel settings-list">
      <p><strong>{{ t('settings.user') }}</strong> {{ authStore.user?.displayName }}</p>
      <p><strong>{{ t('settings.email') }}</strong> {{ authStore.user?.email }}</p>
      <p><strong>{{ t('settings.coupleCode') }}</strong> {{ authStore.couple?.inviteCode }}</p>
      <p><strong>{{ t('settings.relationshipMode') }}</strong> {{ authStore.couple?.relationshipType }}</p>
      <p><strong>{{ t('settings.contentStyle') }}</strong> {{ authStore.couple?.contentPreference }}</p>
      <p class="privacy-note"><ShieldCheck :size="18" /> {{ t('settings.privacyNote') }}</p>
      <p v-if="message" class="success-note">{{ message }}</p>
      <p v-if="error" class="form-error">{{ error }}</p>

      <div class="settings-actions">
        <button class="secondary-button" type="button" data-testid="settings-export" @click="exportData">{{ t('settings.exportData') }}</button>
        <button class="secondary-button" type="button" data-testid="settings-logout" @click="authStore.logout()">{{ t('settings.logout') }}</button>
        <button class="secondary-button" type="button" data-testid="settings-leave-couple" @click="leaveCouple">{{ t('settings.leaveCouple') }}</button>
        <button class="danger-button" type="button" data-testid="settings-delete-account" @click="deleteAccount">{{ t('settings.deleteAccount') }}</button>
      </div>
    </section>
  </div>
</template>
