import { defineStore } from 'pinia';
import { adminApiRequest, clearAdminToken, getAdminToken, setAdminToken } from '@/admin/services/adminApi';
import { translate } from '@/i18n';

interface AdminMePayload {
  admin: boolean;
  usesDefaultAdminPassword: boolean;
}

interface AdminLoginPayload {
  token: string;
  usesDefaultAdminPassword: boolean;
}

export const useAdminStore = defineStore('admin', {
  state: () => ({
    bootstrapped: false,
    isAuthenticated: false,
    usesDefaultAdminPassword: false,
    loading: false,
    error: '',
  }),
  actions: {
    async bootstrap() {
      if (this.bootstrapped) return;
      const token = getAdminToken();
      if (!token) {
        this.bootstrapped = true;
        return;
      }

      try {
        const payload = await adminApiRequest<AdminMePayload>('/api/admin/auth/me');
        this.isAuthenticated = payload.admin;
        this.usesDefaultAdminPassword = payload.usesDefaultAdminPassword;
      } catch {
        clearAdminToken();
        this.isAuthenticated = false;
      } finally {
        this.bootstrapped = true;
      }
    },
    async login(password: string) {
      this.loading = true;
      this.error = '';
      try {
        const payload = await adminApiRequest<AdminLoginPayload>('/api/admin/auth/login', {
          method: 'POST',
          body: JSON.stringify({ password }),
        });
        setAdminToken(payload.token);
        this.isAuthenticated = true;
        this.usesDefaultAdminPassword = payload.usesDefaultAdminPassword;
        this.bootstrapped = true;
      } catch {
        this.error = translate('admin.auth.invalidPassword');
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },
    logout() {
      clearAdminToken();
      this.isAuthenticated = false;
      this.bootstrapped = true;
    },
  },
});
