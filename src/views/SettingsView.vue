<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ShieldCheck } from '@lucide/vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import FeatureExplainer from '@/components/common/FeatureExplainer.vue';
import FeatureExplainerSettingsPanel from '@/components/settings/FeatureExplainerSettingsPanel.vue';
import PrivacyDetailsPanel from '@/components/settings/PrivacyDetailsPanel.vue';
import ProfileSettingsPanel from '@/components/settings/ProfileSettingsPanel.vue';
import PushNotificationsSettingsPanel from '@/components/settings/PushNotificationsSettingsPanel.vue';
import SettingsConfirmDialog from '@/components/settings/SettingsConfirmDialog.vue';
import { FIELD_SUCCESS_VISIBLE_MS } from '@/constants/timing';
import { featureExplainerKeys, useAuthStore } from '@/stores/authStore';
import { usePushStore } from '@/stores/pushStore';
import { localizeApiError } from '@/services/errorMessages';
import type { FeatureExplainerKey, PushNotificationMode } from '@/types/domain';

type ProfileField = 'displayName' | 'email' | 'password';
type ConfirmAction = 'leaveCouple' | 'deleteAccount';

const router = useRouter();
const authStore = useAuthStore();
const pushStore = usePushStore();
const { t } = useI18n();
const message = ref('');
const error = ref('');
const editingField = ref<ProfileField | null>(null);
const profileErrors = reactive<Record<ProfileField, string>>({
  displayName: '',
  email: '',
  password: '',
});
const profileSuccess = reactive<Record<ProfileField, string>>({
  displayName: '',
  email: '',
  password: '',
});
const featureExplainerMessages = reactive<Record<FeatureExplainerKey, string>>(
  Object.fromEntries(featureExplainerKeys.map((key) => [key, ''])) as Record<FeatureExplainerKey, string>,
);
const featureExplainerErrors = reactive<Record<FeatureExplainerKey, string>>(
  Object.fromEntries(featureExplainerKeys.map((key) => [key, ''])) as Record<FeatureExplainerKey, string>,
);
let profileSuccessTimeout: ReturnType<typeof window.setTimeout> | undefined;
let featureExplainerSuccessTimeout: ReturnType<typeof window.setTimeout> | undefined;
const profileSaving = ref(false);
const pushModeSaving = ref(false);
const pushModeMessage = ref('');
const pushModeError = ref('');
const pendingConfirm = ref<ConfirmAction | null>(null);

const featureExplainerItems = computed(() =>
  featureExplainerKeys.map((key) => ({
    key,
    label: t(`settings.featureExplainers.${key}`),
  })),
);
const relationshipModeLabel = computed(
  () =>
    authStore.couple?.relationshipTypeLabel ??
    authStore.relationshipModes.find((item) => item.value === authStore.couple?.relationshipType)?.label ??
    authStore.couple?.relationshipType,
);
const contentStyleLabel = computed(
  () =>
    authStore.couple?.contentPreferenceLabel ??
    authStore.contentStyles.find((item) => item.value === authStore.couple?.contentPreference)?.label ??
    authStore.couple?.contentPreference,
);
const confirmDialog = computed(() => {
  if (pendingConfirm.value === 'deleteAccount') {
    return {
      variant: 'danger' as const,
      title: t('settings.confirmDeleteTitle'),
      message: t('settings.confirmDelete'),
      confirmLabel: t('settings.deleteAccount'),
      titleId: 'delete-confirm-title',
    };
  }
  if ((authStore.couple?.memberCount ?? 0) <= 1) {
    return {
      variant: 'primary' as const,
      title: t('settings.confirmLeaveSoloTitle'),
      message: t('settings.confirmLeaveSolo'),
      confirmLabel: t('settings.leaveSoloCouple'),
      titleId: 'leave-confirm-title',
    };
  }
  return {
    variant: 'primary' as const,
    title: t('settings.confirmLeaveTitle'),
    message: t('settings.confirmLeave'),
    confirmLabel: t('settings.leaveCouple'),
    titleId: 'leave-confirm-title',
  };
});

onMounted(() => {
  pushStore.loadStatus();
});

function clearProfileErrors() {
  profileErrors.displayName = '';
  profileErrors.email = '';
  profileErrors.password = '';
}

function clearProfileSuccess() {
  profileSuccess.displayName = '';
  profileSuccess.email = '';
  profileSuccess.password = '';
  if (profileSuccessTimeout) {
    window.clearTimeout(profileSuccessTimeout);
    profileSuccessTimeout = undefined;
  }
}

function clearFeatureExplainerMessages() {
  for (const key of featureExplainerKeys) {
    featureExplainerMessages[key] = '';
    featureExplainerErrors[key] = '';
  }
  if (featureExplainerSuccessTimeout) {
    window.clearTimeout(featureExplainerSuccessTimeout);
    featureExplainerSuccessTimeout = undefined;
  }
}

function clearPushModeMessages() {
  pushModeMessage.value = '';
  pushModeError.value = '';
}

function showProfileSuccess(field: ProfileField, text: string) {
  clearProfileSuccess();
  profileSuccess[field] = text;
  profileSuccessTimeout = window.setTimeout(() => {
    clearProfileSuccess();
  }, FIELD_SUCCESS_VISIBLE_MS);
}

function showFeatureExplainerSuccess(key: FeatureExplainerKey, text: string) {
  clearFeatureExplainerMessages();
  featureExplainerMessages[key] = text;
  featureExplainerSuccessTimeout = window.setTimeout(() => {
    clearFeatureExplainerMessages();
  }, FIELD_SUCCESS_VISIBLE_MS);
}

function resetPanelMessages() {
  error.value = '';
  message.value = '';
  clearProfileErrors();
  clearProfileSuccess();
  clearFeatureExplainerMessages();
  clearPushModeMessages();
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

async function updateFeatureExplainer(key: FeatureExplainerKey, visible: boolean) {
  error.value = '';
  message.value = '';
  clearProfileErrors();
  clearProfileSuccess();
  clearFeatureExplainerMessages();
  try {
    await authStore.setFeatureExplainerVisible(key, visible);
    showFeatureExplainerSuccess(key, t('settings.hintSettingsSaved'));
  } catch (caught) {
    featureExplainerErrors[key] = localizeApiError(caught, 'errors.fallback.preferences');
  }
}

async function updatePushNotificationMode(mode: PushNotificationMode) {
  if (mode === authStore.pushNotificationMode) return;
  error.value = '';
  message.value = '';
  clearProfileErrors();
  clearProfileSuccess();
  clearFeatureExplainerMessages();
  clearPushModeMessages();
  pushModeSaving.value = true;
  try {
    await authStore.setPushNotificationMode(mode);
    pushModeMessage.value = t('settings.push.modeSaved');
  } catch (caught) {
    pushModeError.value = localizeApiError(caught, 'errors.fallback.preferences');
  } finally {
    pushModeSaving.value = false;
  }
}

function startProfileEdit(field: ProfileField) {
  resetPanelMessages();
  editingField.value = field;
}

async function saveProfileField(field: 'displayName' | 'email', value: string) {
  error.value = '';
  message.value = '';
  clearProfileErrors();
  const nextValue = value.trim();
  if (field === 'displayName' && !nextValue) {
    profileErrors.displayName = t('settings.nameRequired');
    return;
  }
  if (field === 'email' && !validEmail(nextValue)) {
    profileErrors.email = t('settings.emailInvalid');
    return;
  }

  profileSaving.value = true;
  try {
    await authStore.updateProfile(field === 'displayName' ? { displayName: nextValue } : { email: nextValue });
    editingField.value = null;
    showProfileSuccess(field, t('settings.profileSaved'));
  } catch (caught) {
    profileErrors[field] = localizeApiError(caught, 'errors.fallback.profile');
  } finally {
    profileSaving.value = false;
  }
}

async function savePassword(passwords: { currentPassword: string; newPassword: string }) {
  error.value = '';
  message.value = '';
  clearProfileErrors();
  if (!passwords.currentPassword.trim()) {
    profileErrors.password = t('settings.currentPasswordRequired');
    return;
  }
  if (passwords.newPassword.trim().length < 8) {
    profileErrors.password = t('settings.passwordMinLength');
    return;
  }

  profileSaving.value = true;
  try {
    await authStore.updatePassword(passwords);
    editingField.value = null;
    showProfileSuccess('password', t('settings.passwordSaved'));
  } catch (caught) {
    profileErrors.password = localizeApiError(caught, 'errors.fallback.password');
  } finally {
    profileSaving.value = false;
  }
}

async function exportData() {
  resetPanelMessages();
  try {
    const data = await authStore.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `herzgarten-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    message.value = t('settings.exportCreated');
  } catch (caught) {
    error.value = localizeApiError(caught, 'errors.fallback.export');
  }
}

function leaveCouple() {
  resetPanelMessages();
  pendingConfirm.value = 'leaveCouple';
}

async function confirmLeaveCouple() {
  try {
    await authStore.leaveCouple();
    await router.push('/onboarding');
  } catch (caught) {
    error.value = localizeApiError(caught, 'errors.fallback.leaveCouple');
  }
}

function deleteAccount() {
  resetPanelMessages();
  pendingConfirm.value = 'deleteAccount';
}

async function confirmDeleteAccount() {
  try {
    await authStore.deleteAccount();
    await router.push('/onboarding');
  } catch (caught) {
    error.value = localizeApiError(caught, 'errors.fallback.deleteAccount');
  }
}

function closeConfirmDialog() {
  pendingConfirm.value = null;
}

async function confirmPendingAction() {
  const action = pendingConfirm.value;
  pendingConfirm.value = null;
  if (action === 'leaveCouple') await confirmLeaveCouple();
  if (action === 'deleteAccount') await confirmDeleteAccount();
}
</script>

<template>
  <div class="view-grid">
    <section>
      <p class="eyebrow">{{ t('settings.eyebrow') }}</p>
      <h1>{{ t('settings.title') }}</h1>
    </section>

    <FeatureExplainer feature-key="settings" :icon="ShieldCheck" :title="t('settings.howTitle')" :text="t('settings.howText')" />

    <ProfileSettingsPanel
      :display-name="authStore.user?.displayName"
      :email="authStore.user?.email"
      :invite-code="authStore.couple?.inviteCode"
      :relationship-mode-label="relationshipModeLabel"
      :content-style-label="contentStyleLabel"
      :editing-field="editingField"
      :saving="profileSaving"
      :errors="profileErrors"
      :successes="profileSuccess"
      :message="message"
      :error="error"
      @edit="startProfileEdit"
      @save-profile-field="saveProfileField"
      @save-password="savePassword"
      @export-data="exportData"
      @logout="authStore.logout()"
      @leave-couple="leaveCouple"
      @delete-account="deleteAccount"
    />

    <FeatureExplainerSettingsPanel
      :items="featureExplainerItems"
      :is-visible="authStore.showFeatureExplainer"
      :messages="featureExplainerMessages"
      :errors="featureExplainerErrors"
      @toggle="updateFeatureExplainer"
    />

    <PushNotificationsSettingsPanel
      :status-key="pushStore.statusKey"
      :loading="pushStore.loading"
      :saving="pushStore.saving"
      :testing="pushStore.testing"
      :active="pushStore.active"
      :can-prompt="pushStore.canPrompt"
      :push-notification-mode="authStore.pushNotificationMode"
      :mode-saving="pushModeSaving"
      :mode-message="pushModeMessage"
      :mode-error="pushModeError"
      :message="pushStore.message"
      :error="pushStore.error"
      @enable="pushStore.enable"
      @disable="pushStore.disable"
      @test="pushStore.sendTest"
      @mode-change="updatePushNotificationMode"
    />

    <PrivacyDetailsPanel />

    <SettingsConfirmDialog
      :open="Boolean(pendingConfirm)"
      :variant="confirmDialog.variant"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :confirm-label="confirmDialog.confirmLabel"
      :title-id="confirmDialog.titleId"
      @cancel="closeConfirmDialog"
      @confirm="confirmPendingAction"
    />
  </div>
</template>
