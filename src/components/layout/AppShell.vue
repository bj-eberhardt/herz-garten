<script setup lang="ts">
import { RouterView } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import BottomNavigation from './BottomNavigation.vue';

const authStore = useAuthStore();
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <RouterLink to="/today" class="brand" aria-label="Herzgarten Start">
        <span class="brand-mark">H</span>
        <span>Herzgarten</span>
      </RouterLink>
      <RouterLink to="/onboarding" class="invite-code">
        {{ authStore.couple?.inviteCode ?? (authStore.isAuthenticated ? 'Partnercode eingeben' : 'Paarraum') }}
      </RouterLink>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <BottomNavigation />
  </div>
</template>
