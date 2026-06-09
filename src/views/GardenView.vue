<script setup lang="ts">
import { onMounted } from 'vue';
import GardenCanvas from '@/components/garden/GardenCanvas.vue';
import { useGardenStore } from '@/stores/gardenStore';

const gardenStore = useGardenStore();

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
    <GardenCanvas :objects="gardenStore.objects" />
  </div>
</template>
