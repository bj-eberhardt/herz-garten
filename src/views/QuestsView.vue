<script setup lang="ts">
import { onMounted } from 'vue';
import QuestCard from '@/components/quests/QuestCard.vue';
import { useAuthStore } from '@/stores/authStore';
import { useQuestStore } from '@/stores/questStore';

const authStore = useAuthStore();
const questStore = useQuestStore();

onMounted(() => {
  questStore.loadQuests();
});
</script>

<template>
  <div class="view-grid">
    <section>
      <p class="eyebrow">Quests</p>
      <h1>Sanfte Aufgaben fuer mehr Naehe.</h1>
    </section>

    <p v-if="questStore.error" class="form-error">{{ questStore.error }}</p>
    <p v-if="questStore.loading" class="muted">Quests werden geladen...</p>

    <div class="card-grid">
      <QuestCard
        v-for="quest in questStore.quests"
        :key="quest.id"
        :quest="quest"
        :button-label="questStore.buttonLabel(quest, authStore.user?.id)"
        :disabled="questStore.buttonDisabled(quest, authStore.user?.id)"
        @action="questStore.primaryAction"
      />
    </div>
  </div>
</template>
