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
  modelValue: LocalizedLabelModel;
  defaultLocale: LocaleOption | null;
  additionalLocales: LocaleOption[];
  valueTestId: string;
  sortOrderTestId: string;
  activeTestId: string;
  labelTestId: string;
  valueHelp: string;
  error?: string;
}>();

const { t } = useI18n();
</script>

<template>
  <label>
    {{ t('admin.common.technicalValue') }}
    <input v-model="modelValue.value" :disabled="Boolean(modelValue.id)" :data-testid="valueTestId" />
    <small>{{ valueHelp }}</small>
  </label>
  <label>{{ t('admin.common.sortOrder') }}<input v-model.number="modelValue.sortOrder" type="number" :data-testid="sortOrderTestId" /></label>
  <slot name="before-active"></slot>
  <label class="admin-checkbox">
    <input v-model="modelValue.active" type="checkbox" :data-testid="activeTestId" />
    {{ t('admin.common.active') }}
  </label>

  <fieldset v-if="defaultLocale" class="admin-translation-box admin-default-translation">
    <legend>
      {{ defaultLocale.label }} [{{ defaultLocale.locale }}]
      <span class="admin-required-badge">{{ t('admin.messages.standardSuffix') }}</span>
    </legend>
    <label>
      {{ t('admin.common.label') }}
      <input v-model="modelValue.translations[defaultLocale.locale].label" :data-testid="labelTestId" />
    </label>
  </fieldset>
  <AdminFieldError :message="error" test-id="admin-localized-label-error" />

  <AdminTranslationFields :locales="additionalLocales">
    <template #header>
      <h2>{{ t('admin.common.translations') }}</h2>
    </template>
    <template #default="{ locale }">
      <strong>{{ locale.locale }}</strong>
      <input v-model="modelValue.translations[locale.locale].label" :placeholder="t('admin.common.labelPlaceholder', { locale: locale.locale })" />
    </template>
  </AdminTranslationFields>
</template>
