<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus, Save } from '@lucide/vue';
import { adminApiRequest } from '@/admin/services/adminApi';
import { ApiError } from '@/services/api';
import { resolveAssetUrl } from '@/services/assetUrls';
import type { GardenAsset, GardenObjectType, GardenSourceType } from '@/types/domain';

interface GardenLevelOption {
  id: string;
  stage: number;
  localizedName: string;
}

interface GardenAssetForm {
  key: string;
  label: string;
  objectType: GardenObjectType;
  sourceTypes: GardenSourceType[];
  stageUnlock: number;
  image: string;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  active: boolean;
  sortOrder: number;
}

const { t } = useI18n();
const items = ref<GardenAsset[]>([]);
const levels = ref<GardenLevelOption[]>([]);
const showForm = ref(false);
const saving = ref(false);
const error = ref('');
const imageFile = ref<File | null>(null);
const imagePreview = ref('');
const editingKey = ref('');
const formAnchor = ref<HTMLElement | null>(null);
const anchorPreview = ref<HTMLElement | null>(null);
const draggingAnchor = ref(false);
const form = reactive<GardenAssetForm>(emptyForm());

const objectTypes: GardenObjectType[] = ['flower', 'tree', 'bench', 'light', 'stone', 'pond', 'decoration'];
const sourceTypes: GardenSourceType[] = ['question', 'quest', 'memory', 'love_jar', 'milestone', 'know_me'];
const isEditing = computed(() => Boolean(editingKey.value));
const assetSizeLabel = computed(() => (form.width && form.height ? `${form.width} x ${form.height} px` : t('admin.gardenAssets.sizeUnknown')));
const stageOptions = computed(() => {
  if (!form.stageUnlock || levels.value.some((level) => level.stage === form.stageUnlock)) return levels.value;
  return [...levels.value, { id: `stage-${form.stageUnlock}`, stage: form.stageUnlock, localizedName: t('admin.gardenAssets.unknownStage') }].sort(
    (left, right) => left.stage - right.stage,
  );
});

function normalizeAsset(asset: GardenAsset): GardenAsset {
  return {
    ...asset,
    image: resolveAssetUrl(asset.image),
  };
}

function emptyForm(): GardenAssetForm {
  return {
    key: '',
    label: '',
    objectType: 'decoration',
    sourceTypes: [],
    stageUnlock: 1,
    image: '',
    width: 0,
    height: 0,
    anchorX: 0.5,
    anchorY: 0.9,
    active: true,
    sortOrder: 0,
  };
}

function replaceForm(nextForm: GardenAssetForm) {
  for (const key of Object.keys(form)) delete (form as unknown as Record<string, unknown>)[key];
  Object.assign(form, nextForm);
}

function assetPayload() {
  const payload = new FormData();
  payload.set('key', form.key);
  payload.set('label', form.label);
  payload.set('objectType', form.objectType);
  payload.set('sourceTypes', JSON.stringify(form.sourceTypes));
  payload.set('stageUnlock', String(form.stageUnlock));
  payload.set('anchorX', String(form.anchorX));
  payload.set('anchorY', String(form.anchorY));
  payload.set('active', String(form.active));
  payload.set('sortOrder', String(form.sortOrder));
  if (imageFile.value) payload.set('image', imageFile.value);
  return payload;
}

function resetForm(open = false) {
  replaceForm(emptyForm());
  imageFile.value = null;
  imagePreview.value = '';
  editingKey.value = '';
  error.value = '';
  showForm.value = open;
}

async function scrollToForm() {
  await nextTick();
  formAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function openNew() {
  resetForm(true);
  await scrollToForm();
}

async function editAsset(asset: GardenAsset) {
  replaceForm({ ...asset });
  editingKey.value = asset.key;
  imageFile.value = null;
  imagePreview.value = '';
  error.value = '';
  showForm.value = true;
  await scrollToForm();
}

async function loadItems() {
  const payload = await adminApiRequest<{ items: GardenAsset[] }>('/api/admin/garden/assets');
  items.value = payload.items.map(normalizeAsset);
}

async function loadLevels() {
  const payload = await adminApiRequest<{ items: GardenLevelOption[] }>('/api/admin/garden/levels');
  levels.value = payload.items
    .map((level) => ({
      id: level.id,
      stage: level.stage,
      localizedName: level.localizedName,
    }))
    .sort((left, right) => left.stage - right.stage);
}

function validateForm() {
  if (!isEditing.value && !/^[a-z0-9_]+$/.test(form.key)) return t('admin.gardenAssets.errors.key');
  if (!form.label.trim()) return t('admin.gardenAssets.errors.label');
  if (!Number.isInteger(Number(form.stageUnlock)) || Number(form.stageUnlock) < 1) return t('admin.gardenAssets.errors.stage');
  if (!isEditing.value && !imageFile.value) return t('admin.gardenAssets.errors.image');
  return '';
}

function localizeAdminError(caught: unknown, fallbackKey: string) {
  if (caught instanceof ApiError && caught.errorKey) {
    const key = `admin.serverErrors.${caught.errorKey}`;
    const translated = t(key, caught.params ?? {});
    if (translated !== key) return translated;
  }
  return t(fallbackKey);
}

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
  form.anchorX = roundAnchor((event.clientX - rect.left) / rect.width);
  form.anchorY = roundAnchor((event.clientY - rect.top) / rect.height);
}

function beginAnchorDrag(event: PointerEvent) {
  if (!imagePreview.value && !form.image) return;
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

function onImageSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  imageFile.value = file;
  imagePreview.value = file ? URL.createObjectURL(file) : '';
  if (!file || !imagePreview.value) return;
  form.width = 0;
  form.height = 0;
  const image = new Image();
  image.onload = () => {
    form.width = image.naturalWidth;
    form.height = image.naturalHeight;
  };
  image.src = imagePreview.value;
}

async function saveAsset() {
  const validationError = validateForm();
  if (validationError) {
    error.value = validationError;
    return;
  }

  saving.value = true;
  try {
    const path = isEditing.value ? `/api/admin/garden/assets/${encodeURIComponent(editingKey.value)}` : '/api/admin/garden/assets';
    const method = isEditing.value ? 'PATCH' : 'POST';
    const payload = await adminApiRequest<{ items: GardenAsset[] }>(path, {
      method,
      body: assetPayload(),
    });
    items.value = payload.items.map(normalizeAsset);
    resetForm(false);
  } catch (caught) {
    error.value = localizeAdminError(caught, 'admin.gardenAssets.errors.save');
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await Promise.all([loadItems(), loadLevels()]);
});
</script>

<template>
  <section class="admin-view" data-testid="admin-garden-assets">
    <div class="admin-heading">
      <h1>{{ t('admin.gardenAssets.title') }}</h1>
      <span>{{ t('admin.gardenAssets.subtitle') }}</span>
    </div>

    <section v-if="showForm" ref="formAnchor" class="admin-panel admin-form" data-testid="admin-garden-asset-form">
      <div class="admin-form-head">
        <h2>{{ isEditing ? t('admin.gardenAssets.editTitle') : t('admin.gardenAssets.newTitle') }}</h2>
        <button class="secondary-button admin-small-button" type="button" @click="resetForm(false)">{{ t('admin.common.close') }}</button>
      </div>
      <p v-if="error" class="form-error">{{ error }}</p>

      <label>{{ t('admin.common.code') }}<input v-model="form.key" :disabled="isEditing" data-testid="admin-garden-asset-key" /></label>
      <label>{{ t('admin.common.label') }}<input v-model="form.label" data-testid="admin-garden-asset-label" /></label>
      <label>
        {{ t('admin.gardenAssets.objectType') }}
        <select v-model="form.objectType">
          <option v-for="type in objectTypes" :key="type" :value="type">{{ type }}</option>
        </select>
      </label>
      <label>
        {{ t('admin.gardenAssets.stageUnlock') }}
        <select v-model.number="form.stageUnlock">
          <option v-for="level in stageOptions" :key="level.id" :value="level.stage">{{ level.stage }} ({{ level.localizedName }})</option>
        </select>
      </label>
      <label class="admin-checkbox"><input v-model="form.active" type="checkbox" />{{ t('admin.common.active') }}</label>

      <label>
        {{ t('admin.gardenAssets.sourceTypes') }}
        <select v-model="form.sourceTypes" multiple size="6">
          <option v-for="sourceType in sourceTypes" :key="sourceType" :value="sourceType">{{ sourceType }}</option>
        </select>
        <small>{{ t('admin.gardenAssets.sourceTypesHelp') }}</small>
      </label>

      <div class="admin-grid-two admin-even-grid">
        <label>
          {{ t('admin.gardenAssets.anchorX') }}
          <input v-model.number="form.anchorX" type="number" min="0" max="1" step="0.01" />
          <small>{{ t('admin.gardenAssets.anchorXHelp') }}</small>
        </label>
        <label>
          {{ t('admin.gardenAssets.anchorY') }}
          <input v-model.number="form.anchorY" type="number" min="0" max="1" step="0.01" />
          <small>{{ t('admin.gardenAssets.anchorYHelp') }}</small>
        </label>
      </div>

      <label>
        {{ t('admin.gardenAssets.image') }}
        <input type="file" accept="image/png,image/jpeg,image/webp" data-testid="admin-garden-asset-image" @change="onImageSelected" />
      </label>
      <div v-if="imagePreview || form.image" class="admin-anchor-preview-wrap">
        <div
          class="admin-anchor-preview"
          :class="{ 'is-dragging': draggingAnchor }"
          data-testid="admin-garden-asset-preview"
          @pointerdown="beginAnchorDrag"
          @pointermove="moveAnchorDrag"
          @pointerup="endAnchorDrag"
          @pointercancel="endAnchorDrag"
        >
          <div ref="anchorPreview" class="admin-anchor-image-frame">
            <img :src="imagePreview || form.image" alt="" draggable="false" />
            <span
              class="admin-anchor-point"
              :style="{ left: `${clampUnit(form.anchorX) * 100}%`, top: `${clampUnit(form.anchorY) * 100}%` }"
              :aria-label="t('admin.gardenAssets.anchorPoint')"
            ></span>
          </div>
        </div>
        <small>{{ t('admin.gardenAssets.anchorDragHelp') }}</small>
      </div>
      <p class="muted">{{ t('admin.gardenAssets.detectedSize', { size: assetSizeLabel }) }}</p>

      <button class="primary-button" type="button" :disabled="saving" data-testid="admin-garden-asset-save" @click="saveAsset">
        <Save :size="18" aria-hidden="true" />
        {{ saving ? t('admin.common.saving') : t('admin.common.save') }}
      </button>
    </section>

    <div class="admin-table-header">
      <p class="muted">{{ t('admin.gardenAssets.help') }}</p>
      <button class="primary-button" type="button" data-testid="admin-garden-asset-new" @click="openNew">
        <Plus :size="18" aria-hidden="true" />
        {{ t('admin.common.new') }}
      </button>
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>{{ t('admin.gardenAssets.preview') }}</th>
            <th>{{ t('admin.common.code') }}</th>
            <th>{{ t('admin.common.label') }}</th>
            <th>{{ t('admin.gardenAssets.objectType') }}</th>
            <th>{{ t('admin.gardenAssets.sourceTypes') }}</th>
            <th>{{ t('admin.gardenAssets.stageUnlock') }}</th>
            <th>{{ t('admin.common.status') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="asset in items" :key="asset.key">
            <td><img class="admin-asset-thumb" :src="asset.image" alt="" /></td>
            <td><code>{{ asset.key }}</code></td>
            <td>{{ asset.label }}</td>
            <td>{{ asset.objectType }}</td>
            <td>
              <span v-for="sourceType in asset.sourceTypes" :key="sourceType" class="admin-chip">{{ sourceType }}</span>
            </td>
            <td>{{ asset.stageUnlock }}</td>
            <td>{{ asset.active ? t('admin.common.active') : t('admin.common.inactive') }}</td>
            <td class="admin-actions">
              <button class="secondary-button admin-small-button" type="button" @click="editAsset(asset)">{{ t('admin.common.edit') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
