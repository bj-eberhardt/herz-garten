import { defineStore } from 'pinia';
import {
  browserPushPermission,
  disableBrowserPush,
  enableBrowserPush,
  loadPushStatus,
  sendBrowserPushTest,
  type BrowserPushPermission,
} from '@/services/pushNotifications';
import { localizeApiError } from '@/services/errorMessages';

function pushErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message === 'push.unsupported') return 'Dieser Browser unterstuetzt Browser-Push nicht.';
    if (error.message === 'push.disabled') return 'Browser-Push ist auf dem Server noch nicht konfiguriert.';
    if (error.message === 'push.denied') return 'Browser-Push wurde im Browser blockiert.';
    if (error.message === 'push.dismissed') return 'Browser-Push wurde nicht aktiviert.';
  }

  return localizeApiError(error, 'errors.fallback.notificationsLoad');
}

export const usePushStore = defineStore('push', {
  state: () => ({
    supported: typeof window !== 'undefined' ? browserPushPermission() !== 'unsupported' : false,
    permission: (typeof window !== 'undefined' ? browserPushPermission() : 'unsupported') as BrowserPushPermission,
    serverEnabled: false,
    publicKey: '',
    active: false,
    loading: false,
    saving: false,
    testing: false,
    error: '',
    message: '',
  }),
  getters: {
    canPrompt: (state) => state.supported && state.serverEnabled && state.permission !== 'denied',
    shouldShowOptInHint: (state) => state.supported && state.serverEnabled && state.permission !== 'denied' && !state.active,
    statusKey: (state) => {
      if (!state.supported) return 'unsupported';
      if (!state.serverEnabled) return 'serverDisabled';
      if (state.permission === 'denied') return 'blocked';
      if (state.active) return 'active';
      return 'inactive';
    },
  },
  actions: {
    applyStatus(status: Awaited<ReturnType<typeof loadPushStatus>>) {
      this.supported = status.supported;
      this.permission = status.permission;
      this.serverEnabled = status.enabled;
      this.publicKey = status.publicKey;
      this.active = status.active;
    },
    async loadStatus() {
      this.loading = true;
      this.error = '';
      try {
        this.applyStatus(await loadPushStatus());
      } catch (error) {
        this.permission = browserPushPermission();
        this.error = pushErrorMessage(error);
      } finally {
        this.loading = false;
      }
    },
    async enable() {
      this.saving = true;
      this.error = '';
      this.message = '';
      try {
        this.applyStatus(await enableBrowserPush());
        this.message = 'Browser-Push wurde aktiviert.';
      } catch (error) {
        this.permission = browserPushPermission();
        this.error = pushErrorMessage(error);
      } finally {
        this.saving = false;
      }
    },
    async disable() {
      this.saving = true;
      this.error = '';
      this.message = '';
      try {
        this.applyStatus(await disableBrowserPush());
        this.message = 'Browser-Push wurde deaktiviert.';
      } catch (error) {
        this.permission = browserPushPermission();
        this.error = pushErrorMessage(error);
      } finally {
        this.saving = false;
      }
    },
    async sendTest() {
      this.testing = true;
      this.error = '';
      this.message = '';
      try {
        await sendBrowserPushTest();
        this.message = 'Test-Push wurde gesendet.';
      } catch (error) {
        this.error = pushErrorMessage(error);
      } finally {
        this.testing = false;
      }
    },
  },
});
