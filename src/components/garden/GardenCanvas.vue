<script setup lang="ts">
import type { GardenObject } from '@/types/domain';
import GardenObjectMarker from './GardenObjectMarker.vue';

defineProps<{
  objects: GardenObject[];
}>();
</script>

<template>
  <section class="garden-canvas" aria-label="Herzgarten">
    <div class="garden-sky"></div>
    <div class="garden-ground"></div>
    <GardenObjectMarker v-for="object in objects" :key="object.id" :object="object" />
  </section>
</template>
