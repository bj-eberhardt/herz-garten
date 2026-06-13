<script setup lang="ts">
import { ref, watch } from 'vue';
import { Pencil } from '@lucide/vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
  defineProps<{
    editing: boolean;
    saving: boolean;
    error?: string;
    success?: string;
  }>(),
  {
    error: '',
    success: '',
  },
);

const emit = defineEmits<{
  edit: [];
  save: [passwords: { currentPassword: string; newPassword: string }];
}>();

const { t } = useI18n();
const currentPassword = ref('');
const newPassword = ref('');

watch(
  () => props.editing,
  (editing) => {
    if (!editing) {
      currentPassword.value = '';
      newPassword.value = '';
    }
  },
);

function startEdit() {
  currentPassword.value = '';
  newPassword.value = '';
  emit('edit');
}

function save() {
  emit('save', {
    currentPassword: currentPassword.value,
    newPassword: newPassword.value,
  });
}
</script>

<template>
  <div class="profile-row" data-testid="settings-password-row">
    <strong>{{ t('settings.password') }}</strong>
    <form v-if="editing" class="profile-edit-form password-edit-form" novalidate @submit.prevent="save">
      <input
        v-model="currentPassword"
        type="password"
        autocomplete="current-password"
        :placeholder="t('settings.currentPassword')"
        :aria-label="t('settings.currentPassword')"
        data-testid="settings-current-password-input"
      />
      <input
        v-model="newPassword"
        type="password"
        autocomplete="new-password"
        :placeholder="t('settings.newPassword')"
        :aria-label="t('settings.newPassword')"
        data-testid="settings-new-password-input"
      />
      <button class="secondary-button compact-button" type="submit" :disabled="saving" data-testid="settings-password-save">
        {{ saving ? t('common.saving') : t('common.save') }}
      </button>
    </form>
    <template v-else>
      <span data-testid="settings-password-value">********</span>
      <button class="icon-button" type="button" :aria-label="t('settings.editPassword')" data-testid="settings-password-edit" @click="startEdit">
        <Pencil :size="18" aria-hidden="true" />
      </button>
    </template>
    <p v-if="error" class="profile-field-error" data-testid="settings-password-error">{{ error }}</p>
    <p v-if="success" class="field-success" data-testid="settings-password-success">{{ success }}</p>
  </div>
</template>
