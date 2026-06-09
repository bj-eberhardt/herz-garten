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
  return object.label;
});

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
    <GardenCanvas :objects="gardenStore.objects" @select="gardenStore.loadObjectDetail" />

    <section v-if="gardenStore.selectedDetail" class="panel detail-panel">
      <div class="detail-header">
        <div>
          <p class="eyebrow">{{ gardenStore.selectedDetail.object.sourceType }}</p>
          <h2>{{ detailTitle }}</h2>
        </div>
        <button class="secondary-button inline-button" type="button" @click="gardenStore.clearDetail">Schliessen</button>
      </div>

      <template v-if="gardenStore.selectedDetail.source?.type === 'question'">
        <p>{{ gardenStore.selectedDetail.source.question }}</p>
        <div class="answers">
          <p v-for="answer in (gardenStore.selectedDetail.source.answers as any[])" :key="answer.createdAt">
            <strong>{{ answer.displayName }}:</strong> {{ answer.answerText }}
          </p>
        </div>
      </template>

      <template v-else-if="gardenStore.selectedDetail.source?.type === 'quest'">
        <p>{{ gardenStore.selectedDetail.source.description }}</p>
        <p class="muted">Belohnung: {{ gardenStore.selectedDetail.source.rewardPoints }} Herzpunkte</p>
      </template>

      <template v-else-if="gardenStore.selectedDetail.source?.type === 'love_jar'">
        <p>
          {{
            gardenStore.selectedDetail.source.text ??
            'Dieser Love-Jar-Zettel bleibt verborgen, bis er gezogen wurde.'
          }}
        </p>
        <p class="muted">Von {{ gardenStore.selectedDetail.source.authorName }}</p>
      </template>

      <template v-else-if="gardenStore.selectedDetail.source?.type === 'memory'">
        <p>{{ gardenStore.selectedDetail.source.description }}</p>
        <p class="muted">
          {{ gardenStore.selectedDetail.source.date }} - {{ gardenStore.selectedDetail.source.category }} -
          {{ gardenStore.selectedDetail.source.authorName }}
        </p>
      </template>

      <p v-else class="muted">Fuer dieses Objekt sind noch keine Details hinterlegt.</p>
    </section>
  </div>
</template>
