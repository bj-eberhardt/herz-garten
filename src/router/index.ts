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
import AdminShell from '@/components/admin/AdminShell.vue';
import AdminAuditLogView from '@/views/admin/AdminAuditLogView.vue';
import AdminContentView from '@/views/admin/AdminContentView.vue';
import AdminCoupleDetailView from '@/views/admin/AdminCoupleDetailView.vue';
import AdminCouplesView from '@/views/admin/AdminCouplesView.vue';
import AdminDashboardView from '@/views/admin/AdminDashboardView.vue';
import AdminLoginView from '@/views/admin/AdminLoginView.vue';
import AdminUsersView from '@/views/admin/AdminUsersView.vue';
import { useAdminStore } from '@/stores/adminStore';

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
    { path: '/admin/login', name: 'adminLogin', component: AdminLoginView },
    {
      path: '/admin',
      component: AdminShell,
      children: [
        { path: '', name: 'adminDashboard', component: AdminDashboardView },
        { path: 'users', name: 'adminUsers', component: AdminUsersView },
        { path: 'couples', name: 'adminCouples', component: AdminCouplesView },
        { path: 'couples/:id', name: 'adminCoupleDetail', component: AdminCoupleDetailView },
        { path: 'content', name: 'adminContent', component: AdminContentView },
        { path: 'audit-log', name: 'adminAuditLog', component: AdminAuditLogView },
      ],
    },
  ],
});

const allowedWithoutCouple = new Set(['/onboarding', '/notifications']);

router.beforeEach(async (to) => {
  if (to.path.startsWith('/admin')) {
    const adminStore = useAdminStore();
    await adminStore.bootstrap();

    if (to.path !== '/admin/login' && !adminStore.isAuthenticated) {
      return '/admin/login';
    }

    if (to.path === '/admin/login' && adminStore.isAuthenticated) {
      return '/admin';
    }

    return true;
  }

  const authStore = useAuthStore();
  await authStore.bootstrap();

  if (to.path !== '/onboarding' && !authStore.isAuthenticated) {
    return '/onboarding';
  }

  if (!allowedWithoutCouple.has(to.path) && !authStore.hasCouple) {
    return '/onboarding';
  }

  if (to.path === '/onboarding' && authStore.isAuthenticated && authStore.hasCouple) {
    return '/today';
  }

  return true;
});

export default router;
