<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { RouterView } from 'vue-router';
import { Bell } from '@lucide/vue';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import BottomNavigation from './BottomNavigation.vue';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

function loadNotificationsIfReady() {
  if (authStore.isAuthenticated && authStore.hasCouple) {
    notificationStore.loadNotifications();
  }
}

onMounted(loadNotificationsIfReady);
watch(() => authStore.couple?.id, loadNotificationsIfReady);
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
      <RouterLink v-if="authStore.hasCouple" to="/notifications" class="notification-link" aria-label="Benachrichtigungen">
        <Bell :size="18" aria-hidden="true" />
        <span v-if="notificationStore.unreadCount > 0" class="notification-badge">
          {{ notificationStore.unreadCount }}
        </span>
      </RouterLink>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <BottomNavigation />
  </div>
</template>
