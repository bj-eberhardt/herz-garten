<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import QuestCard from '@/components/quests/QuestCard.vue';
import { useAuthStore } from '@/stores/authStore';
import { useQuestStore } from '@/stores/questStore';

const authStore = useAuthStore();
const questStore = useQuestStore();
const { t } = useI18n();

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
      <p class="eyebrow">{{ t('quests.eyebrow') }}</p>
      <h1>{{ t('quests.title') }}</h1>
    </section>

    <p v-if="questStore.error" class="form-error">{{ questStore.error }}</p>
    <p v-if="questStore.loading" class="muted">{{ t('quests.loading') }}</p>

    <section class="panel quest-filters" data-testid="quest-filters">
      <label for="quest-category-filter">{{ t('quests.filters.category') }}</label>
      <select
        id="quest-category-filter"
        v-model="questStore.filters.category"
        data-testid="quest-filter-category"
        @change="questStore.loadQuests()"
      >
        <option value="all">{{ t('quests.filters.all') }}</option>
        <option value="romance">{{ t('quests.filters.romance') }}</option>
        <option value="date">{{ t('quests.filters.date') }}</option>
        <option value="humor">{{ t('quests.filters.humor') }}</option>
        <option value="memory">{{ t('quests.filters.memory') }}</option>
        <option value="teamwork">{{ t('quests.filters.teamwork') }}</option>
        <option value="long_distance">{{ t('quests.filters.long_distance') }}</option>
      </select>

      <label for="quest-effort-filter">{{ t('quests.filters.effort') }}</label>
      <select
        id="quest-effort-filter"
        v-model="questStore.filters.effortLevel"
        data-testid="quest-filter-effort"
        @change="questStore.loadQuests()"
      >
        <option value="all">{{ t('quests.filters.all') }}</option>
        <option value="low">{{ t('quests.filters.low') }}</option>
        <option value="medium">{{ t('quests.filters.medium') }}</option>
        <option value="high">{{ t('quests.filters.high') }}</option>
      </select>

      <label for="quest-duration-filter">{{ t('quests.filters.duration') }}</label>
      <select
        id="quest-duration-filter"
        v-model="questStore.filters.maxMinutes"
        data-testid="quest-filter-duration"
        @change="questStore.loadQuests()"
      >
        <option value="all">{{ t('quests.filters.all') }}</option>
        <option value="5">{{ t('quests.filters.upToMinutes', { count: 5 }) }}</option>
        <option value="10">{{ t('quests.filters.upToMinutes', { count: 10 }) }}</option>
        <option value="15">{{ t('quests.filters.upToMinutes', { count: 15 }) }}</option>
        <option value="30">{{ t('quests.filters.upToMinutes', { count: 30 }) }}</option>
      </select>

      <label for="quest-mode-filter">{{ t('quests.filters.mode') }}</label>
      <select
        id="quest-mode-filter"
        v-model="questStore.filters.mode"
        data-testid="quest-filter-mode"
        @change="questStore.loadQuests()"
      >
        <option value="all">{{ t('quests.filters.all') }}</option>
        <option value="together">{{ t('quests.filters.together') }}</option>
        <option value="solo">{{ t('quests.filters.solo') }}</option>
        <option value="long_distance">{{ t('quests.filters.long_distance') }}</option>
      </select>
    </section>

    <section v-if="activeQuests.length" class="quest-section" data-testid="quests-active-section">
      <div class="section-heading">
        <p class="eyebrow">{{ t('quests.sections.activeEyebrow') }}</p>
        <h2>{{ t('quests.sections.activeTitle') }}</h2>
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
        <p class="eyebrow">{{ t('quests.sections.openEyebrow') }}</p>
        <h2>{{ t('quests.sections.openTitle') }}</h2>
      </div>
      <p v-if="!openQuests.length" class="muted">{{ t('quests.sections.emptyOpen') }}</p>
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
        <p class="eyebrow">{{ t('quests.sections.completedEyebrow') }}</p>
        <h2>{{ t('quests.sections.completedTitle') }}</h2>
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
