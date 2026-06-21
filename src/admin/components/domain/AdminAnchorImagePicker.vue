<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  src: string;
  anchorX: number;
  anchorY: number;
  testId?: string;
}>();

const emit = defineEmits<{
  'update:anchorX': [value: number];
  'update:anchorY': [value: number];
}>();

const { t } = useI18n();
const anchorPreview = ref<HTMLElement | null>(null);
const draggingAnchor = ref(false);

function clampUnit(value: number) {
  return Math.min(1, Math.max(0, value));
}

function roundAnchor(value: number) {
  return Math.round(clampUnit(value) * 100) / 100;
}

function updateAnchorFromPointer(event: PointerEvent) {
  const element = anchorPreview.value;
  if (!element) return;
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  emit('update:anchorX', roundAnchor((event.clientX - rect.left) / rect.width));
  emit('update:anchorY', roundAnchor((event.clientY - rect.top) / rect.height));
}

function beginAnchorDrag(event: PointerEvent) {
  if (!props.src) return;
  draggingAnchor.value = true;
  updateAnchorFromPointer(event);
  const target = event.currentTarget;
  if (target instanceof HTMLElement) target.setPointerCapture(event.pointerId);
}

function moveAnchorDrag(event: PointerEvent) {
  if (!draggingAnchor.value) return;
  updateAnchorFromPointer(event);
}

function endAnchorDrag(event: PointerEvent) {
  draggingAnchor.value = false;
  const target = event.currentTarget;
  if (target instanceof HTMLElement && target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
}
</script>

<template>
  <div v-if="src" class="admin-anchor-preview-wrap">
    <div
      class="admin-anchor-preview"
      :class="{ 'is-dragging': draggingAnchor }"
      :data-testid="testId"
      @pointerdown="beginAnchorDrag"
      @pointermove="moveAnchorDrag"
      @pointerup="endAnchorDrag"
      @pointercancel="endAnchorDrag"
    >
      <div ref="anchorPreview" class="admin-anchor-image-frame">
        <img :src="src" alt="" draggable="false" />
        <span
          class="admin-anchor-point"
          :style="{ left: `${clampUnit(anchorX) * 100}%`, top: `${clampUnit(anchorY) * 100}%` }"
          :aria-label="t('admin.gardenAssets.anchorPoint')"
        ></span>
      </div>
    </div>
    <small>{{ t('admin.gardenAssets.anchorDragHelp') }}</small>
  </div>
</template>
