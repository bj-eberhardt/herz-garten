<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus, RotateCcw, Save, Trash2 } from '@lucide/vue';
import { adminApiRequest } from '@/admin/services/adminApi';

type ContentType = 'daily-questions' | 'quests' | 'know-me-catalog' | 'love-jar-templates';
type ActiveFilter = 'all' | 'true' | 'false';

interface LocaleOption {
  locale: string;
  label: string;
  isDefault: boolean;
}

interface CategoryItem {
  id: string;
  contentType: ContentType;
  value: string;
  label: string;
  active: boolean;
}

interface ContentItem {
  id?: string;
  text?: string;
  title?: string;
  description?: string;
  questionText?: string;
  category?: string;
  depthLevel?: number;
  longDistanceSuitable?: boolean;
  estimatedMinutes?: number;
  effortLevel?: string;
  rewardPoints?: number;
  rewardSeedType?: string;
  requiresBothPartners?: boolean;
  sortOrder?: number;
  active: boolean;
  translations: Record<string, Record<string, string>>;
}

const { t } = useI18n();

const contentTypes = computed<Array<{ id: ContentType; label: string }>>(() => [
  { id: 'daily-questions', label: t('admin.content.labels.dailyQuestions') },
  { id: 'quests', label: t('admin.content.labels.quests') },
  { id: 'know-me-catalog', label: t('admin.content.labels.knowMe') },
  { id: 'love-jar-templates', label: t('admin.content.labels.loveJar') },
]);

const selectedType = ref<ContentType>('daily-questions');
const activeFilter = ref<ActiveFilter>('all');
const search = ref('');
const categoryFilter = ref('');
const locales = ref<LocaleOption[]>([]);
const categories = ref<CategoryItem[]>([]);
const items = ref<ContentItem[]>([]);
const loading = ref(false);
const saving = ref(false);
const showForm = ref(false);
const formAnchor = ref<HTMLElement | null>(null);
const errors = ref<Record<string, string>>({});
const form = reactive<ContentItem>(emptyForm('daily-questions'));

const currentTypeLabel = computed(() => contentTypes.value.find((type) => type.id === selectedType.value)?.label ?? '');
const currentCategories = computed(() => categories.value.filter((category) => category.contentType === selectedType.value && category.active));
const defaultLocale = computed(() => locales.value.find((locale) => locale.isDefault) ?? locales.value[0] ?? null);
const additionalLocales = computed(() => locales.value.filter((locale) => locale.locale !== defaultLocale.value?.locale));
const defaultLanguageHint = computed(() =>
  defaultLocale.value
    ? t('admin.content.defaultLanguageHint', { label: defaultLocale.value.label, locale: defaultLocale.value.locale })
    : t('admin.content.defaultLanguageFallback'),
);

function replaceForm(nextForm: ContentItem) {
  for (const key of Object.keys(form)) {
    delete (form as unknown as Record<string, unknown>)[key];
  }
  Object.assign(form, nextForm);
}

function categoryFor(value: string | undefined) {
  return currentCategories.value.find((category) => category.value === value);
}

function contentPayload() {
  const defaultTranslation = defaultLocale.value ? form.translations[defaultLocale.value.locale] ?? {} : {};
  return {
    text: defaultTranslation.text ?? form.text,
    title: defaultTranslation.title ?? form.title,
    description: defaultTranslation.description ?? form.description,
    questionText: defaultTranslation.questionText ?? form.questionText,
    category: form.category,
    depthLevel: form.depthLevel,
    longDistanceSuitable: form.longDistanceSuitable,
    estimatedMinutes: form.estimatedMinutes,
    effortLevel: form.effortLevel,
    rewardPoints: form.rewardPoints,
    rewardSeedType: form.rewardSeedType,
    requiresBothPartners: form.requiresBothPartners,
    active: form.active,
    sortOrder: form.sortOrder,
    translations: form.translations,
  };
}

function emptyForm(type: ContentType): ContentItem {
  return {
    active: true,
    text: '',
    title: '',
    description: '',
    questionText: '',
    category: '',
    depthLevel: 1,
    longDistanceSuitable: true,
    estimatedMinutes: 10,
    effortLevel: 'low',
    rewardPoints: 10,
    rewardSeedType: '',
    requiresBothPartners: true,
    sortOrder: 0,
    translations: {},
  };
}

function ensureTranslations() {
  form.translations ??= {};
  for (const locale of locales.value) {
    form.translations[locale.locale] ??= {};
  }
  if (defaultLocale.value) {
    const translation = form.translations[defaultLocale.value.locale];
    if (form.text && !translation.text) translation.text = form.text;
    if (form.title && !translation.title) translation.title = form.title;
    if (form.description && !translation.description) translation.description = form.description;
    if (form.questionText && !translation.questionText) translation.questionText = form.questionText;
  }
}

function resetForm(open = false) {
  replaceForm(emptyForm(selectedType.value));
  form.category = currentCategories.value[0]?.value ?? '';
  ensureTranslations();
  errors.value = {};
  showForm.value = open;
}

async function openFormForNew() {
  resetForm(true);
  await scrollToForm();
}

async function editItem(item: ContentItem) {
  replaceForm(JSON.parse(JSON.stringify(item)));
  ensureTranslations();
  showForm.value = true;
  errors.value = {};
  await scrollToForm();
}

async function scrollToForm() {
  await nextTick();
  formAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function validateForm() {
  const nextErrors: Record<string, string> = {};
  if (!form.category) nextErrors.category = t('admin.content.errors.category');
  const defaultTranslation = defaultLocale.value ? form.translations[defaultLocale.value.locale] ?? {} : {};

  if (selectedType.value === 'daily-questions') {
    if (!defaultTranslation.text?.trim()) nextErrors.text = t('admin.content.errors.text');
    if (!form.depthLevel || form.depthLevel < 1 || form.depthLevel > 4) nextErrors.depthLevel = t('admin.content.errors.depthLevel');
  }
  if (selectedType.value === 'quests') {
    if (!defaultTranslation.title?.trim()) nextErrors.title = t('admin.content.errors.title');
    if (!defaultTranslation.description?.trim()) nextErrors.description = t('admin.content.errors.description');
    if (!form.estimatedMinutes || form.estimatedMinutes < 1) nextErrors.estimatedMinutes = t('admin.content.errors.estimatedMinutes');
    if (!form.rewardPoints || form.rewardPoints < 0) nextErrors.rewardPoints = t('admin.content.errors.rewardPoints');
  }
  if (selectedType.value === 'know-me-catalog' && !defaultTranslation.questionText?.trim()) {
    nextErrors.questionText = t('admin.content.errors.questionText');
  }
  if (selectedType.value === 'love-jar-templates' && !defaultTranslation.text?.trim()) {
    nextErrors.text = t('admin.content.errors.templateText');
  }

  errors.value = nextErrors;
  return Object.keys(nextErrors).length === 0;
}

async function loadLocales() {
  const payload = await adminApiRequest<{ locales: LocaleOption[] }>('/api/admin/content/locales');
  locales.value = payload.locales;
}

async function loadCategories() {
  const payload = await adminApiRequest<{ items: CategoryItem[] }>('/api/admin/categories');
  categories.value = payload.items;
}

async function loadItems() {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (activeFilter.value !== 'all') params.set('active', activeFilter.value);
    if (search.value) params.set('search', search.value);
    if (categoryFilter.value) params.set('category', categoryFilter.value);
    const query = params.toString();
    const payload = await adminApiRequest<{ items: ContentItem[] }>(`/api/admin/content/${selectedType.value}${query ? `?${query}` : ''}`);
    items.value = payload.items;
  } finally {
    loading.value = false;
  }
}

async function switchType(type: ContentType) {
  selectedType.value = type;
  categoryFilter.value = '';
  resetForm(false);
  await loadItems();
}

async function saveItem() {
  if (!validateForm()) return;
  saving.value = true;
  try {
    const path = form.id ? `/api/admin/content/${selectedType.value}/${form.id}` : `/api/admin/content/${selectedType.value}`;
    const method = form.id ? 'PATCH' : 'POST';
    const payload = await adminApiRequest<{ items: ContentItem[] }>(path, {
      method,
      body: JSON.stringify(contentPayload()),
    });
    items.value = payload.items;
    resetForm(false);
  } catch {
    errors.value = { form: t('admin.content.errors.save', { type: currentTypeLabel.value || t('admin.content.title') }) };
  } finally {
    saving.value = false;
  }
}

async function setActive(item: ContentItem, active: boolean) {
  await editItem(item);
  form.active = active;
  await saveItem();
}

onMounted(async () => {
  await Promise.all([loadLocales(), loadCategories()]);
  resetForm(false);
  await loadItems();
});
</script>

<template>
  <section class="admin-view" data-testid="admin-content">
    <div class="admin-heading">
      <h1>{{ t('admin.content.title') }}</h1>
      <span>{{ currentTypeLabel }}</span>
    </div>
    <p class="muted">{{ t('admin.content.help') }}</p>

    <div class="admin-tabs" role="tablist">
      <button v-for="type in contentTypes" :key="type.id" type="button" :class="{ active: selectedType === type.id }" @click="switchType(type.id)">
        {{ type.label }}
      </button>
    </div>

    <section v-if="showForm" ref="formAnchor" class="admin-panel admin-form" data-testid="admin-content-form">
      <div class="admin-form-head">
        <h2>{{ form.id ? t('admin.content.editTitle', { type: currentTypeLabel }) : t('admin.content.newTitle', { type: currentTypeLabel }) }}</h2>
        <button class="secondary-button admin-small-button" type="button" @click="resetForm(false)">{{ t('admin.common.close') }}</button>
      </div>
      <p v-if="errors.form" class="form-error">{{ errors.form }}</p>
      <p class="muted">{{ defaultLanguageHint }}</p>

      <label class="admin-checkbox">
        <input v-model="form.active" type="checkbox" />
        {{ t('admin.common.active') }}
      </label>

      <label>
        {{ t('admin.common.category') }}
        <select v-model="form.category" data-testid="admin-content-category">
          <option value="">{{ t('admin.content.chooseCategory') }}</option>
          <option v-for="category in currentCategories" :key="category.id" :value="category.value">{{ category.label }}</option>
        </select>
        <small v-if="errors.category" class="admin-field-error">{{ errors.category }}</small>
      </label>

      <template v-if="selectedType === 'daily-questions'">
        <fieldset v-if="defaultLocale" class="admin-translation-box admin-default-translation">
          <legend>
            {{ defaultLocale.label }} [{{ defaultLocale.locale }}]
            <span class="admin-required-badge">{{ t('admin.messages.standardSuffix') }}</span>
          </legend>
          <label>
            {{ t('admin.content.defaultText') }}
            <input v-model="form.translations[defaultLocale.locale].text" data-testid="admin-content-text" />
            <small v-if="errors.text" class="admin-field-error">{{ errors.text }}</small>
          </label>
        </fieldset>
        <label>
          {{ t('admin.content.depth') }}
          <input v-model.number="form.depthLevel" min="1" max="4" type="number" />
          <small>{{ t('admin.content.depthHelp') }}</small>
          <small v-if="errors.depthLevel" class="admin-field-error">{{ errors.depthLevel }}</small>
        </label>
        <label class="admin-checkbox">
          <input v-model="form.longDistanceSuitable" type="checkbox" />
          {{ t('admin.content.longDistanceSuitable') }}
        </label>
        <small>{{ t('admin.content.longDistanceHelp') }}</small>
      </template>

      <template v-if="selectedType === 'quests'">
        <fieldset v-if="defaultLocale" class="admin-translation-box admin-default-translation">
          <legend>
            {{ defaultLocale.label }} [{{ defaultLocale.locale }}]
            <span class="admin-required-badge">{{ t('admin.messages.standardSuffix') }}</span>
          </legend>
          <label>{{ t('admin.content.defaultTitle') }}<input v-model="form.translations[defaultLocale.locale].title" data-testid="admin-content-title" /><small v-if="errors.title" class="admin-field-error">{{ errors.title }}</small></label>
          <label>{{ t('admin.content.defaultDescription') }}<textarea v-model="form.translations[defaultLocale.locale].description" rows="3" data-testid="admin-content-description" /><small v-if="errors.description" class="admin-field-error">{{ errors.description }}</small></label>
        </fieldset>
        <label>{{ t('admin.content.minutes') }}<input v-model.number="form.estimatedMinutes" min="1" type="number" /><small v-if="errors.estimatedMinutes" class="admin-field-error">{{ errors.estimatedMinutes }}</small></label>
        <label>
          {{ t('admin.content.effort') }}
          <select v-model="form.effortLevel">
            <option value="low">{{ t('admin.content.effortLow') }}</option>
            <option value="medium">{{ t('admin.content.effortMedium') }}</option>
            <option value="high">{{ t('admin.content.effortHigh') }}</option>
          </select>
        </label>
        <label>{{ t('admin.common.points') }}<input v-model.number="form.rewardPoints" min="0" type="number" /><small v-if="errors.rewardPoints" class="admin-field-error">{{ errors.rewardPoints }}</small></label>
        <label>{{ t('admin.content.seed') }}<input v-model="form.rewardSeedType" /></label>
        <label class="admin-checkbox"><input v-model="form.requiresBothPartners" type="checkbox" /> {{ t('admin.content.requiresBothPartners') }}</label>
      </template>

      <template v-if="selectedType === 'know-me-catalog'">
        <fieldset v-if="defaultLocale" class="admin-translation-box admin-default-translation">
          <legend>
            {{ defaultLocale.label }} [{{ defaultLocale.locale }}]
            <span class="admin-required-badge">{{ t('admin.messages.standardSuffix') }}</span>
          </legend>
          <label>{{ t('admin.content.defaultQuestion') }}<input v-model="form.translations[defaultLocale.locale].questionText" data-testid="admin-content-question-text" /><small v-if="errors.questionText" class="admin-field-error">{{ errors.questionText }}</small></label>
          <label>{{ t('admin.content.categoryLabelPlaceholder', { locale: defaultLocale.locale }) }}<input v-model="form.translations[defaultLocale.locale].categoryLabel" /></label>
        </fieldset>
        <label>{{ t('admin.common.sortOrder') }}<input v-model.number="form.sortOrder" type="number" /></label>
      </template>

      <template v-if="selectedType === 'love-jar-templates'">
        <fieldset v-if="defaultLocale" class="admin-translation-box admin-default-translation">
          <legend>
            {{ defaultLocale.label }} [{{ defaultLocale.locale }}]
            <span class="admin-required-badge">{{ t('admin.messages.standardSuffix') }}</span>
          </legend>
          <label>{{ t('admin.content.defaultText') }}<input v-model="form.translations[defaultLocale.locale].text" data-testid="admin-content-love-jar-text" /><small v-if="errors.text" class="admin-field-error">{{ errors.text }}</small></label>
        </fieldset>
        <label>{{ t('admin.common.sortOrder') }}<input v-model.number="form.sortOrder" type="number" /></label>
      </template>

      <section v-if="additionalLocales.length > 0" class="admin-translation-box">
        <h2>{{ t('admin.common.translations') }}</h2>
        <p class="muted">{{ t('admin.content.translationsHelp') }}</p>
        <div v-for="locale in additionalLocales" :key="locale.locale" class="admin-translation-row">
          <strong>{{ locale.locale }}</strong>
          <template v-if="selectedType === 'quests'">
            <input v-model="form.translations[locale.locale].title" :placeholder="t('admin.common.titlePlaceholder', { locale: locale.locale })" />
            <textarea v-model="form.translations[locale.locale].description" rows="2" :placeholder="t('admin.common.descriptionPlaceholder', { locale: locale.locale })" />
          </template>
          <template v-else-if="selectedType === 'know-me-catalog'">
            <input v-model="form.translations[locale.locale].questionText" :placeholder="t('admin.common.questionPlaceholder', { locale: locale.locale })" />
            <input v-model="form.translations[locale.locale].categoryLabel" :placeholder="t('admin.content.categoryLabelPlaceholder', { locale: locale.locale })" />
          </template>
          <template v-else>
            <input v-model="form.translations[locale.locale].text" :placeholder="t('admin.common.textPlaceholder', { locale: locale.locale })" />
          </template>
        </div>
      </section>

      <button class="primary-button" type="button" :disabled="saving" data-testid="admin-content-save" @click="saveItem">
        <Save :size="18" aria-hidden="true" />
        {{ saving ? t('admin.common.saving') : t('admin.common.save') }}
      </button>
    </section>

    <div class="admin-table-header">
      <div class="admin-toolbar">
        <input v-model="search" :placeholder="t('admin.content.filterPlaceholder')" data-testid="admin-content-search" @keyup.enter="loadItems" />
        <select v-model="categoryFilter" data-testid="admin-content-category-filter" @change="loadItems">
          <option value="">{{ t('admin.common.allCategories') }}</option>
          <option v-for="category in currentCategories" :key="category.id" :value="category.value">{{ category.label }}</option>
        </select>
        <select v-model="activeFilter" data-testid="admin-content-active-filter" @change="loadItems">
          <option value="all">{{ t('admin.common.all') }}</option>
          <option value="true">{{ t('admin.common.active') }}</option>
          <option value="false">{{ t('admin.common.inactive') }}</option>
        </select>
        <button class="secondary-button" type="button" @click="loadItems">{{ t('admin.common.filter') }}</button>
      </div>
      <button class="primary-button" type="button" data-testid="admin-content-new" @click="openFormForNew">
        <Plus :size="18" aria-hidden="true" />
        {{ t('admin.common.new') }}
      </button>
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>{{ t('admin.content.titleText') }}</th>
            <th>{{ t('admin.common.category') }}</th>
            <th>{{ t('admin.common.status') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>{{ item.title || item.questionText || item.text }}</td>
            <td>
              <span class="admin-chip">{{ categoryFor(item.category)?.label ?? item.category }}</span>
            </td>
            <td>{{ item.active ? t('admin.common.activeLower') : t('admin.common.inactiveLower') }}</td>
            <td class="admin-actions">
              <button class="secondary-button admin-small-button" type="button" @click="editItem(item)">{{ t('admin.common.edit') }}</button>
              <button v-if="item.active" class="danger-button admin-small-button" type="button" @click="setActive(item, false)">
                <Trash2 :size="16" aria-hidden="true" />
                {{ t('admin.common.deactivate') }}
              </button>
              <button v-else class="secondary-button admin-small-button" type="button" @click="setActive(item, true)">
                <RotateCcw :size="16" aria-hidden="true" />
                {{ t('admin.common.reactivate') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="loading" class="muted">{{ t('admin.common.loading') }}</p>
  </section>
</template>
