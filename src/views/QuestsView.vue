<script setup lang="ts">
import { computed, onMounted } from 'vue';
import QuestCard from '@/components/quests/QuestCard.vue';
import { useAuthStore } from '@/stores/authStore';
import { useQuestStore } from '@/stores/questStore';

const authStore = useAuthStore();
const questStore = useQuestStore();

onMounted(() => {
  questStore.loadQuests();
});

const activeQuests = computed(() =>
  questStore.quests.filter((quest) => questStore.statusFor(quest) === 'accepted'),
);
const openQuests = computed(() =>
  questStore.quests.filter((quest) => questStore.statusFor(quest) === 'available'),
);
const completedQuests = computed(() =>
  questStore.quests.filter((quest) => questStore.statusFor(quest) === 'completed'),
);
</script>

<template>
  <div class="view-grid">
    <section>
      <p class="eyebrow">Quests</p>
      <h1>Sanfte Aufgaben fuer mehr Naehe.</h1>
    </section>

    <p v-if="questStore.error" class="form-error">{{ questStore.error }}</p>
    <p v-if="questStore.loading" class="muted">Quests werden geladen...</p>

    <section class="panel quest-filters" data-testid="quest-filters">
      <label for="quest-category-filter">Kategorie</label>
      <select
        id="quest-category-filter"
        v-model="questStore.filters.category"
        data-testid="quest-filter-category"
        @change="questStore.loadQuests()"
      >
        <option value="all">Alle</option>
        <option value="romance">Romantik</option>
        <option value="date">Date</option>
        <option value="humor">Humor</option>
        <option value="memory">Erinnerung</option>
        <option value="teamwork">Teamwork</option>
        <option value="long_distance">Fernbeziehung</option>
      </select>

      <label for="quest-effort-filter">Aufwand</label>
      <select
        id="quest-effort-filter"
        v-model="questStore.filters.effortLevel"
        data-testid="quest-filter-effort"
        @change="questStore.loadQuests()"
      >
        <option value="all">Alle</option>
        <option value="low">Leicht</option>
        <option value="medium">Mittel</option>
        <option value="high">Hoch</option>
      </select>

      <label for="quest-duration-filter">Dauer</label>
      <select
        id="quest-duration-filter"
        v-model="questStore.filters.maxMinutes"
        data-testid="quest-filter-duration"
        @change="questStore.loadQuests()"
      >
        <option value="all">Alle</option>
        <option value="5">Bis 5 min</option>
        <option value="10">Bis 10 min</option>
        <option value="15">Bis 15 min</option>
        <option value="30">Bis 30 min</option>
      </select>

      <label for="quest-mode-filter">Modus</label>
      <select
        id="quest-mode-filter"
        v-model="questStore.filters.mode"
        data-testid="quest-filter-mode"
        @change="questStore.loadQuests()"
      >
        <option value="all">Alle</option>
        <option value="together">Gemeinsam</option>
        <option value="solo">Solo/asynchron</option>
        <option value="long_distance">Fernbeziehung</option>
      </select>
    </section>

    <section v-if="activeQuests.length" class="quest-section" data-testid="quests-active-section">
      <div class="section-heading">
        <p class="eyebrow">Aktiv</p>
        <h2>Bereit zum Abschliessen</h2>
      </div>
      <div class="card-grid">
        <QuestCard
          v-for="quest in activeQuests"
          :key="quest.id"
          :quest="quest"
          :button-label="questStore.buttonLabel(quest, authStore.user?.id)"
          :disabled="questStore.buttonDisabled(quest, authStore.user?.id)"
          variant="active"
          @action="questStore.primaryAction"
        />
      </div>
    </section>

    <section class="quest-section" data-testid="quests-open-section">
      <div class="section-heading">
        <p class="eyebrow">Offen</p>
        <h2>Neue Vorschlaege</h2>
      </div>
      <p v-if="!openQuests.length" class="muted">Keine offenen Quests im Moment.</p>
      <div v-else class="card-grid">
        <QuestCard
          v-for="quest in openQuests"
          :key="quest.id"
          :quest="quest"
          :button-label="questStore.buttonLabel(quest, authStore.user?.id)"
          :disabled="questStore.buttonDisabled(quest, authStore.user?.id)"
          @action="questStore.primaryAction"
        />
      </div>
    </section>

    <section v-if="completedQuests.length" class="quest-section" data-testid="quests-completed-section">
      <div class="section-heading">
        <p class="eyebrow">Abgeschlossen</p>
        <h2>Erledigte Quests</h2>
      </div>
      <div class="card-grid compact-grid">
        <QuestCard
          v-for="quest in completedQuests"
          :key="quest.id"
          :quest="quest"
          :button-label="questStore.buttonLabel(quest, authStore.user?.id)"
          :disabled="questStore.buttonDisabled(quest, authStore.user?.id)"
          variant="completed"
          @action="questStore.primaryAction"
        />
      </div>
    </section>
  </div>
</template>
