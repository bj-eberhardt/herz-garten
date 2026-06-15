<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
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
const { t } = useI18n();
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
    preferenceMessage.value = t('admin.coupleDetail.settingsSaved');
  } catch {
    preferenceError.value = t('admin.coupleDetail.settingsSaveError');
  } finally {
    savingPreferences.value = false;
  }
}

function roleLabel(role: string) {
  const key = `admin.coupleDetail.roles.${role}`;
  const translated = t(key);
  return translated === key ? t('admin.coupleDetail.roles.unknown') : translated;
}

function userFilterLink(email: string) {
  return { path: '/admin/users', query: { search: email } };
}

function backToCouplesLink() {
  const search = typeof route.query.search === 'string' ? route.query.search : '';
  return { path: '/admin/couples', query: search ? { search } : {} };
}

onMounted(async () => {
  await Promise.all([loadCouple(), loadPreferences()]);
});
</script>

<template>
  <section class="admin-view" data-testid="admin-couple-detail">
    <RouterLink class="secondary-button admin-back-link" :to="backToCouplesLink()">
      {{ t('admin.coupleDetail.backToCouples') }}
    </RouterLink>

    <div v-if="couple" class="admin-heading">
      <h1>{{ couple.inviteCode }}</h1>
      <span>{{ t('admin.users.pointsInline', { count: couple.heartPoints }) }}</span>
    </div>

    <div v-if="couple" class="admin-grid-two">
      <section class="admin-panel">
        <h2>{{ t('admin.coupleDetail.members') }}</h2>
        <div class="admin-member-list">
          <RouterLink v-for="member in couple.members" :key="member.id" class="admin-member-card" :to="userFilterLink(member.email)">
            <span class="admin-member-name">{{ member.displayName }}</span>
            <span class="admin-member-email">{{ member.email }}</span>
            <span class="admin-member-meta">
              <span class="admin-chip">{{ roleLabel(member.role) }}</span>
              <span>{{ t('admin.coupleDetail.memberJoinedAt', { date: new Date(member.joinedAt).toLocaleDateString('de-DE') }) }}</span>
            </span>
          </RouterLink>
        </div>
      </section>

      <section class="admin-panel">
        <h2>{{ t('admin.coupleDetail.progress') }}</h2>
        <div class="admin-metric-grid compact">
          <article class="admin-metric" :title="t('admin.coupleDetail.dailyQuestionsTitle', { questions: couple.answeredQuestionCount, answers: couple.dailyAnswerCount })">
            <span>{{ t('admin.coupleDetail.dailyQuestions') }}</span>
            <strong>{{ t('admin.coupleDetail.dailyQuestionsWithAnswers', { questions: couple.answeredQuestionCount, answers: couple.dailyAnswerCount }) }}</strong>
          </article>
          <article class="admin-metric">
            <span>{{ t('admin.coupleDetail.quests') }}</span>
            <strong>{{ couple.completedQuestCount }}</strong>
          </article>
          <article class="admin-metric" :title="t('admin.coupleDetail.loveJarTitle', { drawn: couple.drawnLoveJarNoteCount, total: couple.loveJarNoteCount })">
            <span>{{ t('admin.coupleDetail.loveJar') }}</span>
            <strong>{{ t('admin.coupleDetail.loveJarDrawnOfTotal', { drawn: couple.drawnLoveJarNoteCount, total: couple.loveJarNoteCount }) }}</strong>
          </article>
          <article class="admin-metric">
            <span>{{ t('admin.coupleDetail.memories') }}</span>
            <strong>{{ couple.memoryCount }}</strong>
          </article>
          <article class="admin-metric" :title="t('admin.coupleDetail.knowMeTitle', { hits: couple.knowMeHitCount, rounds: couple.knowMeRoundCount })">
            <span>{{ t('admin.coupleDetail.knowMe') }}</span>
            <strong>{{ t('admin.coupleDetail.knowMeHitsOfRounds', { hits: couple.knowMeHitCount, rounds: couple.knowMeRoundCount }) }}</strong>
          </article>
          <article class="admin-metric">
            <span>{{ t('admin.coupleDetail.objects') }}</span>
            <strong>{{ couple.gardenObjectCount }}</strong>
          </article>
        </div>
      </section>

      <section class="admin-panel admin-form" data-testid="admin-couple-preferences">
        <h2>{{ t('admin.coupleDetail.personalization') }}</h2>
        <label>
          {{ t('admin.coupleDetail.relationshipMode') }}
          <select v-model="relationshipType" data-testid="admin-couple-relationship-type">
            <option v-for="mode in relationshipModes" :key="mode.value" :value="mode.value">{{ mode.label }}</option>
          </select>
        </label>
        <label>
          {{ t('admin.coupleDetail.contentStyle') }}
          <select v-model="contentPreference" data-testid="admin-couple-content-preference">
            <option v-for="style in contentStyles" :key="style.value" :value="style.value">{{ style.label }}</option>
          </select>
        </label>
        <p v-if="preferenceMessage" class="success-note">{{ preferenceMessage }}</p>
        <p v-if="preferenceError" class="form-error">{{ preferenceError }}</p>
        <button class="primary-button" type="button" :disabled="savingPreferences" data-testid="admin-couple-preferences-save" @click="savePreferences">
          {{ savingPreferences ? t('admin.common.saving') : t('admin.common.save') }}
        </button>
      </section>
    </div>
  </section>
</template>
