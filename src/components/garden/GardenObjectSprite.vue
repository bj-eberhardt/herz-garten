<script setup lang="ts">
import { computed } from 'vue';
import type { GardenAsset, GardenObject } from '@/types/domain';

const props = defineProps<{
  object: GardenObject;
  asset?: GardenAsset;
  editing: boolean;
  selected: boolean;
}>();

const emit = defineEmits<{
  select: [];
  dragStart: [event: PointerEvent];
}>();

const objectTitle = computed(() => `${props.object.label} - +${props.object.rewardPoints} Punkte`);

function selectObject() {
  if (!props.editing) emit('select');
}
</script>

<template>
  <button
    class="garden-sprite"
    :class="{ 'garden-sprite--editing': editing, 'garden-sprite--selected': selected }"
    data-testid="garden-object"
    :style="{
      left: `${object.positionX}%`,
      top: `${object.positionY}%`,
      width: `${(asset?.width ?? 88) * object.scale}px`,
      height: `${(asset?.height ?? 88) * object.scale}px`,
      zIndex: String(object.zIndex),
      '--sprite-rotation': `${object.rotation}deg`,
      '--anchor-x': `${(asset?.anchorX ?? 0.5) * 100}%`,
      '--anchor-y': `${(asset?.anchorY ?? 0.9) * 100}%`,
    }"
    :title="objectTitle"
    type="button"
    @click="selectObject"
    @pointerdown="editing && $emit('dragStart', $event)"
  >
    <img v-if="asset" :src="asset.image" :alt="object.label" draggable="false" />
    <span v-else class="garden-sprite-fallback" aria-hidden="true"></span>
  </button>
</template>
