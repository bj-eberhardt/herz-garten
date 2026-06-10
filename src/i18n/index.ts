import { createI18n } from 'vue-i18n';
import de from './locales/de.json';

export const messages = {
  de,
};

export type Locale = keyof typeof messages;
export type MessageSchema = typeof de;

export const i18n = createI18n<[MessageSchema], Locale>({
  legacy: false,
  locale: 'de',
  fallbackLocale: 'de',
  messages,
  datetimeFormats: {
    de: {
      long: {
        dateStyle: 'long',
      },
    },
  },
});

export function translate(key: string, params?: Record<string, unknown>) {
  return i18n.global.t(key, params ?? {});
}

export function translateChoice(key: string, choice: number, params?: Record<string, unknown>) {
  return i18n.global.t(key, choice, { named: { count: choice, n: choice, ...(params ?? {}) } });
}
