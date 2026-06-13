<script setup lang="ts">
import { ShieldCheck } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import EditableProfileRow from '@/components/settings/EditableProfileRow.vue';
import PasswordProfileRow from '@/components/settings/PasswordProfileRow.vue';

type ProfileField = 'displayName' | 'email' | 'password';

withDefaults(
  defineProps<{
    displayName?: string | null;
    email?: string | null;
    inviteCode?: string | null;
    relationshipModeLabel?: string | null;
    contentStyleLabel?: string | null;
    editingField: ProfileField | null;
    saving: boolean;
    errors: Record<ProfileField, string>;
    successes: Record<ProfileField, string>;
    message?: string;
    error?: string;
  }>(),
  {
    displayName: '',
    email: '',
    inviteCode: '',
    relationshipModeLabel: '',
    contentStyleLabel: '',
    message: '',
    error: '',
  },
);

const emit = defineEmits<{
  edit: [field: ProfileField];
  saveProfileField: [field: 'displayName' | 'email', value: string];
  savePassword: [passwords: { currentPassword: string; newPassword: string }];
  exportData: [];
  logout: [];
  leaveCouple: [];
  deleteAccount: [];
}>();

const { t } = useI18n();
</script>

<template>
  <section class="panel settings-list" data-testid="settings-profile-panel">
    <p class="eyebrow">Profileinstellungen</p>
    <EditableProfileRow
      :label="t('settings.user')"
      :value="displayName"
      :input-aria-label="t('common.name')"
      :edit-aria-label="t('settings.editName')"
      test-id-prefix="settings-display-name"
      :editing="editingField === 'displayName'"
      :saving="saving"
      :error="errors.displayName"
      :success="successes.displayName"
      @edit="emit('edit', 'displayName')"
      @save="emit('saveProfileField', 'displayName', $event)"
    />
    <EditableProfileRow
      :label="t('settings.email')"
      :value="email"
      input-type="email"
      :input-aria-label="t('common.email')"
      :edit-aria-label="t('settings.editEmail')"
      test-id-prefix="settings-email"
      :editing="editingField === 'email'"
      :saving="saving"
      :error="errors.email"
      :success="successes.email"
      @edit="emit('edit', 'email')"
      @save="emit('saveProfileField', 'email', $event)"
    />
    <PasswordProfileRow
      :editing="editingField === 'password'"
      :saving="saving"
      :error="errors.password"
      :success="successes.password"
      @edit="emit('edit', 'password')"
      @save="emit('savePassword', $event)"
    />
    <p><strong>{{ t('settings.coupleCode') }}</strong> {{ inviteCode }}</p>
    <p><strong>{{ t('settings.relationshipMode') }}</strong> {{ relationshipModeLabel }}</p>
    <p><strong>{{ t('settings.contentStyle') }}</strong> {{ contentStyleLabel }}</p>
    <p class="privacy-note"><ShieldCheck :size="18" /> {{ t('settings.privacyNote') }}</p>
    <p v-if="message" class="success-note">{{ message }}</p>
    <p v-if="error" class="form-error">{{ error }}</p>

    <div class="settings-actions">
      <button class="secondary-button" type="button" data-testid="settings-export" @click="emit('exportData')">{{ t('settings.exportData') }}</button>
      <button class="secondary-button" type="button" data-testid="settings-logout" @click="emit('logout')">{{ t('settings.logout') }}</button>
      <button class="secondary-button" type="button" data-testid="settings-leave-couple" @click="emit('leaveCouple')">{{ t('settings.leaveCouple') }}</button>
      <button class="danger-button" type="button" data-testid="settings-delete-account" @click="emit('deleteAccount')">{{ t('settings.deleteAccount') }}</button>
    </div>
  </section>
</template>
