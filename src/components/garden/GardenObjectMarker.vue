<script setup lang="ts">
import { Flower2, Lamp, Landmark, Sprout, TreePine } from '@lucide/vue';
import type { GardenObject } from '@/types/domain';

defineProps<{
  object: GardenObject;
}>();

const iconMap = {
  bench: Landmark,
  decoration: Sprout,
  flower: Flower2,
  light: Lamp,
  pond: Sprout,
  stone: Landmark,
  tree: TreePine,
};
</script>

<template>
  <button
    class="garden-object"
    :style="{ left: `${object.positionX}%`, top: `${object.positionY}%` }"
    :title="object.label"
  >
    <component :is="iconMap[object.type]" :size="24" aria-hidden="true" />
  </button>
</template>
