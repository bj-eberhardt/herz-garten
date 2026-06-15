<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Plus, Images } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import FeatureExplainer from '@/components/common/FeatureExplainer.vue';
import MemoryTimeline from '@/components/memories/MemoryTimeline.vue';
import { FIELD_SUCCESS_VISIBLE_MS } from '@/constants/timing';
import type { MemoryCategory } from '@/types/domain';
import { useMemoryStore } from '@/stores/memoryStore';

const memoryStore = useMemoryStore();
const { t } = useI18n();
const title = ref('');
const description = ref('');
const date = ref(new Date().toISOString().slice(0, 10));
const category = ref<MemoryCategory>('everyday');
const submitAttempted = ref(false);
const successMessage = ref('');
let successTimeout: ReturnType<typeof window.setTimeout> | undefined;
const fallbackCategories = computed(() => [
  { value: 'everyday', label: t('memories.categories.everyday') },
  { value: 'date', label: t('memories.categories.date') },
  { value: 'travel', label: t('memories.categories.travel') },
  { value: 'milestone', label: t('memories.categories.milestone') },
  { value: 'funny', label: t('memories.categories.funny') },
  { value: 'special', label: t('memories.categories.special') },
]);
const categoryOptions = computed(() => (memoryStore.categories.length ? memoryStore.categories : fallbackCategories.value));

async function submitMemory() {
  try {
    await memoryStore.addMemory({
      title: title.value,
      description: description.value,
      date: date.value,
      category: category.value,
    });
  } catch {
    return;
  }
  title.value = '';
  description.value = '';
  date.value = new Date().toISOString().slice(0, 10);
  category.value = 'everyday';
  submitAttempted.value = false;
  successMessage.value = t('memories.saveSuccess');
  if (successTimeout) window.clearTimeout(successTimeout);
  successTimeout = window.setTimeout(() => {
    successMessage.value = '';
    successTimeout = undefined;
  }, FIELD_SUCCESS_VISIBLE_MS);
}

onMounted(() => {
  memoryStore.loadMemories();
});

watch(categoryOptions, (options) => {
  if (options.length && !options.some((option) => option.value === category.value)) {
    category.value = options[0].value;
  }
});

onBeforeUnmount(() => {
  if (successTimeout) window.clearTimeout(successTimeout);
});
</script>

<template>
  <div class="view-grid">
    <section>
      <p class="eyebrow">{{ t('memories.eyebrow') }}</p>
      <h1>{{ t('memories.title') }}</h1>
    </section>

    <FeatureExplainer feature-key="memories" :icon="Images" :title="t('memories.howTitle')" :text="t('memories.howText')" />

    <form class="panel composer" :class="{ 'form-submitted': submitAttempted }" data-testid="memory-form" @submit.prevent="submitMemory">
      <label for="memory-title">{{ t('memories.newMemory') }}</label>
      <input id="memory-title" v-model="title" :placeholder="t('memories.titlePlaceholder')" data-testid="memory-title" required />

      <label for="memory-description">{{ t('memories.description') }}</label>
      <textarea id="memory-description" v-model="description" rows="3" :placeholder="t('memories.descriptionPlaceholder')" data-testid="memory-description" />

      <label for="memory-date">{{ t('memories.date') }}</label>
      <input id="memory-date" v-model="date" type="date" data-testid="memory-date" required />

      <label for="memory-category">{{ t('common.category') }}</label>
      <select id="memory-category" v-model="category" data-testid="memory-category" required>
        <option v-for="option in categoryOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>

      <p v-if="memoryStore.error" class="form-error">{{ memoryStore.error }}</p>

      <button class="primary-button" type="submit" :disabled="memoryStore.loading" data-testid="memory-save" @click="submitAttempted = true">
        <Plus :size="18" aria-hidden="true" />
        {{ memoryStore.loading ? t('common.saving') : t('common.save') }}
      </button>
      <p v-if="successMessage" class="success-note" data-testid="memory-save-success">{{ successMessage }}</p>
    </form>

    <p v-if="!memoryStore.loading && memoryStore.memories.length === 0" class="muted" data-testid="memory-empty">{{ t('memories.empty') }}</p>
    <MemoryTimeline :memories="memoryStore.memories" />
  </div>
</template>
