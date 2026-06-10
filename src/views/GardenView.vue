<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import GardenCanvas from '@/components/garden/GardenCanvas.vue';
import { useGardenStore } from '@/stores/gardenStore';

const gardenStore = useGardenStore();
const { t, d } = useI18n();

const detailTitle = computed(() => {
  const source = gardenStore.selectedDetail?.source;
  const object = gardenStore.selectedDetail?.object;
  if (!source || !object) return object?.label ?? t('garden.defaultTitle');
  if (source.type === 'question') return t('garden.dailyQuestion');
  if (source.type === 'quest') return String(source.title);
  if (source.type === 'love_jar') return t('garden.loveJarNote');
  if (source.type === 'memory') return String(source.title);
  if (source.type === 'know_me') return t('garden.knowMe');
  return object.label;
});

const detailDate = computed(() => {
  const source = gardenStore.selectedDetail?.source;
  const object = gardenStore.selectedDetail?.object;
  const rawDate =
    source?.type === 'question'
      ? source.date
      : source?.type === 'quest'
        ? source.completedAt
        : source?.type === 'love_jar'
          ? source.drawnAt ?? source.createdAt
          : source?.type === 'memory'
            ? source.date
            : source?.type === 'know_me'
              ? source.guessCreatedAt ?? source.answeredAt ?? source.createdAt
              : object?.createdAt;

  return typeof rawDate === 'string' ? d(new Date(rawDate), 'long') : '';
});

const celebrationText = computed(() => {
  const source = gardenStore.selectedDetail?.source;
  const object = gardenStore.selectedDetail?.object;
  if (!source || !object) return t('garden.celebration.default');
  if (source.type === 'question') return t('garden.celebration.question');
  if (source.type === 'quest') return t('garden.celebration.quest', { title: source.title });
  if (source.type === 'love_jar') return t('garden.celebration.loveJar');
  if (source.type === 'memory') return t('garden.celebration.memory', { title: source.title });
  if (source.type === 'know_me') return t('garden.celebration.knowMe');
  return object.label;
});

const progressItems = computed(() => [
  { label: t('garden.progress.dailyQuestions'), value: gardenStore.progress.answeredQuestionCount, detail: t('garden.progress.dailyQuestionsDetail') },
  { label: t('garden.progress.quests'), value: gardenStore.progress.completedQuestCount, detail: t('garden.progress.questsDetail') },
  {
    label: t('garden.progress.loveJar'),
    value: gardenStore.progress.drawnLoveJarNoteCount,
    detail: t('garden.progress.loveJarDetail', { count: gardenStore.progress.loveJarNoteCount }),
  },
  { label: t('garden.progress.memories'), value: gardenStore.progress.memoryCount, detail: t('garden.progress.memoriesDetail') },
  {
    label: t('garden.progress.knowMe'),
    value: gardenStore.progress.knowMeHitCount,
    detail: t('garden.progress.knowMeDetail', { count: gardenStore.progress.knowMeRoundCount }),
  },
  { label: t('garden.progress.gardenObjects'), value: gardenStore.progress.gardenObjectCount, detail: t('garden.progress.gardenObjectsDetail') },
]);

onMounted(() => {
  gardenStore.loadGarden();
});
</script>

<template>
  <div class="view-grid">
    <section>
      <p class="eyebrow">{{ t('garden.eyebrow') }}</p>
      <h1>{{ t('garden.title') }}</h1>
    </section>
    <p v-if="gardenStore.error" class="form-error">{{ gardenStore.error }}</p>
    <p v-if="gardenStore.loading" class="muted">{{ t('garden.loading') }}</p>

    <section class="garden-progress panel" data-testid="garden-progress">
      <div>
        <p class="eyebrow">{{ t('garden.progressEyebrow') }}</p>
        <h2>{{ t('garden.progressTitle') }}</h2>
      </div>
      <div class="progress-grid">
        <article v-for="item in progressItems" :key="item.label" class="progress-tile" data-testid="garden-progress-item">
          <strong>{{ item.value }}</strong>
          <span>{{ item.label }}</span>
          <small>{{ item.detail }}</small>
        </article>
      </div>
    </section>

    <GardenCanvas :objects="gardenStore.objects" @select="gardenStore.loadObjectDetail" />

    <section v-if="gardenStore.selectedDetail" class="panel detail-panel" data-testid="garden-detail">
      <div class="detail-header">
        <div>
          <p class="eyebrow">{{ gardenStore.selectedDetail.object.sourceType }}</p>
          <h2>{{ detailTitle }}</h2>
          <p class="muted" data-testid="garden-detail-date">{{ detailDate }}</p>
        </div>
        <button class="secondary-button inline-button" type="button" data-testid="garden-detail-close" @click="gardenStore.clearDetail">{{ t('common.close') }}</button>
      </div>

      <div class="celebration-panel" data-testid="garden-detail-celebration">
        <span>{{ t('garden.grown') }}</span>
        <p>{{ celebrationText }}</p>
      </div>

      <template v-if="gardenStore.selectedDetail.source?.type === 'question'">
        <p class="detail-label">{{ t('garden.doneWas') }}</p>
        <p>{{ gardenStore.selectedDetail.source.question }}</p>
        <div class="answers">
          <p v-for="answer in (gardenStore.selectedDetail.source.answers as any[])" :key="answer.createdAt">
            <strong>{{ answer.displayName }}:</strong> {{ answer.answerText }}
          </p>
        </div>
      </template>

      <template v-else-if="gardenStore.selectedDetail.source?.type === 'quest'">
        <p class="detail-label">{{ t('garden.doneWas') }}</p>
        <p>{{ gardenStore.selectedDetail.source.description }}</p>
        <p class="success-note">{{ t('garden.rewardPoints', { count: gardenStore.selectedDetail.source.rewardPoints }) }}</p>
      </template>

      <template v-else-if="gardenStore.selectedDetail.source?.type === 'love_jar'">
        <p class="detail-label">{{ t('garden.inLoveJar') }}</p>
        <p>{{ gardenStore.selectedDetail.source.text ?? t('garden.hiddenLoveJar') }}</p>
        <p class="muted">
          {{ t('garden.loveJarMeta', { author: gardenStore.selectedDetail.source.authorName, category: gardenStore.selectedDetail.source.category }) }}
        </p>
      </template>

      <template v-else-if="gardenStore.selectedDetail.source?.type === 'memory'">
        <p class="detail-label">{{ t('garden.recordedWas') }}</p>
        <p>{{ gardenStore.selectedDetail.source.description }}</p>
        <p class="muted">
          {{ gardenStore.selectedDetail.source.date }} - {{ gardenStore.selectedDetail.source.category }} -
          {{ gardenStore.selectedDetail.source.authorName }}
        </p>
      </template>

      <template v-else-if="gardenStore.selectedDetail.source?.type === 'know_me'">
        <p class="detail-label">{{ t('garden.guessedCorrectlyWas') }}</p>
        <p>{{ gardenStore.selectedDetail.source.questionText }}</p>
        <div class="answers">
          <p>
            <strong>{{ t('garden.correct') }}</strong>
            {{
              (gardenStore.selectedDetail.source.options as string[])[
                gardenStore.selectedDetail.source.correctOptionIndex as number
              ]
            }}
          </p>
          <p>
            <strong>{{ t('garden.guessed') }}</strong>
            {{
              (gardenStore.selectedDetail.source.options as string[])[
                gardenStore.selectedDetail.source.selectedOptionIndex as number
              ]
            }}
          </p>
        </div>
        <p class="success-note">{{ t('garden.knowMeSuccess') }}</p>
      </template>

      <p v-else class="muted">{{ t('garden.noDetails') }}</p>
    </section>
  </div>
</template>
