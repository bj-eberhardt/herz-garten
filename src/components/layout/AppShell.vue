<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { Bell, LogOut } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import BottomNavigation from './BottomNavigation.vue';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const router = useRouter();
const { t } = useI18n();

function loadNotificationsIfReady() {
  if (authStore.isAuthenticated) {
    notificationStore.loadNotifications();
  }
}

function logout() {
  authStore.logout();
  router.push('/onboarding');
}

onMounted(loadNotificationsIfReady);
watch(() => authStore.couple?.id, loadNotificationsIfReady);
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <RouterLink to="/today" class="brand" :aria-label="t('common.brandStart')" data-testid="nav-brand">
        <span class="brand-mark">H</span>
        <span>{{ t('common.appName') }}</span>
      </RouterLink>
      <div class="topbar-actions">
        <RouterLink to="/onboarding" class="invite-code" data-testid="header-couple-link">
          {{ authStore.couple?.inviteCode ?? (authStore.isAuthenticated ? t('nav.partnerCode') : t('nav.coupleRoom')) }}
        </RouterLink>
        <RouterLink v-if="authStore.isAuthenticated" to="/notifications" class="notification-link" :aria-label="t('nav.notifications')" data-testid="nav-notifications">
          <Bell :size="18" aria-hidden="true" />
          <span v-if="notificationStore.unreadCount > 0" class="notification-badge" data-testid="notification-badge">
            {{ notificationStore.unreadCount }}
          </span>
        </RouterLink>
        <button v-if="authStore.isAuthenticated" class="header-logout" type="button" :title="t('nav.logout')" data-testid="nav-logout" @click="logout">
          <LogOut :size="18" aria-hidden="true" />
          <span>{{ t('nav.logout') }}</span>
        </button>
      </div>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <BottomNavigation v-if="authStore.isAuthenticated" />
  </div>
</template>
