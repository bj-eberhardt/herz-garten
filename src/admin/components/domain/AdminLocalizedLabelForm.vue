<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AdminFieldError from '@/admin/components/common/AdminFieldError.vue';
import AdminTranslationFields from '@/admin/components/common/AdminTranslationFields.vue';

interface LocaleOption {
  locale: string;
  label: string;
  isDefault?: boolean;
}

interface LocalizedLabelModel {
  id?: string;
  value: string;
  active: boolean;
  sortOrder: number;
  translations: Record<string, Record<string, string | undefined>>;
}

defineProps<{
  defaultLocale: LocaleOption | null;
  additionalLocales: LocaleOption[];
  valueTestId: string;
  sortOrderTestId: string;
  activeTestId: string;
  labelTestId: string;
  valueHelp: string;
  error?: string;
}>();

const model = defineModel<LocalizedLabelModel>({ required: true });
const { t } = useI18n();

function updateString(field: 'value', event: Event) {
  model.value = {
    ...model.value,
    [field]: (event.target as HTMLInputElement).value,
  };
}

function updateNumber(field: 'sortOrder', event: Event) {
  const value = (event.target as HTMLInputElement).valueAsNumber;
  model.value = {
    ...model.value,
    [field]: Number.isNaN(value) ? 0 : value,
  };
}

function updateBoolean(field: 'active', event: Event) {
  model.value = {
    ...model.value,
    [field]: (event.target as HTMLInputElement).checked,
  };
}

function updateTranslation(locale: string, field: string, event: Event) {
  model.value = {
    ...model.value,
    translations: {
      ...model.value.translations,
      [locale]: {
        ...(model.value.translations[locale] ?? {}),
        [field]: (event.target as HTMLInputElement).value,
      },
    },
  };
}
</script>

<template>
  <label>
    {{ t('admin.common.technicalValue') }}
    <input :value="model.value" :disabled="Boolean(model.id)" :data-testid="valueTestId" @input="updateString('value', $event)" />
    <small>{{ valueHelp }}</small>
  </label>
  <label>{{ t('admin.common.sortOrder') }}<input :value="model.sortOrder" type="number" :data-testid="sortOrderTestId" @input="updateNumber('sortOrder', $event)" /></label>
  <slot name="before-active"></slot>
  <label class="admin-checkbox">
    <input :checked="model.active" type="checkbox" :data-testid="activeTestId" @change="updateBoolean('active', $event)" />
    {{ t('admin.common.active') }}
  </label>

  <fieldset v-if="defaultLocale" class="admin-translation-box admin-default-translation">
    <legend>
      {{ defaultLocale.label }} [{{ defaultLocale.locale }}]
      <span class="admin-required-badge">{{ t('admin.messages.standardSuffix') }}</span>
    </legend>
    <label>
      {{ t('admin.common.label') }}
      <input :value="model.translations[defaultLocale.locale]?.label" :data-testid="labelTestId" @input="updateTranslation(defaultLocale.locale, 'label', $event)" />
    </label>
  </fieldset>
  <AdminFieldError :message="error" test-id="admin-localized-label-error" />

  <AdminTranslationFields :locales="additionalLocales">
    <template #header>
      <h2>{{ t('admin.common.translations') }}</h2>
    </template>
    <template #default="{ locale }">
      <strong>{{ locale.locale }}</strong>
      <input :value="model.translations[locale.locale]?.label" :placeholder="t('admin.common.labelPlaceholder', { locale: locale.locale })" @input="updateTranslation(locale.locale, 'label', $event)" />
    </template>
  </AdminTranslationFields>
</template>
