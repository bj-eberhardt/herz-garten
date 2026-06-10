<script setup lang="ts">
import { CheckCircle2, Clock3, Sprout } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import type { QuestWithProgress } from '@/stores/questStore';

defineProps<{
  quest: QuestWithProgress;
  buttonLabel: string;
  disabled: boolean;
  variant?: 'default' | 'active' | 'completed';
}>();

defineEmits<{
  action: [quest: QuestWithProgress];
}>();

const { t } = useI18n();
</script>

<template>
  <article class="quest-card" :class="[`quest-card--${variant ?? 'default'}`]" data-testid="quest-card">
    <div>
      <p class="eyebrow">{{ t(`quests.filters.${quest.category}`) }} - {{ t(`quests.filters.${quest.effortLevel}`) }}</p>
      <h2>{{ quest.titleKey ? t(quest.titleKey) : quest.title }}</h2>
      <p>{{ quest.descriptionKey ? t(quest.descriptionKey) : quest.description }}</p>
    </div>
    <div class="quest-meta">
      <span><Clock3 :size="16" />{{ t('common.minutes', { count: quest.estimatedMinutes }) }}</span>
      <span><Sprout :size="16" />{{ t('common.points', quest.rewardPoints, { named: { count: quest.rewardPoints } }) }}</span>
    </div>
    <p v-if="quest.coupleQuest?.status === 'accepted'" class="quest-status-note">
      {{ quest.requiresBothPartners ? t('quests.status.bothConfirm') : t('quests.status.ready') }}
    </p>
    <p v-else-if="quest.coupleQuest?.status === 'completed'" class="quest-status-note">
      {{ t('quests.status.completed') }}
    </p>
    <button class="secondary-button" type="button" :disabled="disabled" data-testid="quest-action" @click="$emit('action', quest)">
      <CheckCircle2 :size="18" aria-hidden="true" />
      {{ buttonLabel }}
    </button>
  </article>
</template>
