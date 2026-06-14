<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ChevronLeft, ChevronRight, Home, Info, Lock, Move } from '@lucide/vue';
import type { GardenArea, GardenAreaKey, GardenAsset, GardenObject, GardenUnlock } from '@/types/domain';
import { i18n } from '@/i18n';
import GardenObjectSprite from './GardenObjectSprite.vue';

const props = defineProps<{
  objects: GardenObject[];
  areas: GardenArea[];
  unlocks: GardenUnlock[];
  assets: GardenAsset[];
  gardenStage: number;
  heartPoints: number;
  selectedObjectId?: string;
}>();

const emit = defineEmits<{
  select: [objectId: string];
  place: [
    objectId: string,
    placement: {
      areaKey: GardenAreaKey;
      positionX: number;
      positionY: number;
      zIndex: number;
      scale: number;
      rotation: number;
    },
  ];
}>();

const editing = ref(false);
const activeAreaKey = ref<GardenAreaKey | 'all'>('all');
const viewport = ref<HTMLElement | null>(null);
const areaElements = ref<Record<string, HTMLElement | null>>({});
const draftPlacements = ref<Record<string, { areaKey: GardenAreaKey; positionX: number; positionY: number; zIndex: number }>>({});
const canScrollLeft = ref(false);
const canScrollRight = ref(false);
const scrollDrag = ref<{ pointerId: number; startX: number; startLeft: number; dragged: boolean } | null>(null);
const suppressClickAfterScrollDrag = ref(false);

const assetByKey = computed(() => new Map(props.assets.map((asset) => [asset.key, asset])));
const unlockedAreas = computed(() => props.areas.filter((area) => area.stageUnlock <= props.gardenStage));
const unlockedAreaKeys = computed(() => new Set(unlockedAreas.value.map((area) => area.key)));
const worldWidth = computed(() => {
  const lastArea = props.areas[props.areas.length - 1];
  return lastArea ? lastArea.startX + lastArea.width : 1600;
});
const filteredObjects = computed(() =>
  (activeAreaKey.value === 'all' ? props.objects : props.objects.filter((object) => object.areaKey === activeAreaKey.value)).filter(
    (object) => unlockedAreaKeys.value.has(object.areaKey),
  ),
);
const legendItems = computed(() => {
  const usedAssets = new Map<string, { asset?: GardenAsset; label: string; count: number }>();
  for (const object of props.objects.filter((item) => unlockedAreaKeys.value.has(item.areaKey))) {
    const current = usedAssets.get(object.assetKey);
    if (current) {
      current.count += 1;
    } else {
      usedAssets.set(object.assetKey, {
        asset: assetByKey.value.get(object.assetKey),
        label: assetByKey.value.get(object.assetKey)?.label ?? object.label,
        count: 1,
      });
    }
  }
  return Array.from(usedAssets.entries()).map(([assetKey, item]) => ({ assetKey, ...item }));
});

function unlockPoints(area: GardenArea) {
  return Math.max(0, props.unlocks.find((unlock) => unlock.stage === area.stageUnlock)?.points ?? 0);
}

function remainingPoints(area: GardenArea) {
  return Math.max(0, unlockPoints(area) - props.heartPoints);
}

function displayObject(object: GardenObject) {
  const draft = draftPlacements.value[object.id];
  return draft ? { ...object, ...draft } : object;
}

function setAreaRef(key: string, element: unknown) {
  areaElements.value[key] = element instanceof HTMLElement ? element : null;
}

function scrollToArea(areaKey: GardenAreaKey) {
  const area = props.areas.find((item) => item.key === areaKey);
  if (!viewport.value || !area) return;
  viewport.value.scrollTo({ left: Math.max(0, area.startX - 24), behavior: 'smooth' });
}

function scrollHome() {
  viewport.value?.scrollTo({ left: 0, behavior: 'smooth' });
}

function updateScrollButtons() {
  const element = viewport.value;
  if (!element) {
    canScrollLeft.value = false;
    canScrollRight.value = false;
    return;
  }

  const maxScrollLeft = Math.max(0, element.scrollWidth - element.clientWidth);
  canScrollLeft.value = element.scrollLeft > 8;
  canScrollRight.value = element.scrollLeft < maxScrollLeft - 8;
}

function scrollOneArea(direction: -1 | 1) {
  const element = viewport.value;
  if (!element) return;

  const currentLeft = element.scrollLeft;
  const sortedAreas = [...props.areas].sort((left, right) => left.startX - right.startX);
  const targetArea =
    direction > 0
      ? sortedAreas.find((area) => area.startX > currentLeft + 32)
      : [...sortedAreas].reverse().find((area) => area.startX < currentLeft - 32);

  const targetLeft = targetArea ? targetArea.startX - 24 : direction > 0 ? element.scrollWidth : 0;
  element.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
}

function beginScrollDrag(event: PointerEvent) {
  if (!viewport.value) return;
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  if (event.target instanceof Element && event.target.closest('button, a, input, textarea, select')) return;

  scrollDrag.value = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startLeft: viewport.value.scrollLeft,
    dragged: false,
  };
  viewport.value.setPointerCapture(event.pointerId);
}

function moveScrollDrag(event: PointerEvent) {
  const drag = scrollDrag.value;
  const element = viewport.value;
  if (!drag || !element || drag.pointerId !== event.pointerId) return;

  const deltaX = event.clientX - drag.startX;
  if (Math.abs(deltaX) > 4) drag.dragged = true;
  if (!drag.dragged) return;

  element.scrollLeft = drag.startLeft - deltaX;
  event.preventDefault();
}

function endScrollDrag(event: PointerEvent) {
  const drag = scrollDrag.value;
  const element = viewport.value;
  if (!drag || drag.pointerId !== event.pointerId) return;

  if (element?.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
  suppressClickAfterScrollDrag.value = drag.dragged;
  scrollDrag.value = null;
  window.setTimeout(() => {
    suppressClickAfterScrollDrag.value = false;
  }, 0);
}

function cancelClickAfterScrollDrag(event: MouseEvent) {
  if (!suppressClickAfterScrollDrag.value) return;
  event.preventDefault();
  event.stopPropagation();
}

function beginDrag(object: GardenObject, event: PointerEvent) {
  event.preventDefault();
  event.stopPropagation();
  const target = event.currentTarget;
  if (target instanceof HTMLElement) target.setPointerCapture(event.pointerId);

  const move = (moveEvent: PointerEvent) => {
    const areaElement = areaElements.value[object.areaKey];
    if (!areaElement) return;
    const rect = areaElement.getBoundingClientRect();
    const positionX = Math.min(96, Math.max(4, ((moveEvent.clientX - rect.left) / rect.width) * 100));
    const positionY = Math.min(88, Math.max(28, ((moveEvent.clientY - rect.top) / rect.height) * 100));
    draftPlacements.value[object.id] = {
      areaKey: object.areaKey,
      positionX: Math.round(positionX),
      positionY: Math.round(positionY),
      zIndex: 1 + Math.round(positionY / 10),
    };
  };

  const end = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', end);
    const draft = draftPlacements.value[object.id];
    if (draft) {
      emit('place', object.id, {
        ...draft,
        scale: object.scale,
        rotation: object.rotation,
      });
    }
  };

  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', end, { once: true });
}

watch(
  () => props.selectedObjectId,
  (objectId) => {
    const object = props.objects.find((item) => item.id === objectId);
    if (object) scrollToArea(object.areaKey);
  },
);

watch(worldWidth, () => window.setTimeout(updateScrollButtons, 0));

onMounted(() => {
  updateScrollButtons();
  window.addEventListener('resize', updateScrollButtons);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScrollButtons);
});
</script>

<template>
  <section class="garden-map-shell" :aria-label="i18n.global.t('garden.canvasLabel')" data-testid="garden-canvas">
    <div class="garden-toolbar">
      <button
        class="secondary-button inline-button garden-tool-button"
        :class="{ active: editing }"
        type="button"
        data-testid="garden-edit-toggle"
        @click="editing = !editing"
      >
        <Move :size="18" />
        {{ editing ? i18n.global.t('garden.toolbar.done') : i18n.global.t('garden.toolbar.edit') }}
      </button>
      <button class="secondary-button inline-button garden-tool-button" type="button" @click="scrollHome">
        <Home :size="18" />
        {{ i18n.global.t('garden.toolbar.home') }}
      </button>
      <div class="garden-area-tabs" aria-label="Gartenbereiche">
        <button type="button" :class="{ active: activeAreaKey === 'all' }" @click="activeAreaKey = 'all'">
          {{ i18n.global.t('common.all') }}
        </button>
        <button
          v-for="area in unlockedAreas"
          :key="area.key"
          type="button"
          :class="{ active: activeAreaKey === area.key }"
          @click="
            activeAreaKey = area.key;
            scrollToArea(area.key);
          "
        >
          {{ area.label }}
        </button>
      </div>
    </div>

    <div class="garden-inventory" data-testid="garden-inventory">
      <Info :size="18" />
      <span class="garden-legend-title">{{ i18n.global.t('garden.legendTitle') }}</span>
      <span
        v-for="item in legendItems"
        :key="item.assetKey"
        class="garden-legend-item"
        :title="item.label"
        :aria-label="`${item.label}: ${item.count}`"
        data-testid="garden-legend-item"
      >
        <img v-if="item.asset" :src="item.asset.image" alt="" />
        <small>{{ item.count }}</small>
      </span>
      <span v-if="legendItems.length === 0" class="muted">{{ i18n.global.t('garden.legendEmpty') }}</span>
    </div>

    <div class="garden-scroll-shell" :class="{ 'is-dragging': scrollDrag?.dragged }">
      <button
        v-if="canScrollLeft"
        class="garden-scroll-arrow garden-scroll-arrow--left"
        type="button"
        aria-label="Ein Beet nach links"
        @click="scrollOneArea(-1)"
      >
        <ChevronLeft :size="24" />
      </button>
      <div
        ref="viewport"
        class="garden-scrollport"
        @scroll="updateScrollButtons"
        @click.capture="cancelClickAfterScrollDrag"
        @pointerdown="beginScrollDrag"
        @pointermove="moveScrollDrag"
        @pointerup="endScrollDrag"
        @pointercancel="endScrollDrag"
      >
        <div class="garden-world" :style="{ width: `${worldWidth}px` }">
          <section
            v-for="area in areas"
            :key="area.key"
            :ref="(element) => setAreaRef(area.key, element)"
            class="garden-area"
            :class="{ 'garden-area--locked': area.stageUnlock > gardenStage }"
            :style="{
              left: `${area.startX}px`,
              width: `${area.width}px`,
              '--area-accent': area.accent,
              '--area-background': `url(${area.backgroundImage})`,
            }"
            :aria-label="area.label"
          >
            <div class="garden-area-sky"></div>
            <div class="garden-area-ground"></div>
            <div class="garden-area-path"></div>
            <div class="garden-area-label">
              <strong>{{ area.label }}</strong>
              <span>{{ i18n.global.t('garden.stageLabel', { stage: area.stageUnlock }) }}</span>
            </div>
            <div v-if="area.stageUnlock > gardenStage" class="garden-lock" data-testid="garden-locked-area">
              <Lock :size="18" />
              <span>
                {{
                  i18n.global.t('garden.unlockAtPoints', { stage: area.stageUnlock, points: unlockPoints(area), remaining: remainingPoints(area) })
                }}
              </span>
            </div>

            <GardenObjectSprite
              v-for="object in filteredObjects.filter((item) => item.areaKey === area.key)"
              :key="object.id"
              :object="displayObject(object)"
              :asset="assetByKey.get(object.assetKey)"
              :editing="editing"
              :selected="selectedObjectId === object.id"
              @select="$emit('select', object.id)"
              @drag-start="beginDrag(object, $event)"
            />
          </section>
        </div>
      </div>
      <button
        v-if="canScrollRight"
        class="garden-scroll-arrow garden-scroll-arrow--right"
        type="button"
        aria-label="Ein Beet nach rechts"
        @click="scrollOneArea(1)"
      >
        <ChevronRight :size="24" />
      </button>
    </div>

    <div class="garden-minimap" aria-hidden="true">
      <button
        v-for="area in unlockedAreas"
        :key="area.key"
        type="button"
        :style="{ '--area-accent': area.accent, width: `${(area.width / worldWidth) * 100}%` }"
        @click="scrollToArea(area.key)"
      ></button>
    </div>
  </section>
</template>
