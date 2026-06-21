<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { adminApiRequest } from '@/admin/services/adminApi';
import AdminMetricCard from '@/admin/components/common/AdminMetricCard.vue';
import AdminMetricGrid from '@/admin/components/common/AdminMetricGrid.vue';
import AdminPageHeader from '@/admin/components/common/AdminPageHeader.vue';
import AdminPanel from '@/admin/components/common/AdminPanel.vue';

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
    <RouterLink class="secondary-button admin-back-link" data-testid="admin-couple-detail-back" :to="backToCouplesLink()">
      {{ t('admin.coupleDetail.backToCouples') }}
    </RouterLink>

    <AdminPageHeader v-if="couple" :title="couple.inviteCode" :badge="t('admin.users.pointsInline', { count: couple.heartPoints })" />

    <div v-if="couple" class="admin-grid-two">
      <AdminPanel :title="t('admin.coupleDetail.members')">
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
      </AdminPanel>

      <AdminPanel :title="t('admin.coupleDetail.progress')">
        <AdminMetricGrid compact>
          <AdminMetricCard
            :label="t('admin.coupleDetail.dailyQuestions')"
            :value="t('admin.coupleDetail.dailyQuestionsWithAnswers', { questions: couple.answeredQuestionCount, answers: couple.dailyAnswerCount })"
            :title="t('admin.coupleDetail.dailyQuestionsTitle', { questions: couple.answeredQuestionCount, answers: couple.dailyAnswerCount })"
          />
          <AdminMetricCard :label="t('admin.coupleDetail.quests')" :value="couple.completedQuestCount" />
          <AdminMetricCard
            :label="t('admin.coupleDetail.loveJar')"
            :value="t('admin.coupleDetail.loveJarDrawnOfTotal', { drawn: couple.drawnLoveJarNoteCount, total: couple.loveJarNoteCount })"
            :title="t('admin.coupleDetail.loveJarTitle', { drawn: couple.drawnLoveJarNoteCount, total: couple.loveJarNoteCount })"
          />
          <AdminMetricCard :label="t('admin.coupleDetail.memories')" :value="couple.memoryCount" />
          <AdminMetricCard
            :label="t('admin.coupleDetail.knowMe')"
            :value="t('admin.coupleDetail.knowMeHitsOfRounds', { hits: couple.knowMeHitCount, rounds: couple.knowMeRoundCount })"
            :title="t('admin.coupleDetail.knowMeTitle', { hits: couple.knowMeHitCount, rounds: couple.knowMeRoundCount })"
          />
          <AdminMetricCard :label="t('admin.coupleDetail.objects')" :value="couple.gardenObjectCount" />
        </AdminMetricGrid>
      </AdminPanel>

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
        <p v-if="preferenceMessage" class="success-note" data-testid="admin-couple-preferences-success">{{ preferenceMessage }}</p>
        <p v-if="preferenceError" class="form-error" data-testid="admin-couple-preferences-error">{{ preferenceError }}</p>
        <button class="primary-button" type="button" :disabled="savingPreferences" data-testid="admin-couple-preferences-save" @click="savePreferences">
          {{ savingPreferences ? t('admin.common.saving') : t('admin.common.save') }}
        </button>
      </section>
    </div>
  </section>
</template>
