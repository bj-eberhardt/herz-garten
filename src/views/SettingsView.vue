<script setup lang="ts">
import { ref } from 'vue';
import { ShieldCheck } from '@lucide/vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const authStore = useAuthStore();
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
    message.value = 'Export wurde erstellt.';
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Export fehlgeschlagen';
  }
}

async function leaveCouple() {
  error.value = '';
  message.value = '';
  if (!window.confirm('Paarraum wirklich verlassen?')) return;
  try {
    await authStore.leaveCouple();
    await router.push('/onboarding');
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Paarraum konnte nicht verlassen werden';
  }
}

async function deleteAccount() {
  error.value = '';
  message.value = '';
  if (!window.confirm('Konto wirklich dauerhaft loeschen?')) return;
  try {
    await authStore.deleteAccount();
    await router.push('/onboarding');
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Konto konnte nicht geloescht werden';
  }
}
</script>

<template>
  <div class="view-grid">
    <section>
      <p class="eyebrow">Profil</p>
      <h1>Paarraum und Datenschutz.</h1>
    </section>

    <section class="panel settings-list">
      <p><strong>Nutzer:</strong> {{ authStore.user?.displayName }}</p>
      <p><strong>E-Mail:</strong> {{ authStore.user?.email }}</p>
      <p><strong>Paar-Code:</strong> {{ authStore.couple?.inviteCode }}</p>
      <p><strong>Beziehungsmodus:</strong> {{ authStore.couple?.relationshipType }}</p>
      <p><strong>Content-Stil:</strong> {{ authStore.couple?.contentPreference }}</p>
      <p class="privacy-note"><ShieldCheck :size="18" /> Keine oeffentlichen Profile. Kein Beziehungsscore.</p>
      <p v-if="message" class="success-note">{{ message }}</p>
      <p v-if="error" class="form-error">{{ error }}</p>

      <div class="settings-actions">
        <button class="secondary-button" type="button" @click="exportData">Daten exportieren</button>
        <button class="secondary-button" type="button" @click="authStore.logout()">Ausloggen</button>
        <button class="secondary-button" type="button" @click="leaveCouple">Paarraum verlassen</button>
        <button class="danger-button" type="button" @click="deleteAccount">Konto loeschen</button>
      </div>
    </section>
  </div>
</template>
