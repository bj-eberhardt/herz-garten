<script setup lang="ts">
import QuestCard from '@/components/quests/QuestCard.vue';
import { useQuestStore } from '@/stores/questStore';

const questStore = useQuestStore();
</script>

<template>
  <div class="view-grid">
    <section>
      <p class="eyebrow">Quests</p>
      <h1>Sanfte Aufgaben fuer mehr Naehe.</h1>
    </section>

    <div class="card-grid">
      <QuestCard
        v-for="quest in questStore.quests"
        :key="quest.id"
        :quest="quest"
        :completed="questStore.completedQuestIds.includes(quest.id)"
        @complete="questStore.completeQuest"
      />
    </div>
  </div>
</template>
