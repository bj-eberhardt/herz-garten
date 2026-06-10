import { i18n } from '@/i18n';
import { ApiError } from './api';

function t(key: string, params?: Record<string, unknown>) {
  return i18n.global.t(key, params ?? {});
}

export function localizeApiError(error: unknown, fallbackKey = 'errors.common.unexpected') {
  if (error instanceof ApiError) {
    if (error.errorKey) {
      const key = `errors.${error.errorKey}`;
      const translated = t(key, error.params);
      if (translated !== key) return translated;
    }
    if (error.serverMessage) return error.serverMessage;
  }

  if (error instanceof TypeError) {
    return t('errors.common.network');
  }

  const fallback = t(fallbackKey);
  return fallback === fallbackKey ? t('errors.common.unexpected') : fallback;
}
