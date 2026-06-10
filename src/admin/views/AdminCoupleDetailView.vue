<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { adminApiRequest } from '@/admin/services/adminApi';

interface CoupleDetail {
  id: string;
  inviteCode: string;
  relationshipType: string;
  contentPreference: string;
  heartPoints: number;
  gardenStage: number;
  createdAt: string;
  members: Array<{ id: string; email: string; displayName: string; role: string; joinedAt: string }>;
  answeredQuestionCount: number;
  dailyAnswerCount: number;
  completedQuestCount: number;
  loveJarNoteCount: number;
  drawnLoveJarNoteCount: number;
  memoryCount: number;
  knowMeRoundCount: number;
  knowMeHitCount: number;
  gardenObjectCount: number;
  lastGardenMomentAt: string | null;
}

const route = useRoute();
const couple = ref<CoupleDetail | null>(null);

async function loadCouple() {
  const payload = await adminApiRequest<{ couple: CoupleDetail }>(`/api/admin/couples/${route.params.id}`);
  couple.value = payload.couple;
}

onMounted(loadCouple);
</script>

<template>
  <section class="admin-view" data-testid="admin-couple-detail">
    <div v-if="couple" class="admin-heading">
      <h1>{{ couple.inviteCode }}</h1>
      <span>{{ couple.heartPoints }} Punkte</span>
    </div>

    <div v-if="couple" class="admin-grid-two">
      <section class="admin-panel">
        <h2>Mitglieder</h2>
        <div v-for="member in couple.members" :key="member.id" class="admin-list-row">
          <strong>{{ member.displayName }}</strong>
          <span>{{ member.email }}</span>
          <small>{{ member.role }}</small>
        </div>
      </section>

      <section class="admin-panel">
        <h2>Fortschritt</h2>
        <div class="admin-metric-grid compact">
          <article class="admin-metric">
            <span>Daily</span>
            <strong>{{ couple.answeredQuestionCount }}</strong>
          </article>
          <article class="admin-metric">
            <span>Antworten</span>
            <strong>{{ couple.dailyAnswerCount }}</strong>
          </article>
          <article class="admin-metric">
            <span>Quests</span>
            <strong>{{ couple.completedQuestCount }}</strong>
          </article>
          <article class="admin-metric">
            <span>Love Jar</span>
            <strong>{{ couple.loveJarNoteCount }}</strong>
          </article>
          <article class="admin-metric">
            <span>Gezogen</span>
            <strong>{{ couple.drawnLoveJarNoteCount }}</strong>
          </article>
          <article class="admin-metric">
            <span>Memories</span>
            <strong>{{ couple.memoryCount }}</strong>
          </article>
          <article class="admin-metric">
            <span>Know Me</span>
            <strong>{{ couple.knowMeRoundCount }}</strong>
          </article>
          <article class="admin-metric">
            <span>Objekte</span>
            <strong>{{ couple.gardenObjectCount }}</strong>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>
