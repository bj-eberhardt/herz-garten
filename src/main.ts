import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { i18n } from './i18n';
import { useAdminStore } from './admin/stores/adminStore';
import { useAuthStore } from './stores/authStore';
import './styles.css';

const pinia = createPinia();

window.addEventListener('herzgarten:session-expired', () => {
  const authStore = useAuthStore(pinia);
  authStore.expireSession();
  if (!router.currentRoute.value.path.startsWith('/admin')) {
    router.push('/onboarding');
  }
});

window.addEventListener('herzgarten:admin-session-expired', () => {
  const adminStore = useAdminStore(pinia);
  adminStore.logout();
  router.push('/admin/login');
});

createApp(App).use(pinia).use(router).use(i18n).mount('#app');
