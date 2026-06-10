<script setup lang="ts">
import { onMounted, ref } from 'vue';
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
      <h1>Dashboard</h1>
    </div>

    <div v-if="loading" class="admin-panel">Lade...</div>
    <div v-else-if="overview" class="admin-metric-grid">
      <article class="admin-metric">
        <span>User</span>
        <strong>{{ overview.userCount }}</strong>
      </article>
      <article class="admin-metric">
        <span>Paarräume</span>
        <strong>{{ overview.coupleCount }}</strong>
      </article>
      <article class="admin-metric">
        <span>Punkte</span>
        <strong>{{ overview.totalHeartPoints }}</strong>
      </article>
      <article class="admin-metric">
        <span>Daily Questions</span>
        <strong>{{ overview.activeDailyQuestionCount }}</strong>
      </article>
      <article class="admin-metric">
        <span>Quests</span>
        <strong>{{ overview.questCount }}</strong>
      </article>
      <article class="admin-metric">
        <span>Know Me</span>
        <strong>{{ overview.activeKnowMeQuestionCount }}</strong>
      </article>
      <article class="admin-metric">
        <span>Love Jar</span>
        <strong>{{ overview.activeLoveJarTemplateCount }}</strong>
      </article>
    </div>
  </section>
</template>
