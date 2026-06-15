<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { adminApiRequest } from '@/admin/services/adminApi';

interface Overview {
  userCount: number;
  coupleCount: number;
  totalHeartPoints: number;
  activeDailyQuestionCount: number;
  questCount: number;
  activeKnowMeQuestionCount: number;
  activeLoveJarTemplateCount: number;
  usesDefaultAdminPassword: boolean;
}

const overview = ref<Overview | null>(null);
const loading = ref(false);
const { t } = useI18n();

async function loadOverview() {
  loading.value = true;
  try {
    overview.value = await adminApiRequest<Overview>('/api/admin/overview');
  } finally {
    loading.value = false;
  }
}

onMounted(loadOverview);
</script>

<template>
  <section class="admin-view" data-testid="admin-dashboard">
    <div class="admin-heading">
      <h1>{{ t('admin.dashboard.title') }}</h1>
    </div>

    <div v-if="loading" class="admin-panel">{{ t('admin.common.loading') }}</div>
    <div v-else-if="overview" class="admin-metric-grid">
      <article class="admin-metric">
        <span>{{ t('admin.dashboard.users') }}</span>
        <strong>{{ overview.userCount }}</strong>
      </article>
      <article class="admin-metric">
        <span>{{ t('admin.dashboard.couples') }}</span>
        <strong>{{ overview.coupleCount }}</strong>
      </article>
      <article class="admin-metric">
        <span>{{ t('admin.dashboard.points') }}</span>
        <strong>{{ overview.totalHeartPoints }}</strong>
      </article>
      <article class="admin-metric">
        <span>{{ t('admin.dashboard.dailyQuestions') }}</span>
        <strong>{{ overview.activeDailyQuestionCount }}</strong>
      </article>
      <article class="admin-metric">
        <span>{{ t('admin.dashboard.quests') }}</span>
        <strong>{{ overview.questCount }}</strong>
      </article>
      <article class="admin-metric">
        <span>{{ t('admin.dashboard.knowMe') }}</span>
        <strong>{{ overview.activeKnowMeQuestionCount }}</strong>
      </article>
      <article class="admin-metric">
        <span>{{ t('admin.dashboard.loveJar') }}</span>
        <strong>{{ overview.activeLoveJarTemplateCount }}</strong>
      </article>
    </div>
  </section>
</template>
