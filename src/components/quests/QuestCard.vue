<script setup lang="ts">
import { CheckCircle2, Clock3, Sprout } from '@lucide/vue';
import type { QuestWithProgress } from '@/stores/questStore';

defineProps<{
  quest: QuestWithProgress;
  buttonLabel: string;
  disabled: boolean;
}>();

defineEmits<{
  action: [quest: QuestWithProgress];
}>();
</script>

<template>
  <article class="quest-card">
    <div>
      <p class="eyebrow">{{ quest.category }} - {{ quest.effortLevel }}</p>
      <h2>{{ quest.title }}</h2>
      <p>{{ quest.description }}</p>
    </div>
    <div class="quest-meta">
      <span><Clock3 :size="16" />{{ quest.estimatedMinutes }} min</span>
      <span><Sprout :size="16" />{{ quest.rewardPoints }} Punkte</span>
    </div>
    <p v-if="quest.coupleQuest?.status === 'accepted'" class="muted">
      {{ quest.requiresBothPartners ? 'Beide Partner bestaetigen den Abschluss.' : 'Bereit zum Abschliessen.' }}
    </p>
    <button class="secondary-button" type="button" :disabled="disabled" @click="$emit('action', quest)">
      <CheckCircle2 :size="18" aria-hidden="true" />
      {{ buttonLabel }}
    </button>
  </article>
</template>
