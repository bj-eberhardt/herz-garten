<script setup lang="ts">
import { CheckCircle2, Clock3, Sprout } from '@lucide/vue';
import type { Quest } from '@/types/domain';

defineProps<{
  quest: Quest;
  completed: boolean;
}>();

defineEmits<{
  complete: [questId: string];
}>();
</script>

<template>
  <article class="quest-card">
    <div>
      <p class="eyebrow">{{ quest.category }} · {{ quest.effortLevel }}</p>
      <h2>{{ quest.title }}</h2>
      <p>{{ quest.description }}</p>
    </div>
    <div class="quest-meta">
      <span><Clock3 :size="16" />{{ quest.estimatedMinutes }} min</span>
      <span><Sprout :size="16" />{{ quest.rewardPoints }} Punkte</span>
    </div>
    <button class="secondary-button" type="button" :disabled="completed" @click="$emit('complete', quest.id)">
      <CheckCircle2 :size="18" aria-hidden="true" />
      {{ completed ? 'Abgeschlossen' : 'Abschliessen' }}
    </button>
  </article>
</template>
