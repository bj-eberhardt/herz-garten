<script setup lang="ts">
import type { MemoryEntryView } from '@/stores/memoryStore';
import { i18n } from '@/i18n';

defineProps<{
  memories: MemoryEntryView[];
}>();

function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(date),
  );
}
</script>

<template>
  <section class="timeline" data-testid="memory-timeline">
    <article v-for="memory in memories" :key="memory.id" class="timeline-item" data-testid="memory-item">
      <time>{{ formatDate(memory.date) }}</time>
      <h2>{{ memory.title }}</h2>
      <p class="eyebrow">{{ i18n.global.t(`memories.categories.${memory.category}`) }} - {{ memory.authorName }}</p>
      <p v-if="memory.description">{{ memory.description }}</p>
    </article>
  </section>
</template>
