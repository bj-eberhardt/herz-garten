import { defineStore } from 'pinia';
import { SESSION_EXPIRED_MESSAGE_KEY, apiRequest, clearToken, getToken, setToken } from '@/services/api';
import { localizeApiError } from '@/services/errorMessages';
import type {
  ContentPreference,
  Couple,
  FeatureExplainerKey,
  PushNotificationMode,
  RelationshipType,
  UserPreferences,
} from '@/types/domain';

export const featureExplainerKeys: FeatureExplainerKey[] = [
  'onboarding',
  'today',
  'quests',
  'garden',
  'knowMe',
  'loveJar',
  'memories',
  'notifications',
  'settings',
];

const defaultPreferences: UserPreferences = {
  featureExplainers: Object.fromEntries(featureExplainerKeys.map((key) => [key, true])) as UserPreferences['featureExplainers'],
  pushNotificationMode: 'all',
};

function consumeSessionExpiredMessage() {
  if (sessionStorage.getItem(SESSION_EXPIRED_MESSAGE_KEY) !== '1') return '';
  sessionStorage.removeItem(SESSION_EXPIRED_MESSAGE_KEY);
  return 'auth.sessionExpired';
}

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  preferences?: UserPreferences;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface PreferenceOption {
  value: string;
  label: string;
  active?: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getToken(),
    user: null as AuthUser | null,
    couple: null as (Couple & { memberCount?: number }) | null,
    relationshipModes: [] as PreferenceOption[],
    contentStyles: [] as PreferenceOption[],
    passwordResetEmailEnabled: false,
    loading: false,
    error: '',
    sessionExpiredMessageKey: consumeSessionExpiredMessage(),
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token && state.user),
    hasCouple: (state) => Boolean(state.couple),
    hasCompleteCouple: (state) => Boolean(state.couple && (state.couple.memberCount ?? 0) >= 2),
    pushNotificationMode: (state): PushNotificationMode => state.user?.preferences?.pushNotificationMode ?? 'all',
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
    async loadPreferenceOptions() {
      const result = await apiRequest<{ relationshipModes: PreferenceOption[]; contentStyles: PreferenceOption[] }>('/api/config/preferences');
      this.relationshipModes = result.relationshipModes;
      this.contentStyles = result.contentStyles;
    },
    async loadPublicConfig() {
      const result = await apiRequest<{ features?: { passwordResetEmailEnabled?: boolean } }>('/api/config');
      this.passwordResetEmailEnabled = Boolean(result.features?.passwordResetEmailEnabled);
    },
    async register(displayName: string, email: string, password: string) {
      await this.authenticate('/api/auth/register', { displayName, email, password });
    },
    async login(email: string, password: string) {
      await this.authenticate('/api/auth/login', { email, password });
    },
    async forgotPassword(email: string) {
      await apiRequest<{ ok: boolean }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },
    async resetPassword(token: string, password: string) {
      await apiRequest<{ ok: boolean }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
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
        this.sessionExpiredMessageKey = '';
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
    showFeatureExplainer(key: FeatureExplainerKey) {
      return this.user?.preferences?.featureExplainers?.[key] ?? true;
    },
    async setFeatureExplainerVisible(key: FeatureExplainerKey, visible: boolean) {
      if (!this.user) return;
      const currentPreferences = this.user.preferences ?? defaultPreferences;
      const preferences: UserPreferences = {
        ...defaultPreferences,
        ...currentPreferences,
        featureExplainers: {
          ...defaultPreferences.featureExplainers,
          ...currentPreferences.featureExplainers,
          [key]: visible,
        },
      };
      this.user = { ...this.user, preferences };
      const result = await apiRequest<{ user: AuthUser; couple: (Couple & { memberCount?: number }) | null }>('/api/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ preferences }),
      });
      this.user = result.user;
      this.couple = result.couple;
    },
    async setPushNotificationMode(mode: PushNotificationMode) {
      if (!this.user) return;
      const currentPreferences = this.user.preferences ?? defaultPreferences;
      const preferences: UserPreferences = {
        ...defaultPreferences,
        ...currentPreferences,
        featureExplainers: {
          ...defaultPreferences.featureExplainers,
          ...currentPreferences.featureExplainers,
        },
        pushNotificationMode: mode,
      };
      this.user = { ...this.user, preferences };
      const result = await apiRequest<{ user: AuthUser; couple: (Couple & { memberCount?: number }) | null }>('/api/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ preferences }),
      });
      this.user = result.user;
      this.couple = result.couple;
    },
    async updateProfile(profile: { email?: string; displayName?: string }) {
      const result = await apiRequest<{ user: AuthUser; couple: (Couple & { memberCount?: number }) | null }>('/api/me/profile', {
        method: 'PATCH',
        body: JSON.stringify(profile),
      });
      this.user = result.user;
      this.couple = result.couple;
    },
    async updatePassword(passwords: { currentPassword: string; newPassword: string }) {
      await apiRequest<void>('/api/me/password', {
        method: 'PATCH',
        body: JSON.stringify(passwords),
      });
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
      this.sessionExpiredMessageKey = '';
    },
    expireSession() {
      clearToken();
      this.token = null;
      this.user = null;
      this.couple = null;
      this.sessionExpiredMessageKey = 'auth.sessionExpired';
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
