<script setup lang="ts">
import { computed, onMounted } from 'vue';
import GardenCanvas from '@/components/garden/GardenCanvas.vue';
import { useGardenStore } from '@/stores/gardenStore';

const gardenStore = useGardenStore();

const detailTitle = computed(() => {
  const source = gardenStore.selectedDetail?.source;
  const object = gardenStore.selectedDetail?.object;
  if (!source || !object) return object?.label ?? 'Gartenmoment';
  if (source.type === 'question') return 'Tagesfrage';
  if (source.type === 'quest') return String(source.title);
  if (source.type === 'love_jar') return 'Love-Jar-Zettel';
  if (source.type === 'memory') return String(source.title);
  if (source.type === 'know_me') return 'Wie gut kennst du mich?';
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

  return typeof rawDate === 'string'
    ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' }).format(new Date(rawDate))
    : '';
});

const celebrationText = computed(() => {
  const source = gardenStore.selectedDetail?.source;
  const object = gardenStore.selectedDetail?.object;
  if (!source || !object) return 'Dieser Gartenmoment gehoert zu eurer gemeinsamen Geschichte.';
  if (source.type === 'question') return 'Diese Blume ist gewachsen, weil ihr beide euch Zeit fuer dieselbe Frage genommen habt.';
  if (source.type === 'quest') return `Dieses Objekt feiert eure abgeschlossene Quest: ${source.title}.`;
  if (source.type === 'love_jar') return 'Dieses Licht erinnert an einen kleinen Zettel, der in euren Love Jar gelegt wurde.';
  if (source.type === 'memory') return `Dieser Stein bewahrt eure Erinnerung: ${source.title}.`;
  if (source.type === 'know_me') return 'Diese besondere Blume ist gewachsen, weil ihr euch richtig eingeschaetzt habt.';
  return object.label;
});

const progressItems = computed(() => [
  { label: 'Tagesfragen', value: gardenStore.progress.answeredQuestionCount, detail: 'gemeinsam freigeschaltet' },
  { label: 'Quests', value: gardenStore.progress.completedQuestCount, detail: 'abgeschlossen' },
  {
    label: 'Love Jar',
    value: gardenStore.progress.drawnLoveJarNoteCount,
    detail: `${gardenStore.progress.loveJarNoteCount} Zettel im Glas`,
  },
  { label: 'Erinnerungen', value: gardenStore.progress.memoryCount, detail: 'in der Timeline' },
  {
    label: 'Kennst du mich',
    value: gardenStore.progress.knowMeHitCount,
    detail: `${gardenStore.progress.knowMeRoundCount} gespielte Fragen`,
  },
  { label: 'Gartenobjekte', value: gardenStore.progress.gardenObjectCount, detail: 'sichtbare Momente' },
]);

onMounted(() => {
  gardenStore.loadGarden();
});
</script>

<template>
  <div class="view-grid">
    <section>
      <p class="eyebrow">Herzgarten</p>
      <h1>Eure gemeinsamen Momente werden sichtbar.</h1>
    </section>
    <p v-if="gardenStore.error" class="form-error">{{ gardenStore.error }}</p>
    <p v-if="gardenStore.loading" class="muted">Garten wird geladen...</p>

    <section class="garden-progress panel" data-testid="garden-progress">
      <div>
        <p class="eyebrow">Fortschritt</p>
        <h2>Euer Garten waechst durch echte Momente.</h2>
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
        <button class="secondary-button inline-button" type="button" data-testid="garden-detail-close" @click="gardenStore.clearDetail">Schliessen</button>
      </div>

      <div class="celebration-panel" data-testid="garden-detail-celebration">
        <span>Gewachsen</span>
        <p>{{ celebrationText }}</p>
      </div>

      <template v-if="gardenStore.selectedDetail.source?.type === 'question'">
        <p class="detail-label">Erledigt wurde</p>
        <p>{{ gardenStore.selectedDetail.source.question }}</p>
        <div class="answers">
          <p v-for="answer in (gardenStore.selectedDetail.source.answers as any[])" :key="answer.createdAt">
            <strong>{{ answer.displayName }}:</strong> {{ answer.answerText }}
          </p>
        </div>
      </template>

      <template v-else-if="gardenStore.selectedDetail.source?.type === 'quest'">
        <p class="detail-label">Erledigt wurde</p>
        <p>{{ gardenStore.selectedDetail.source.description }}</p>
        <p class="success-note">Belohnung: {{ gardenStore.selectedDetail.source.rewardPoints }} Herzpunkte</p>
      </template>

      <template v-else-if="gardenStore.selectedDetail.source?.type === 'love_jar'">
        <p class="detail-label">Im Love Jar lag</p>
        <p>
          {{
            gardenStore.selectedDetail.source.text ??
            'Dieser Love-Jar-Zettel bleibt verborgen, bis er gezogen wurde.'
          }}
        </p>
        <p class="muted">Von {{ gardenStore.selectedDetail.source.authorName }} · Kategorie {{ gardenStore.selectedDetail.source.category }}</p>
      </template>

      <template v-else-if="gardenStore.selectedDetail.source?.type === 'memory'">
        <p class="detail-label">Festgehalten wurde</p>
        <p>{{ gardenStore.selectedDetail.source.description }}</p>
        <p class="muted">
          {{ gardenStore.selectedDetail.source.date }} - {{ gardenStore.selectedDetail.source.category }} -
          {{ gardenStore.selectedDetail.source.authorName }}
        </p>
      </template>

      <template v-else-if="gardenStore.selectedDetail.source?.type === 'know_me'">
        <p class="detail-label">Richtig eingeschaetzt wurde</p>
        <p>{{ gardenStore.selectedDetail.source.questionText }}</p>
        <div class="answers">
          <p>
            <strong>Richtig:</strong>
            {{
              (gardenStore.selectedDetail.source.options as string[])[
                gardenStore.selectedDetail.source.correctOptionIndex as number
              ]
            }}
          </p>
          <p>
            <strong>Geraten:</strong>
            {{
              (gardenStore.selectedDetail.source.options as string[])[
                gardenStore.selectedDetail.source.selectedOptionIndex as number
              ]
            }}
          </p>
        </div>
        <p class="success-note">Ihr kennt euch ein Stueck besser. +12 Herzpunkte</p>
      </template>

      <p v-else class="muted">Fuer dieses Objekt sind noch keine Details hinterlegt.</p>
    </section>
  </div>
</template>
