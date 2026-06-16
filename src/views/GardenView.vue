<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { CheckCircle2, ChevronDown, Flower2, Gem, HeartHandshake, HelpCircle, History, Images, Lamp, Sprout } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import FeatureExplainer from '@/components/common/FeatureExplainer.vue';
import GardenCanvas from '@/components/garden/GardenCanvas.vue';
import GardenObjectDetailPanel from '@/components/garden/GardenObjectDetailPanel.vue';
import KnowMeGardenDetail from '@/components/garden/KnowMeGardenDetail.vue';
import LoveJarGardenDetail from '@/components/garden/LoveJarGardenDetail.vue';
import MemoryGardenDetail from '@/components/garden/MemoryGardenDetail.vue';
import QuestionGardenDetail from '@/components/garden/QuestionGardenDetail.vue';
import QuestGardenDetail from '@/components/garden/QuestGardenDetail.vue';
import { useCoupleStore } from '@/stores/coupleStore';
import { useGardenStore } from '@/stores/gardenStore';

const gardenStore = useGardenStore();
const coupleStore = useCoupleStore();
const { t, d } = useI18n();
const detailPanel = ref<InstanceType<typeof GardenObjectDetailPanel> | null>(null);
const gardenPanel = ref<HTMLElement | null>(null);
const historyList = ref<HTMLElement | null>(null);
const historyOpen = ref(false);
const historyPage = ref(1);
const historyPageSize = 6;

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

const detailObjectPhrase = computed(() => {
  const assetKey = gardenStore.selectedDetail?.object.assetKey;
  return typeof assetKey === 'string' ? t(`garden.assetPhrases.${assetKey}`) : t('garden.assetPhrases.default');
});

const celebrationText = computed(() => {
  const source = gardenStore.selectedDetail?.source;
  const object = gardenStore.selectedDetail?.object;
  if (!source || !object) return t('garden.celebration.default');
  if (source.type === 'question') return t('garden.celebration.question');
  if (source.type === 'quest') return t('garden.celebration.quest', { object: detailObjectPhrase.value, title: source.title });
  if (source.type === 'love_jar') return t('garden.celebration.loveJar');
  if (source.type === 'memory') return t('garden.celebration.memory', { object: detailObjectPhrase.value, title: source.title });
  if (source.type === 'know_me') return t('garden.celebration.knowMe');
  return object.label;
});

const progressItems = computed(() => [
  {
    label: t('garden.progress.dailyQuestions'),
    value: gardenStore.progress.answeredQuestionCount,
    detail: t('garden.progress.dailyQuestionsDetail'),
    icon: Flower2,
    tone: 'rose',
  },
  { label: t('garden.progress.quests'), value: gardenStore.progress.completedQuestCount, detail: t('garden.progress.questsDetail'), icon: CheckCircle2, tone: 'green' },
  {
    label: t('garden.progress.loveJar'),
    value: gardenStore.progress.drawnLoveJarNoteCount,
    detail: t('garden.progress.loveJarDetail', { count: gardenStore.progress.loveJarNoteCount }),
    icon: Lamp,
    tone: 'gold',
  },
  { label: t('garden.progress.memories'), value: gardenStore.progress.memoryCount, detail: t('garden.progress.memoriesDetail'), icon: Images, tone: 'teal' },
  {
    label: t('garden.progress.knowMe'),
    value: gardenStore.progress.knowMeHitCount,
    detail: t('garden.progress.knowMeDetail', { count: gardenStore.progress.knowMeRoundCount }),
    icon: HelpCircle,
    tone: 'violet',
  },
  {
    label: t('garden.progress.gardenObjects'),
    value: gardenStore.progress.gardenObjectCount,
    detail: t('garden.progress.gardenObjectsDetail'),
    icon: HeartHandshake,
    tone: 'clay',
  },
]);

const sortedUnlocks = computed(() => [...gardenStore.unlocks].sort((left, right) => left.stage - right.stage));

const currentUnlockPoints = computed(() => {
  const heartPoints = Number(coupleStore.couple.heartPoints ?? 0);
  const reachedUnlock = [...sortedUnlocks.value].reverse().find((unlock) => unlock.points <= heartPoints);
  return reachedUnlock?.points ?? 0;
});

const levelProgressPercent = computed(() => {
  const nextUnlock = gardenStore.nextUnlock;
  const heartPoints = Number(coupleStore.couple.heartPoints ?? 0);
  if (!nextUnlock) return 100;
  const levelSpan = Math.max(1, nextUnlock.points - currentUnlockPoints.value);
  return Math.min(100, Math.max(0, Math.round(((heartPoints - currentUnlockPoints.value) / levelSpan) * 100)));
});

const levelProgressStyle = computed(() => ({ '--level-progress': `${levelProgressPercent.value}%` }));

const levelMarkers = computed(() => {
  const heartPoints = Number(coupleStore.couple.heartPoints ?? 0);
  return sortedUnlocks.value.map((unlock) => ({
    ...unlock,
    active: unlock.points <= heartPoints,
    current: unlock.stage === coupleStore.couple.gardenStage,
  }));
});

const selectedObjectId = computed(() => gardenStore.selectedDetail?.object.id);
const assetByKey = computed(() => new Map(gardenStore.assetCatalog.map((asset) => [asset.key, asset])));
const historyObjects = computed(() =>
  [...gardenStore.objects].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
);
const historyPageCount = computed(() => Math.max(1, Math.ceil(historyObjects.value.length / historyPageSize)));
const pagedHistoryObjects = computed(() => {
  const start = (historyPage.value - 1) * historyPageSize;
  return historyObjects.value.slice(start, start + historyPageSize);
});

const levelProgressText = computed(() => {
  const nextUnlock = gardenStore.nextUnlock;
  if (!nextUnlock) return t('garden.levelProgressComplete', { stage: coupleStore.couple.gardenStage, points: coupleStore.couple.heartPoints });
  return t('garden.levelProgress', {
    stage: coupleStore.couple.gardenStage,
    points: coupleStore.couple.heartPoints,
    area: nextUnlock.areaLabel,
    remaining: nextUnlock.pointsRemaining,
  });
});

async function selectGardenObject(objectId: string) {
  await gardenStore.loadObjectDetail(objectId);
  historyOpen.value = false;
  await nextTick();
  detailPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function openHistoryObject(objectId: string) {
  await gardenStore.loadObjectDetail(objectId);
  historyOpen.value = false;
  await nextTick();
  gardenPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function scrollToFirstHistoryItem() {
  const firstHistoryItem = historyList.value?.querySelector<HTMLElement>('[data-testid="garden-history-item"]');
  if (!firstHistoryItem) return;
  const top = firstHistoryItem.getBoundingClientRect().top + window.scrollY - 18;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
}

function toggleHistory() {
  const nextOpen = !historyOpen.value;
  historyOpen.value = nextOpen;
  if (!nextOpen) return;
  gardenStore.clearDetail();
}

function historyTypeTitle(sourceType: string) {
  if (sourceType === 'question') return t('garden.history.types.question');
  if (sourceType === 'quest') return t('garden.history.types.quest');
  if (sourceType === 'love_jar') return t('garden.history.types.loveJar');
  if (sourceType === 'memory') return t('garden.history.types.memory');
  if (sourceType === 'know_me') return t('garden.history.types.knowMe');
  return t('garden.history.types.default');
}

const detailSourceTypeTitle = computed(() => {
  const sourceType = gardenStore.selectedDetail?.object.sourceType;
  return typeof sourceType === 'string' ? historyTypeTitle(sourceType) : t('garden.history.types.default');
});

const isQuestionDetail = computed(() => gardenStore.selectedDetail?.source?.type === 'question');
const isKnowMeDetail = computed(() => gardenStore.selectedDetail?.source?.type === 'know_me');
const isQuestDetail = computed(() => gardenStore.selectedDetail?.source?.type === 'quest');
const isMemoryDetail = computed(() => gardenStore.selectedDetail?.source?.type === 'memory');
const isLoveJarDetail = computed(() => gardenStore.selectedDetail?.source?.type === 'love_jar');
const hasCompactGrowthNote = computed(
  () => isQuestionDetail.value || isKnowMeDetail.value || isQuestDetail.value || isMemoryDetail.value || isLoveJarDetail.value,
);

function historyDateTime(createdAt: string) {
  return d(new Date(createdAt), 'shortDateTime');
}

function changeHistoryPage(delta: number) {
  historyPage.value = Math.min(historyPageCount.value, Math.max(1, historyPage.value + delta));
}

onMounted(() => {
  gardenStore.loadGarden();
});

watch(
  () => gardenStore.selectedDetail,
  (selectedDetail) => {
    if (selectedDetail) historyOpen.value = false;
  },
);
</script>

<template>
  <div class="view-grid">
    <section>
      <p class="eyebrow">{{ t('garden.eyebrow') }}</p>
      <h1>{{ t('garden.title') }}</h1>
    </section>
    <FeatureExplainer feature-key="garden" :icon="Sprout" :title="t('garden.howTitle')" :text="t('garden.howText')" />
    <p v-if="gardenStore.error" class="form-error">{{ gardenStore.error }}</p>
    <p v-if="gardenStore.loading" class="muted">{{ t('garden.loading') }}</p>

    <section class="garden-progress panel" data-testid="garden-progress">
      <div class="garden-progress-hero">
        <div class="garden-progress-copy">
          <p class="eyebrow">{{ t('garden.progressEyebrow') }}</p>
          <h2>{{ t('garden.progressTitle') }}</h2>
          <p class="garden-level-progress" data-testid="garden-level-progress">{{ levelProgressText }}</p>
        </div>

        <div class="garden-stage-card">
          <span class="garden-stage-label">{{ t('garden.progress.currentStage') }}</span>
          <strong>{{ coupleStore.couple.gardenStage }}</strong>
          <span>{{ t('garden.progress.heartPoints', coupleStore.couple.heartPoints, { named: { count: coupleStore.couple.heartPoints } }) }}</span>
        </div>
      </div>

      <div class="garden-level-card" :style="levelProgressStyle">
        <div class="garden-level-card__top">
          <span>{{ gardenStore.nextUnlock ? t('garden.progress.nextArea') : t('garden.progress.allAreas') }}</span>
          <strong>{{ gardenStore.nextUnlock?.areaLabel ?? t('garden.progress.blooming') }}</strong>
        </div>
        <div class="garden-level-meter" aria-hidden="true">
          <span></span>
        </div>
        <div class="garden-level-card__bottom">
          <span>{{ levelProgressPercent }}%</span>
          <span v-if="gardenStore.nextUnlock">{{ t('garden.progress.remainingPoints', { count: gardenStore.nextUnlock.pointsRemaining }) }}</span>
          <span v-else>{{ t('garden.progress.completeHint') }}</span>
        </div>
        <div v-if="levelMarkers.length" class="garden-level-markers" aria-hidden="true">
          <span v-for="marker in levelMarkers" :key="marker.stage" :class="{ active: marker.active, current: marker.current }">
            {{ marker.stage }}
          </span>
        </div>
      </div>

      <div class="progress-grid">
        <article v-for="item in progressItems" :key="item.label" class="progress-tile" :class="`progress-tile--${item.tone}`" data-testid="garden-progress-item">
          <span class="progress-tile-icon">
            <component :is="item.icon" aria-hidden="true" />
          </span>
          <span class="progress-tile-copy">
            <strong>{{ item.value }}</strong>
            <span>{{ item.label }}</span>
            <small>{{ item.detail }}</small>
          </span>
        </article>
      </div>
    </section>

    <section ref="gardenPanel">
      <GardenCanvas
        :objects="gardenStore.objects"
        :areas="gardenStore.areas"
        :unlocks="gardenStore.unlocks"
        :assets="gardenStore.assetCatalog"
        :garden-stage="coupleStore.couple.gardenStage"
        :heart-points="coupleStore.couple.heartPoints"
        :selected-object-id="selectedObjectId"
        @select="selectGardenObject"
        @place="gardenStore.updatePlacement"
      />
    </section>

    <button class="history-link" :class="{ open: historyOpen }" type="button" data-testid="garden-history-toggle" @click="toggleHistory">
      <History aria-hidden="true" />
      <span>{{ historyOpen ? t('garden.history.hide') : t('garden.history.show') }}</span>
      <ChevronDown class="history-link-chevron" aria-hidden="true" />
    </button>

    <Transition name="garden-history-expand" @after-enter="scrollToFirstHistoryItem">
      <section v-if="historyOpen" class="panel garden-history" data-testid="garden-history">
      <article class="history-level-card" data-testid="garden-history-next-level">
        <strong>{{ t('garden.history.nextLevelTitle') }}</strong>
        <p>
          💪
          {{
            gardenStore.nextUnlock
              ? t('garden.history.nextLevel', { count: gardenStore.nextUnlock.pointsRemaining, area: gardenStore.nextUnlock.areaLabel })
              : t('garden.history.allUnlocked')
          }}
        </p>
      </article>

      <div ref="historyList" class="garden-history-list">
        <button
          v-for="object in pagedHistoryObjects"
          :key="object.id"
          class="garden-history-item"
          type="button"
          data-testid="garden-history-item"
          @click="openHistoryObject(object.id)"
        >
          <img :src="assetByKey.get(object.assetKey)?.image" alt="" />
          <span>
            <strong>{{ historyTypeTitle(object.sourceType) }}</strong>
            <small data-testid="garden-history-date">{{ historyDateTime(object.createdAt) }}</small>
            <small v-if="object.historyTitle" data-testid="garden-history-context">{{ object.historyTitle }}</small>
          </span>
          <em>+{{ object.rewardPoints }}</em>
        </button>
      </div>

      <div class="history-pagination">
        <button class="secondary-button inline-button" type="button" :disabled="historyPage <= 1" @click="changeHistoryPage(-1)">
          {{ t('garden.history.previous') }}
        </button>
        <span>{{ t('garden.history.page', { current: historyPage, total: historyPageCount }) }}</span>
        <button class="secondary-button inline-button" type="button" :disabled="historyPage >= historyPageCount" @click="changeHistoryPage(1)">
          {{ t('garden.history.next') }}
        </button>
      </div>
      </section>
    </Transition>

    <GardenObjectDetailPanel
      v-if="gardenStore.selectedDetail"
      ref="detailPanel"
      :source-type-title="detailSourceTypeTitle"
      :title="detailTitle"
      :date="detailDate"
      :celebration-text="celebrationText"
      :reward-points="gardenStore.selectedDetail.object.rewardPoints"
      :compact-growth="hasCompactGrowthNote"
      @close="gardenStore.clearDetail"
    >
      <template v-if="isQuestDetail" #growth-icon>
        <CheckCircle2 aria-hidden="true" />
      </template>
      <template v-else-if="isMemoryDetail" #growth-icon>
        <Gem aria-hidden="true" />
      </template>
      <template v-else-if="isLoveJarDetail" #growth-icon>
        <Lamp aria-hidden="true" />
      </template>

      <QuestionGardenDetail v-if="isQuestionDetail && gardenStore.selectedDetail.source" :source="gardenStore.selectedDetail.source" />
      <KnowMeGardenDetail v-else-if="isKnowMeDetail && gardenStore.selectedDetail.source" :source="gardenStore.selectedDetail.source" />
      <QuestGardenDetail v-else-if="isQuestDetail && gardenStore.selectedDetail.source" :source="gardenStore.selectedDetail.source" />
      <MemoryGardenDetail v-else-if="isMemoryDetail && gardenStore.selectedDetail.source" :source="gardenStore.selectedDetail.source" />
      <LoveJarGardenDetail v-else-if="isLoveJarDetail && gardenStore.selectedDetail.source" :source="gardenStore.selectedDetail.source" />

      <p v-else class="muted">{{ t('garden.noDetails') }}</p>
    </GardenObjectDetailPanel>
  </div>
</template>
