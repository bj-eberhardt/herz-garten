<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Plus } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import MemoryTimeline from '@/components/memories/MemoryTimeline.vue';
import type { MemoryCategory } from '@/types/domain';
import { useMemoryStore } from '@/stores/memoryStore';

const memoryStore = useMemoryStore();
const { t } = useI18n();
const title = ref('');
const description = ref('');
const date = ref(new Date().toISOString().slice(0, 10));
const category = ref<MemoryCategory>('everyday');

async function submitMemory() {
  await memoryStore.addMemory({
    title: title.value,
    description: description.value,
    date: date.value,
    category: category.value,
  });
  title.value = '';
  description.value = '';
  date.value = new Date().toISOString().slice(0, 10);
  category.value = 'everyday';
}

onMounted(() => {
  memoryStore.loadMemories();
});
</script>

<template>
  <div class="view-grid">
    <section>
      <p class="eyebrow">{{ t('memories.eyebrow') }}</p>
      <h1>{{ t('memories.title') }}</h1>
    </section>

    <form class="panel composer" data-testid="memory-form" @submit.prevent="submitMemory">
      <label for="memory-title">{{ t('memories.newMemory') }}</label>
      <input id="memory-title" v-model="title" :placeholder="t('memories.titlePlaceholder')" data-testid="memory-title" />

      <label for="memory-description">{{ t('memories.description') }}</label>
      <textarea id="memory-description" v-model="description" rows="3" :placeholder="t('memories.descriptionPlaceholder')" data-testid="memory-description" />

      <label for="memory-date">{{ t('memories.date') }}</label>
      <input id="memory-date" v-model="date" type="date" data-testid="memory-date" />

      <label for="memory-category">{{ t('common.category') }}</label>
      <select id="memory-category" v-model="category" data-testid="memory-category">
        <option value="everyday">{{ t('memories.categories.everyday') }}</option>
        <option value="date">{{ t('memories.categories.date') }}</option>
        <option value="travel">{{ t('memories.categories.travel') }}</option>
        <option value="milestone">{{ t('memories.categories.milestone') }}</option>
        <option value="funny">{{ t('memories.categories.funny') }}</option>
        <option value="special">{{ t('memories.categories.special') }}</option>
      </select>

      <p v-if="memoryStore.error" class="form-error">{{ memoryStore.error }}</p>

      <button class="primary-button" type="submit" :disabled="memoryStore.loading" data-testid="memory-save">
        <Plus :size="18" aria-hidden="true" />
        {{ memoryStore.loading ? t('common.saving') : t('common.save') }}
      </button>
    </form>

    <p v-if="!memoryStore.loading && memoryStore.memories.length === 0" class="muted" data-testid="memory-empty">{{ t('memories.empty') }}</p>
    <MemoryTimeline :memories="memoryStore.memories" />
  </div>
</template>
