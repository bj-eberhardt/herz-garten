import { createRouter, createWebHistory } from 'vue-router';
import GardenView from '@/views/GardenView.vue';
import TodayView from '@/views/TodayView.vue';
import QuestsView from '@/views/QuestsView.vue';
import LoveJarView from '@/views/LoveJarView.vue';
import KnowMeView from '@/views/KnowMeView.vue';
import MemoriesView from '@/views/MemoriesView.vue';
import SettingsView from '@/views/SettingsView.vue';
import NotificationsView from '@/views/NotificationsView.vue';
import OnboardingView from '@/views/OnboardingView.vue';
import { useAuthStore } from '@/stores/authStore';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/today' },
    { path: '/onboarding', name: 'onboarding', component: OnboardingView },
    { path: '/garden', name: 'garden', component: GardenView },
    { path: '/today', name: 'today', component: TodayView },
    { path: '/quests', name: 'quests', component: QuestsView },
    { path: '/know-me', name: 'knowMe', component: KnowMeView },
    { path: '/love-jar', name: 'loveJar', component: LoveJarView },
    { path: '/memories', name: 'memories', component: MemoriesView },
    { path: '/notifications', name: 'notifications', component: NotificationsView },
    { path: '/settings', name: 'settings', component: SettingsView },
  ],
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  await authStore.bootstrap();

  if (to.path !== '/onboarding' && !authStore.isAuthenticated) {
    return '/onboarding';
  }

  if (to.path !== '/onboarding' && !authStore.hasCouple) {
    return '/onboarding';
  }

  if (to.path === '/onboarding' && authStore.isAuthenticated && authStore.hasCouple) {
    return '/today';
  }

  return true;
});

export default router;
