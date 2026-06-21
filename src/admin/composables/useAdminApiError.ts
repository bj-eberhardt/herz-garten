import type { ComposerTranslation } from 'vue-i18n';
import { ApiError } from '@/services/api';

export function localizeAdminApiError(
  caught: unknown,
  t: ComposerTranslation,
  fallbackKey: string,
) {
  if (caught instanceof ApiError && caught.errorKey) {
    const key = `admin.serverErrors.${caught.errorKey}`;
    const translated = t(key, caught.params ?? {});
    if (translated !== key) return translated;
  }

  return t(fallbackKey);
}
