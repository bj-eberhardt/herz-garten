<script setup lang="ts">
import type { MemoryEntryView } from '@/stores/memoryStore';

defineProps<{
  memories: MemoryEntryView[];
}>();
</script>

<template>
  <section class="timeline">
    <article v-for="memory in memories" :key="memory.id" class="timeline-item">
      <time>{{ memory.date }}</time>
      <h2>{{ memory.title }}</h2>
      <p class="eyebrow">{{ memory.category }} - {{ memory.authorName }}</p>
      <p v-if="memory.description">{{ memory.description }}</p>
    </article>
  </section>
</template>
