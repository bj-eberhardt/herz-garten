import { defineStore } from 'pinia';
import { apiRequest, clearToken, getToken, setToken } from '@/services/api';
import { localizeApiError } from '@/services/errorMessages';
import type { ContentPreference, Couple, RelationshipType } from '@/types/domain';

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getToken(),
    user: null as AuthUser | null,
    couple: null as (Couple & { memberCount?: number }) | null,
    loading: false,
    error: '',
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token && state.user),
    hasCouple: (state) => Boolean(state.couple),
  },
  actions: {
    async bootstrap() {
      if (!this.token || this.user) return;
      await this.refreshMe();
    },
    async refreshMe() {
      if (!this.token) return;
      this.loading = true;
      this.error = '';
      try {
        const result = await apiRequest<{ user: AuthUser; couple: (Couple & { memberCount?: number }) | null }>('/api/me');
        this.user = result.user;
        this.couple = result.couple;
      } catch (error) {
        clearToken();
        this.token = null;
        this.user = null;
        this.couple = null;
      } finally {
        this.loading = false;
      }
    },
    async register(displayName: string, email: string, password: string) {
      await this.authenticate('/api/auth/register', { displayName, email, password });
    },
    async login(email: string, password: string) {
      await this.authenticate('/api/auth/login', { email, password });
    },
    async authenticate(path: string, body: unknown) {
      this.loading = true;
      this.error = '';
      try {
        const result = await apiRequest<AuthResponse>(path, {
          method: 'POST',
          body: JSON.stringify(body),
        });
        setToken(result.token);
        this.token = result.token;
        this.user = result.user;
        await this.refreshMe();
      } catch (error) {
        this.error = localizeApiError(error, 'errors.fallback.auth');
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async createCouple(options: {
      relationshipType: RelationshipType;
      contentPreference: ContentPreference;
    }) {
      const result = await apiRequest<{ couple: Couple & { memberCount: number } }>('/api/couples', {
        method: 'POST',
        body: JSON.stringify(options),
      });
      this.couple = result.couple;
    },
    async joinCouple(inviteCode: string) {
      const result = await apiRequest<{ couple: Couple & { memberCount: number } }>('/api/couples/join', {
        method: 'POST',
        body: JSON.stringify({ inviteCode }),
      });
      this.couple = result.couple;
    },
    logout() {
      clearToken();
      this.token = null;
      this.user = null;
      this.couple = null;
    },
    async leaveCouple() {
      const result = await apiRequest<{ user: AuthUser; couple: null }>('/api/couples/leave', {
        method: 'POST',
      });
      this.user = result.user;
      this.couple = result.couple;
    },
    async exportData() {
      return apiRequest<Record<string, unknown>>('/api/me/export');
    },
    async deleteAccount() {
      await apiRequest<void>('/api/me', {
        method: 'DELETE',
      });
      this.logout();
    },
  },
});
