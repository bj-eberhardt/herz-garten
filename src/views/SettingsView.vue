<script setup lang="ts">
import { ShieldCheck } from '@lucide/vue';
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();
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
      <button class="secondary-button inline-button" type="button" @click="authStore.logout()">Ausloggen</button>
    </section>
  </div>
</template>
