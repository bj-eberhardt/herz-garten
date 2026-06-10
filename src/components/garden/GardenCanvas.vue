<script setup lang="ts">
import type { GardenObject } from '@/types/domain';
import { i18n } from '@/i18n';
import GardenObjectMarker from './GardenObjectMarker.vue';

defineProps<{
  objects: GardenObject[];
}>();

defineEmits<{
  select: [objectId: string];
}>();
</script>

<template>
  <section class="garden-canvas" :aria-label="i18n.global.t('garden.canvasLabel')" data-testid="garden-canvas">
    <div class="garden-sky"></div>
    <div class="garden-ground"></div>
    <GardenObjectMarker
      v-for="object in objects"
      :key="object.id"
      :object="object"
      @select="$emit('select', object.id)"
    />
  </section>
</template>
