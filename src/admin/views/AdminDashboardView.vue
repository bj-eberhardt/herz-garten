<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { adminApiRequest } from '@/admin/services/adminApi';
import AdminMetricCard from '@/admin/components/common/AdminMetricCard.vue';
import AdminMetricGrid from '@/admin/components/common/AdminMetricGrid.vue';
import AdminPageHeader from '@/admin/components/common/AdminPageHeader.vue';
import AdminPanel from '@/admin/components/common/AdminPanel.vue';

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
    <AdminPageHeader :title="t('admin.dashboard.title')" />

    <AdminPanel v-if="loading">{{ t('admin.common.loading') }}</AdminPanel>
    <AdminMetricGrid v-else-if="overview">
      <AdminMetricCard :label="t('admin.dashboard.users')" :value="overview.userCount" />
      <AdminMetricCard :label="t('admin.dashboard.couples')" :value="overview.coupleCount" />
      <AdminMetricCard :label="t('admin.dashboard.points')" :value="overview.totalHeartPoints" />
      <AdminMetricCard :label="t('admin.dashboard.dailyQuestions')" :value="overview.activeDailyQuestionCount" />
      <AdminMetricCard :label="t('admin.dashboard.quests')" :value="overview.questCount" />
      <AdminMetricCard :label="t('admin.dashboard.knowMe')" :value="overview.activeKnowMeQuestionCount" />
      <AdminMetricCard :label="t('admin.dashboard.loveJar')" :value="overview.activeLoveJarTemplateCount" />
    </AdminMetricGrid>
  </section>
</template>
