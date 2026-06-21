import { computed, type Ref } from 'vue';

export interface AdminLocaleOption {
  locale: string;
  label: string;
  isDefault?: boolean;
  active?: boolean;
}

export type AdminTranslationRecord = Record<string, Record<string, string | undefined>>;

export function useAdminTranslations<T extends { translations: AdminTranslationRecord; label?: string }>(
  locales: Ref<AdminLocaleOption[]>,
  form: T,
) {
  const defaultLocale = computed(() => locales.value.find((locale) => locale.isDefault) ?? locales.value[0] ?? null);
  const additionalLocales = computed(() => locales.value.filter((locale) => locale.locale !== defaultLocale.value?.locale));

  function ensureTranslations() {
    form.translations ??= {};
    for (const locale of locales.value) {
      form.translations[locale.locale] ??= {};
    }
    if (defaultLocale.value && form.label && !form.translations[defaultLocale.value.locale].label) {
      form.translations[defaultLocale.value.locale].label = form.label;
    }
  }

  return {
    defaultLocale,
    additionalLocales,
    ensureTranslations,
  };
}
