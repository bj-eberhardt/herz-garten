<script setup lang="ts">
import QuestCard from '@/components/quests/QuestCard.vue';
import { useQuestStore, type QuestWithProgress } from '@/stores/questStore';

withDefaults(
  defineProps<{
    quests: QuestWithProgress[];
    eyebrow: string;
    title: string;
    emptyText?: string;
    variant?: 'default' | 'active' | 'completed';
    gridClass?: string;
    currentUserId?: string;
    loading?: boolean;
    testId: string;
  }>(),
  {
    variant: 'default',
    gridClass: '',
    emptyText: undefined,
    currentUserId: undefined,
    loading: false,
  },
);

defineEmits<{
  action: [quest: QuestWithProgress];
}>();

const questStore = useQuestStore();
</script>

<template>
  <section class="quest-section" :data-testid="testId">
    <div class="section-heading">
      <p class="eyebrow">{{ eyebrow }}</p>
      <h2>{{ title }}</h2>
    </div>
    <p v-if="!quests.length && emptyText" class="muted">{{ emptyText }}</p>
    <div v-else class="card-grid" :class="gridClass">
      <QuestCard
        v-for="quest in quests"
        :key="quest.id"
        :quest="quest"
        :button-label="questStore.buttonLabel(quest, currentUserId)"
        :disabled="questStore.buttonDisabled(quest, currentUserId) || loading"
        :variant="variant"
        @action="$emit('action', quest)"
      />
    </div>
  </section>
</template>
