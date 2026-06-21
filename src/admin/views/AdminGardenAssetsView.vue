<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus, Save } from '@lucide/vue';
import { adminApiRequest } from '@/admin/services/adminApi';
import { resolveAssetUrl } from '@/services/assetUrls';
import type { GardenAsset, GardenSourceType } from '@/types/domain';
import AdminAnchorImagePicker from '@/admin/components/domain/AdminAnchorImagePicker.vue';
import AdminFormPanel from '@/admin/components/common/AdminFormPanel.vue';
import AdminPageHeader from '@/admin/components/common/AdminPageHeader.vue';
import AdminTable from '@/admin/components/common/AdminTable.vue';
import { localizeAdminApiError } from '@/admin/composables/useAdminApiError';
import { useAdminFormPanel } from '@/admin/composables/useAdminFormPanel';

interface GardenLevelOption {
  id: string;
  stage: number;
  localizedName: string;
}

interface GardenAssetForm {
  key: string;
  label: string;
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
const assetsLoaded = ref(false);
const saving = ref(false);
const error = ref('');
const imageFile = ref<File | null>(null);
const imagePreview = ref('');
const editingKey = ref('');
const form = reactive<GardenAssetForm>(emptyForm());
const { showForm, formAnchor, openForm, closeForm } = useAdminFormPanel();

const sourceTypes: GardenSourceType[] = ['question', 'quest', 'memory', 'love_jar', 'milestone', 'know_me'];
const isEditing = computed(() => Boolean(editingKey.value));
const assetSizeLabel = computed(() => (form.width && form.height ? `${form.width} x ${form.height} px` : t('admin.gardenAssets.sizeUnknown')));
const missingStageOneSources = computed(() => {
  if (!assetsLoaded.value) return [];
  return sourceTypes.filter(
    (sourceType) => !items.value.some((asset) => asset.active && asset.stageUnlock <= 1 && asset.sourceTypes.includes(sourceType)),
  );
});
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

async function openNew() {
  resetForm(false);
  await openForm();
}

async function editAsset(asset: GardenAsset) {
  replaceForm({
    key: asset.key,
    label: asset.label,
    sourceTypes: asset.sourceTypes,
    stageUnlock: asset.stageUnlock,
    image: asset.image,
    width: asset.width,
    height: asset.height,
    anchorX: asset.anchorX,
    anchorY: asset.anchorY,
    active: asset.active,
    sortOrder: asset.sortOrder,
  });
  editingKey.value = asset.key;
  imageFile.value = null;
  imagePreview.value = '';
  error.value = '';
  await openForm();
}

async function loadItems() {
  const payload = await adminApiRequest<{ items: GardenAsset[] }>('/api/admin/garden/assets');
  items.value = payload.items.map(normalizeAsset);
  assetsLoaded.value = true;
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
    error.value = localizeAdminApiError(caught, t, 'admin.gardenAssets.errors.save');
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
    <AdminPageHeader :title="t('admin.gardenAssets.title')" :badge="t('admin.gardenAssets.subtitle')" />

    <p v-if="missingStageOneSources.length" class="admin-warning" data-testid="admin-garden-assets-stage-one-warning">
      <span>{{ t('admin.gardenAssets.stageOneWarning') }}</span>
      <span class="admin-warning-chips">
        <span v-for="sourceType in missingStageOneSources" :key="sourceType" class="admin-chip">{{ sourceType }}</span>
      </span>
    </p>

    <AdminFormPanel
      v-if="showForm"
      ref="formAnchor"
      :title="isEditing ? t('admin.gardenAssets.editTitle') : t('admin.gardenAssets.newTitle')"
      :error="error"
      test-id="admin-garden-asset-form"
      close-test-id="admin-garden-asset-form-close"
      @close="closeForm"
    >
      <template #error><span data-testid="admin-garden-asset-error">{{ error }}</span></template>

      <label>{{ t('admin.common.code') }}<input v-model="form.key" :disabled="isEditing" data-testid="admin-garden-asset-key" /></label>
      <label>{{ t('admin.common.label') }}<input v-model="form.label" data-testid="admin-garden-asset-label" /></label>
      <label>
        {{ t('admin.gardenAssets.stageUnlock') }}
        <select v-model.number="form.stageUnlock" data-testid="admin-garden-asset-stage">
          <option v-for="level in stageOptions" :key="level.id" :value="level.stage">{{ level.stage }} ({{ level.localizedName }})</option>
        </select>
      </label>
      <label class="admin-checkbox"><input v-model="form.active" type="checkbox" data-testid="admin-garden-asset-active" />{{ t('admin.common.active') }}</label>

      <label>
        {{ t('admin.gardenAssets.sourceTypes') }}
        <select v-model="form.sourceTypes" multiple size="6" data-testid="admin-garden-asset-source-types">
          <option v-for="sourceType in sourceTypes" :key="sourceType" :value="sourceType">{{ sourceType }}</option>
        </select>
        <small>{{ t('admin.gardenAssets.sourceTypesHelp') }}</small>
      </label>

      <div class="admin-grid-two admin-even-grid">
        <label>
          {{ t('admin.gardenAssets.anchorX') }}
          <input v-model.number="form.anchorX" type="number" min="0" max="1" step="0.01" data-testid="admin-garden-asset-anchor-x" />
          <small>{{ t('admin.gardenAssets.anchorXHelp') }}</small>
        </label>
        <label>
          {{ t('admin.gardenAssets.anchorY') }}
          <input v-model.number="form.anchorY" type="number" min="0" max="1" step="0.01" data-testid="admin-garden-asset-anchor-y" />
          <small>{{ t('admin.gardenAssets.anchorYHelp') }}</small>
        </label>
      </div>

      <label>
        {{ t('admin.gardenAssets.image') }}
        <input type="file" accept="image/png,image/jpeg,image/webp" data-testid="admin-garden-asset-image" @change="onImageSelected" />
      </label>
      <AdminAnchorImagePicker
        v-model:anchor-x="form.anchorX"
        v-model:anchor-y="form.anchorY"
        :src="imagePreview || form.image"
        test-id="admin-garden-asset-preview"
      />
      <p class="muted">{{ t('admin.gardenAssets.detectedSize', { size: assetSizeLabel }) }}</p>
      <label>{{ t('admin.common.sortOrder') }}<input v-model.number="form.sortOrder" type="number" data-testid="admin-garden-asset-sort-order" /></label>

      <button class="primary-button" type="button" :disabled="saving" data-testid="admin-garden-asset-save" @click="saveAsset">
        <Save :size="18" aria-hidden="true" />
        {{ saving ? t('admin.common.saving') : t('admin.common.save') }}
      </button>
    </AdminFormPanel>

    <div class="admin-table-header">
      <p class="muted">{{ t('admin.gardenAssets.help') }}</p>
      <button class="primary-button" type="button" data-testid="admin-garden-asset-new" @click="openNew">
        <Plus :size="18" aria-hidden="true" />
        {{ t('admin.common.new') }}
      </button>
    </div>

    <AdminTable>
        <thead>
          <tr>
            <th>{{ t('admin.gardenAssets.preview') }}</th>
            <th>{{ t('admin.common.code') }}</th>
            <th>{{ t('admin.common.label') }}</th>
            <th>{{ t('admin.gardenAssets.sourceTypes') }}</th>
            <th>{{ t('admin.gardenAssets.stageUnlock') }}</th>
            <th>{{ t('admin.common.status') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="asset in items" :key="asset.key" :data-testid="`admin-garden-asset-row-${asset.key}`">
            <td><img class="admin-asset-thumb" :src="asset.image" alt="" /></td>
            <td><code>{{ asset.key }}</code></td>
            <td>{{ asset.label }}</td>
            <td>
              <span v-for="sourceType in asset.sourceTypes" :key="sourceType" class="admin-chip">{{ sourceType }}</span>
            </td>
            <td>{{ asset.stageUnlock }}</td>
            <td>{{ asset.active ? t('admin.common.active') : t('admin.common.inactive') }}</td>
            <td class="admin-actions">
              <button class="secondary-button admin-small-button" type="button" :data-testid="`admin-garden-asset-edit-${asset.key}`" @click="editAsset(asset)">{{ t('admin.common.edit') }}</button>
            </td>
          </tr>
        </tbody>
    </AdminTable>
  </section>
</template>
