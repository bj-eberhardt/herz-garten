<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import QuestFilterField from '@/components/quests/QuestFilterField.vue';
import { useQuestStore } from '@/stores/questStore';

const questStore = useQuestStore();
const { t } = useI18n();

const allOption = computed(() => ({ value: 'all', label: t('quests.filters.all') }));
const categoryOptions = computed(() => [allOption.value, ...questStore.categories]);
const effortOptions = computed(() => [
  allOption.value,
  { value: 'low', label: t('quests.filters.low') },
  { value: 'medium', label: t('quests.filters.medium') },
  { value: 'high', label: t('quests.filters.high') },
]);
const durationOptions = computed(() => [
  allOption.value,
  { value: '5', label: t('quests.filters.upToMinutes', { count: 5 }) },
  { value: '10', label: t('quests.filters.upToMinutes', { count: 10 }) },
  { value: '15', label: t('quests.filters.upToMinutes', { count: 15 }) },
  { value: '30', label: t('quests.filters.upToMinutes', { count: 30 }) },
]);
const modeOptions = computed(() => [
  allOption.value,
  { value: 'together', label: t('quests.filters.together') },
  { value: 'solo', label: t('quests.filters.solo') },
  { value: 'long_distance', label: t('quests.filters.long_distance') },
]);
</script>

<template>
  <section class="panel quest-filters" data-testid="quest-filters">
    <QuestFilterField
      id="quest-category-filter"
      v-model="questStore.filters.category"
      :label="t('quests.filters.category')"
      :options="categoryOptions"
      test-id="quest-filter-category"
      @change="questStore.loadQuests()"
    />

    <QuestFilterField
      id="quest-effort-filter"
      v-model="questStore.filters.effortLevel"
      :label="t('quests.filters.effort')"
      :options="effortOptions"
      test-id="quest-filter-effort"
      @change="questStore.loadQuests()"
    />

    <QuestFilterField
      id="quest-duration-filter"
      v-model="questStore.filters.maxMinutes"
      :label="t('quests.filters.duration')"
      :options="durationOptions"
      test-id="quest-filter-duration"
      @change="questStore.loadQuests()"
    />

    <QuestFilterField
      id="quest-mode-filter"
      v-model="questStore.filters.mode"
      :label="t('quests.filters.mode')"
      :options="modeOptions"
      test-id="quest-filter-mode"
      @change="questStore.loadQuests()"
    />
  </section>
</template>
