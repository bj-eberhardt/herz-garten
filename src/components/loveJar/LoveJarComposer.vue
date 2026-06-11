<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { ChevronLeft, ChevronRight, Plus } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { useLoveJarStore } from '@/stores/loveJarStore';
import type { LoveJarCategory } from '@/types/domain';

const loveJarStore = useLoveJarStore();
const { t } = useI18n();
const note = ref('');
const category = ref<LoveJarCategory>('compliment');
const submitAttempted = ref(false);
const templatePage = ref(0);
const templatesPerPage = 6;
const loveJarTemplates = computed(() => loveJarStore.templates);
const fallbackCategories = computed(() => [
  { value: 'compliment', label: t('loveJar.categories.compliment') },
  { value: 'memory', label: t('loveJar.categories.memory') },
  { value: 'voucher', label: t('loveJar.categories.voucher') },
  { value: 'wish', label: t('loveJar.categories.wish') },
  { value: 'surprise', label: t('loveJar.categories.surprise') },
]);
const categoryOptions = computed(() => (loveJarStore.categories.length ? loveJarStore.categories : fallbackCategories.value));
const templatePageCount = computed(() => Math.ceil(loveJarTemplates.value.length / templatesPerPage));
const visibleTemplates = computed(() => {
  const start = templatePage.value * templatesPerPage;
  return loveJarTemplates.value.slice(start, start + templatesPerPage);
});
const hasPreviousTemplates = computed(() => templatePage.value > 0);
const hasNextTemplates = computed(() => templatePage.value < templatePageCount.value - 1);

function selectTemplate(template: { text: string; category: LoveJarCategory }) {
  note.value = template.text;
  category.value = template.category;
}

function previousTemplates() {
  templatePage.value = Math.max(0, templatePage.value - 1);
}

function nextTemplates() {
  templatePage.value = Math.min(templatePageCount.value - 1, templatePage.value + 1);
}

async function submitNote() {
  await loveJarStore.addNote(note.value, category.value);
  note.value = '';
  submitAttempted.value = false;
}

onMounted(async () => {
  await loveJarStore.loadTemplates();
  note.value = loveJarTemplates.value[0]?.text ?? '';
});

watch(loveJarTemplates, (templates) => {
  if (!note.value && templates[0]) {
    note.value = templates[0].text;
    category.value = templates[0].category;
  }
  if (templatePage.value >= templatePageCount.value) {
    templatePage.value = Math.max(0, templatePageCount.value - 1);
  }
});

watch(categoryOptions, (options) => {
  if (options.length && !options.some((option) => option.value === category.value)) {
    category.value = options[0].value;
  }
});
</script>

<template>
  <form
    class="panel composer"
    :class="{ 'form-submitted': submitAttempted }"
    data-testid="love-jar-form"
    @invalid.capture="submitAttempted = true"
    @submit.prevent="submitNote"
  >
    <div>
      <p class="eyebrow">{{ t('loveJar.composerEyebrow') }}</p>
      <h2>{{ t('loveJar.composerTitle') }}</h2>
      <p class="muted">
        {{ t('loveJar.composerHint') }}
      </p>
    </div>

    <label for="love-jar-category">{{ t('common.category') }}</label>
    <select id="love-jar-category" v-model="category" data-testid="love-jar-category" required>
      <option v-for="option in categoryOptions" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>

    <label for="love-jar-note">{{ t('loveJar.newNote') }}</label>
    <textarea id="love-jar-note" v-model="note" rows="4" :placeholder="t('loveJar.notePlaceholder')" data-testid="love-jar-note-input" required />
    <section v-if="loveJarTemplates.length" class="template-section" data-testid="love-jar-templates">
      <div class="template-header">
        <strong>{{ t('loveJar.templatesTitle') }}</strong>
        <span>{{ t('loveJar.templatesPage', { current: templatePage + 1, total: templatePageCount }) }}</span>
      </div>
      <div class="template-browser">
        <button
          v-if="hasPreviousTemplates"
          class="template-page-button"
          type="button"
          :aria-label="t('loveJar.previousTemplates')"
          data-testid="love-jar-templates-previous"
          @click="previousTemplates"
        >
          <ChevronLeft :size="18" aria-hidden="true" />
        </button>
        <span v-else-if="templatePageCount > 1" class="template-page-placeholder" aria-hidden="true"></span>
        <div class="template-chip-list">
          <button
            v-for="template in visibleTemplates"
            :key="template.id"
            class="template-chip"
            type="button"
            @click="selectTemplate(template)"
          >
            {{ template.text }}
          </button>
        </div>
        <button
          v-if="hasNextTemplates"
          class="template-page-button"
          type="button"
          :aria-label="t('loveJar.nextTemplates')"
          data-testid="love-jar-templates-next"
          @click="nextTemplates"
        >
          <ChevronRight :size="18" aria-hidden="true" />
        </button>
        <span v-else-if="templatePageCount > 1" class="template-page-placeholder" aria-hidden="true"></span>
      </div>
    </section>
    <button class="primary-button" type="submit" :disabled="loveJarStore.loading" data-testid="love-jar-save" @click="submitAttempted = true">
      <Plus :size="18" aria-hidden="true" />
      {{ loveJarStore.loading ? t('common.saving') : t('loveJar.saveNote') }}
    </button>
  </form>
</template>
