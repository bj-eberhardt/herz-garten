<script setup lang="ts">
import { ref, watch } from 'vue';
import { Pencil } from '@lucide/vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
  defineProps<{
    label: string;
    value?: string | null;
    inputType?: string;
    inputAriaLabel: string;
    editAriaLabel: string;
    testIdPrefix: string;
    editing: boolean;
    saving: boolean;
    error?: string;
    success?: string;
  }>(),
  {
    value: '',
    inputType: 'text',
    error: '',
    success: '',
  },
);

const emit = defineEmits<{
  edit: [];
  save: [value: string];
}>();

const { t } = useI18n();
const draft = ref(props.value ?? '');

watch(
  () => [props.value, props.editing] as const,
  ([value, editing]) => {
    if (editing) draft.value = value ?? '';
  },
);

function startEdit() {
  draft.value = props.value ?? '';
  emit('edit');
}
</script>

<template>
  <div class="profile-row" :data-testid="`${testIdPrefix}-row`">
    <strong>{{ label }}</strong>
    <form v-if="editing" class="profile-edit-form" novalidate @submit.prevent="emit('save', draft)">
      <input v-model="draft" :type="inputType" :aria-label="inputAriaLabel" :data-testid="`${testIdPrefix}-input`" />
      <button class="secondary-button compact-button" type="submit" :disabled="saving" :data-testid="`${testIdPrefix}-save`">
        {{ saving ? t('common.saving') : t('common.save') }}
      </button>
    </form>
    <template v-else>
      <span :data-testid="`${testIdPrefix}-value`">{{ value }}</span>
      <button class="icon-button" type="button" :aria-label="editAriaLabel" :data-testid="`${testIdPrefix}-edit`" @click="startEdit">
        <Pencil :size="18" aria-hidden="true" />
      </button>
    </template>
    <p v-if="error" class="profile-field-error" :data-testid="`${testIdPrefix}-error`">{{ error }}</p>
    <p v-if="success" class="field-success" :data-testid="`${testIdPrefix}-success`">{{ success }}</p>
  </div>
</template>
