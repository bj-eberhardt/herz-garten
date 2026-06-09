<script setup lang="ts">
import type { MemoryEntry } from '@/types/domain';

defineProps<{
  memories: MemoryEntry[];
}>();
</script>

<template>
  <section class="timeline">
    <article v-for="memory in memories" :key="memory.id" class="timeline-item">
      <time>{{ memory.date }}</time>
      <h2>{{ memory.title }}</h2>
      <p v-if="memory.description">{{ memory.description }}</p>
    </article>
  </section>
</template>
