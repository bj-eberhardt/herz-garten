<script setup lang="ts">
import { onMounted } from 'vue';
import { HelpCircle } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import FeatureExplainer from '@/components/common/FeatureExplainer.vue';
import KnowMeComposer from '@/components/knowMe/KnowMeComposer.vue';
import KnowMeHistoryRounds from '@/components/knowMe/KnowMeHistoryRounds.vue';
import KnowMeOpenRounds from '@/components/knowMe/KnowMeOpenRounds.vue';
import KnowMeOwnRounds from '@/components/knowMe/KnowMeOwnRounds.vue';
import { useKnowMeStore } from '@/stores/knowMeStore';

const knowMeStore = useKnowMeStore();
const { t } = useI18n();

onMounted(() => {
  knowMeStore.loadRounds();
});
</script>

<template>
  <div class="view-grid">
    <section>
      <p class="eyebrow">{{ t('knowMe.eyebrow') }}</p>
      <h1>{{ t('knowMe.title') }}</h1>
      <p class="muted">
        {{ t('knowMe.intro') }}
      </p>
    </section>

    <FeatureExplainer feature-key="knowMe" :icon="HelpCircle" :title="t('knowMe.howTitle')" :text="t('knowMe.howText')" />

    <p v-if="knowMeStore.error" class="form-error" data-testid="know-me-error">{{ knowMeStore.error }}</p>
    <p v-if="knowMeStore.loading" class="muted">{{ t('knowMe.loading') }}</p>

    <KnowMeComposer />
    <KnowMeOpenRounds />
    <KnowMeOwnRounds />
    <KnowMeHistoryRounds />
  </div>
</template>
