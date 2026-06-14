<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { HeartHandshake } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import FeatureExplainer from '@/components/common/FeatureExplainer.vue';
import QuestFilters from '@/components/quests/QuestFilters.vue';
import QuestSection from '@/components/quests/QuestSection.vue';
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

    <FeatureExplainer feature-key="quests" :icon="HeartHandshake" :title="t('quests.howTitle')" :text="t('quests.howText')" />

    <p v-if="questStore.error" class="form-error">{{ questStore.error }}</p>
    <p v-if="questStore.loading" class="muted">{{ t('quests.loading') }}</p>

    <QuestFilters />

    <QuestSection
      v-if="activeQuests.length"
      :quests="activeQuests"
      :eyebrow="t('quests.sections.activeEyebrow')"
      :title="t('quests.sections.activeTitle')"
      :current-user-id="authStore.user?.id"
      :loading="questStore.loading"
      variant="active"
      test-id="quests-active-section"
      @action="questStore.primaryAction"
    />

    <QuestSection
      :quests="openQuests"
      :eyebrow="t('quests.sections.openEyebrow')"
      :title="t('quests.sections.openTitle')"
      :empty-text="t('quests.sections.emptyOpen')"
      :current-user-id="authStore.user?.id"
      :loading="questStore.loading"
      test-id="quests-open-section"
      @action="questStore.primaryAction"
    />

    <QuestSection
      v-if="completedQuests.length"
      :quests="completedQuests"
      :eyebrow="t('quests.sections.completedEyebrow')"
      :title="t('quests.sections.completedTitle')"
      :current-user-id="authStore.user?.id"
      :loading="questStore.loading"
      variant="completed"
      grid-class="compact-grid"
      test-id="quests-completed-section"
      @action="questStore.primaryAction"
    />
  </div>
</template>
