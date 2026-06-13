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

interface PreferenceItem {
  value: string;
  label: string;
  active: boolean;
}

const route = useRoute();
const couple = ref<CoupleDetail | null>(null);
const relationshipModes = ref<PreferenceItem[]>([]);
const contentStyles = ref<PreferenceItem[]>([]);
const relationshipType = ref('');
const contentPreference = ref('');
const savingPreferences = ref(false);
const preferenceMessage = ref('');
const preferenceError = ref('');

async function loadCouple() {
  const payload = await adminApiRequest<{ couple: CoupleDetail }>(`/api/admin/couples/${route.params.id}`);
  couple.value = payload.couple;
  relationshipType.value = payload.couple.relationshipType;
  contentPreference.value = payload.couple.contentPreference;
}

async function loadPreferences() {
  const [modes, styles] = await Promise.all([
    adminApiRequest<{ items: PreferenceItem[] }>('/api/admin/relationship-modes'),
    adminApiRequest<{ items: PreferenceItem[] }>('/api/admin/content-styles'),
  ]);
  relationshipModes.value = modes.items.filter((item) => item.active);
  contentStyles.value = styles.items.filter((item) => item.active);
}

async function savePreferences() {
  savingPreferences.value = true;
  preferenceMessage.value = '';
  preferenceError.value = '';
  try {
    const payload = await adminApiRequest<{ couple: CoupleDetail }>(`/api/admin/couples/${route.params.id}/preferences`, {
      method: 'PATCH',
      body: JSON.stringify({
        relationshipType: relationshipType.value,
        contentPreference: contentPreference.value,
      }),
    });
    couple.value = payload.couple;
    preferenceMessage.value = 'Einstellungen gespeichert.';
  } catch {
    preferenceError.value = 'Einstellungen konnten nicht gespeichert werden.';
  } finally {
    savingPreferences.value = false;
  }
}

onMounted(async () => {
  await Promise.all([loadCouple(), loadPreferences()]);
});
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

      <section class="admin-panel admin-form" data-testid="admin-couple-preferences">
        <h2>Personalisierung</h2>
        <label>
          Beziehungsmodus
          <select v-model="relationshipType" data-testid="admin-couple-relationship-type">
            <option v-for="mode in relationshipModes" :key="mode.value" :value="mode.value">{{ mode.label }}</option>
          </select>
        </label>
        <label>
          Content-Stil
          <select v-model="contentPreference" data-testid="admin-couple-content-preference">
            <option v-for="style in contentStyles" :key="style.value" :value="style.value">{{ style.label }}</option>
          </select>
        </label>
        <p v-if="preferenceMessage" class="success-note">{{ preferenceMessage }}</p>
        <p v-if="preferenceError" class="form-error">{{ preferenceError }}</p>
        <button class="primary-button" type="button" :disabled="savingPreferences" data-testid="admin-couple-preferences-save" @click="savePreferences">
          {{ savingPreferences ? 'Speichere...' : 'Speichern' }}
        </button>
      </section>
    </div>
  </section>
</template>
