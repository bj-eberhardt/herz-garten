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

const AdminShell = () => import('@/admin/components/AdminShell.vue');
const AdminAuditLogView = () => import('@/admin/views/AdminAuditLogView.vue');
const AdminCategoriesView = () => import('@/admin/views/AdminCategoriesView.vue');
const AdminContentView = () => import('@/admin/views/AdminContentView.vue');
const AdminCoupleDetailView = () => import('@/admin/views/AdminCoupleDetailView.vue');
const AdminCouplesView = () => import('@/admin/views/AdminCouplesView.vue');
const AdminDashboardView = () => import('@/admin/views/AdminDashboardView.vue');
const AdminGardenView = () => import('@/admin/views/AdminGardenView.vue');
const AdminLoginView = () => import('@/admin/views/AdminLoginView.vue');
const AdminMessageTemplatesView = () => import('@/admin/views/AdminMessageTemplatesView.vue');
const AdminTaxonomiesView = () => import('@/admin/views/AdminTaxonomiesView.vue');
const AdminUsersView = () => import('@/admin/views/AdminUsersView.vue');

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.fullPath !== from.fullPath) return { top: 0, left: 0 };
    return false;
  },
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
        { path: 'garden', name: 'adminGarden', component: AdminGardenView },
        { path: 'categories', name: 'adminCategories', component: AdminCategoriesView },
        { path: 'taxonomies', name: 'adminTaxonomies', component: AdminTaxonomiesView },
        { path: 'messages', name: 'adminMessages', component: AdminMessageTemplatesView },
        { path: 'audit-log', name: 'adminAuditLog', component: AdminAuditLogView },
      ],
    },
  ],
});

const allowedWithoutCouple = new Set(['/onboarding', '/notifications']);

router.beforeEach(async (to) => {
  if (to.path.startsWith('/admin')) {
    const { useAdminStore } = await import('@/admin/stores/adminStore');
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
