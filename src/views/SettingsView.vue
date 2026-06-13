<script setup lang="ts">
import { computed, ref } from 'vue';
import { AlertTriangle, Pencil, ShieldCheck } from '@lucide/vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import FeatureExplainer from '@/components/common/FeatureExplainer.vue';
import { featureExplainerKeys, useAuthStore } from '@/stores/authStore';
import { localizeApiError } from '@/services/errorMessages';
import type { FeatureExplainerKey } from '@/types/domain';

const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();
const message = ref('');
const error = ref('');
const editingField = ref<'displayName' | 'email' | 'password' | null>(null);
const displayNameDraft = ref('');
const emailDraft = ref('');
const currentPasswordDraft = ref('');
const newPasswordDraft = ref('');
const displayNameError = ref('');
const emailError = ref('');
const passwordError = ref('');
const displayNameSuccess = ref('');
const emailSuccess = ref('');
const passwordSuccess = ref('');
let profileSuccessTimeout: ReturnType<typeof window.setTimeout> | undefined;
const profileSaving = ref(false);
const pendingConfirm = ref<'leaveCouple' | 'deleteAccount' | null>(null);
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

function checkedFromEvent(event: Event) {
  return (event.target as HTMLInputElement).checked;
}

function clearProfileErrors() {
  displayNameError.value = '';
  emailError.value = '';
  passwordError.value = '';
}

function clearProfileSuccess() {
  displayNameSuccess.value = '';
  emailSuccess.value = '';
  passwordSuccess.value = '';
  if (profileSuccessTimeout) {
    window.clearTimeout(profileSuccessTimeout);
    profileSuccessTimeout = undefined;
  }
}

function showProfileSuccess(field: 'displayName' | 'email' | 'password', text: string) {
  clearProfileSuccess();
  if (field === 'displayName') displayNameSuccess.value = text;
  if (field === 'email') emailSuccess.value = text;
  if (field === 'password') passwordSuccess.value = text;
  profileSuccessTimeout = window.setTimeout(() => {
    clearProfileSuccess();
  }, 5000);
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

async function updateFeatureExplainer(key: FeatureExplainerKey, visible: boolean) {
  error.value = '';
  message.value = '';
  clearProfileErrors();
  clearProfileSuccess();
  try {
    await authStore.setFeatureExplainerVisible(key, visible);
    message.value = t('settings.hintSettingsSaved');
  } catch (caught) {
    error.value = localizeApiError(caught, 'errors.fallback.preferences');
  }
}

function startProfileEdit(field: 'displayName' | 'email' | 'password') {
  error.value = '';
  message.value = '';
  clearProfileErrors();
  clearProfileSuccess();
  editingField.value = field;
  displayNameDraft.value = authStore.user?.displayName ?? '';
  emailDraft.value = authStore.user?.email ?? '';
  currentPasswordDraft.value = '';
  newPasswordDraft.value = '';
}

async function saveProfileField(field: 'displayName' | 'email') {
  error.value = '';
  message.value = '';
  clearProfileErrors();
  const nextDisplayName = displayNameDraft.value.trim();
  const nextEmail = emailDraft.value.trim();
  if (field === 'displayName' && !nextDisplayName) {
    displayNameError.value = t('settings.nameRequired');
    return;
  }
  if (field === 'email' && !validEmail(nextEmail)) {
    emailError.value = t('settings.emailInvalid');
    return;
  }

  profileSaving.value = true;
  try {
    await authStore.updateProfile(field === 'displayName' ? { displayName: nextDisplayName } : { email: nextEmail });
    editingField.value = null;
    showProfileSuccess(field, t('settings.profileSaved'));
  } catch (caught) {
    const localized = localizeApiError(caught, 'errors.fallback.profile');
    if (field === 'displayName') displayNameError.value = localized;
    if (field === 'email') emailError.value = localized;
  } finally {
    profileSaving.value = false;
  }
}

async function savePassword() {
  error.value = '';
  message.value = '';
  clearProfileErrors();
  if (!currentPasswordDraft.value.trim()) {
    passwordError.value = t('settings.currentPasswordRequired');
    return;
  }
  if (newPasswordDraft.value.trim().length < 8) {
    passwordError.value = t('settings.passwordMinLength');
    return;
  }

  profileSaving.value = true;
  try {
    await authStore.updatePassword({
      currentPassword: currentPasswordDraft.value,
      newPassword: newPasswordDraft.value,
    });
    editingField.value = null;
    currentPasswordDraft.value = '';
    newPasswordDraft.value = '';
    showProfileSuccess('password', t('settings.passwordSaved'));
  } catch (caught) {
    passwordError.value = localizeApiError(caught, 'errors.fallback.password');
  } finally {
    profileSaving.value = false;
  }
}

async function exportData() {
  error.value = '';
  message.value = '';
  clearProfileErrors();
  clearProfileSuccess();
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

async function leaveCouple() {
  error.value = '';
  message.value = '';
  clearProfileErrors();
  clearProfileSuccess();
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

async function deleteAccount() {
  error.value = '';
  message.value = '';
  clearProfileErrors();
  clearProfileSuccess();
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

    <section class="panel settings-list" data-testid="settings-profile-panel">
      <p class="eyebrow">Profileinstellungen</p>
      <div class="profile-row" data-testid="settings-display-name-row">
        <strong>{{ t('settings.user') }}</strong>
        <form v-if="editingField === 'displayName'" class="profile-edit-form" novalidate @submit.prevent="saveProfileField('displayName')">
          <input v-model="displayNameDraft" type="text" :aria-label="t('common.name')" data-testid="settings-display-name-input" />
          <button class="secondary-button compact-button" type="submit" :disabled="profileSaving" data-testid="settings-display-name-save">
            {{ profileSaving ? t('common.saving') : t('common.save') }}
          </button>
        </form>
        <template v-else>
          <span data-testid="settings-display-name-value">{{ authStore.user?.displayName }}</span>
          <button class="icon-button" type="button" :aria-label="t('settings.editName')" data-testid="settings-display-name-edit" @click="startProfileEdit('displayName')">
            <Pencil :size="18" aria-hidden="true" />
          </button>
        </template>
        <p v-if="displayNameError" class="profile-field-error" data-testid="settings-display-name-error">{{ displayNameError }}</p>
        <p v-if="displayNameSuccess" class="profile-field-success" data-testid="settings-display-name-success">{{ displayNameSuccess }}</p>
      </div>
      <div class="profile-row" data-testid="settings-email-row">
        <strong>{{ t('settings.email') }}</strong>
        <form v-if="editingField === 'email'" class="profile-edit-form" novalidate @submit.prevent="saveProfileField('email')">
          <input v-model="emailDraft" type="email" :aria-label="t('common.email')" data-testid="settings-email-input" />
          <button class="secondary-button compact-button" type="submit" :disabled="profileSaving" data-testid="settings-email-save">
            {{ profileSaving ? t('common.saving') : t('common.save') }}
          </button>
        </form>
        <template v-else>
          <span data-testid="settings-email-value">{{ authStore.user?.email }}</span>
          <button class="icon-button" type="button" :aria-label="t('settings.editEmail')" data-testid="settings-email-edit" @click="startProfileEdit('email')">
            <Pencil :size="18" aria-hidden="true" />
          </button>
        </template>
        <p v-if="emailError" class="profile-field-error" data-testid="settings-email-error">{{ emailError }}</p>
        <p v-if="emailSuccess" class="profile-field-success" data-testid="settings-email-success">{{ emailSuccess }}</p>
      </div>
      <div class="profile-row" data-testid="settings-password-row">
        <strong>{{ t('settings.password') }}</strong>
        <form v-if="editingField === 'password'" class="profile-edit-form password-edit-form" novalidate @submit.prevent="savePassword">
          <input
            v-model="currentPasswordDraft"
            type="password"
            autocomplete="current-password"
            :placeholder="t('settings.currentPassword')"
            :aria-label="t('settings.currentPassword')"
            data-testid="settings-current-password-input"
          />
          <input
            v-model="newPasswordDraft"
            type="password"
            autocomplete="new-password"
            :placeholder="t('settings.newPassword')"
            :aria-label="t('settings.newPassword')"
            data-testid="settings-new-password-input"
          />
          <button class="secondary-button compact-button" type="submit" :disabled="profileSaving" data-testid="settings-password-save">
            {{ profileSaving ? t('common.saving') : t('common.save') }}
          </button>
        </form>
        <template v-else>
          <span data-testid="settings-password-value">••••••••</span>
          <button class="icon-button" type="button" :aria-label="t('settings.editPassword')" data-testid="settings-password-edit" @click="startProfileEdit('password')">
            <Pencil :size="18" aria-hidden="true" />
          </button>
        </template>
        <p v-if="passwordError" class="profile-field-error" data-testid="settings-password-error">{{ passwordError }}</p>
        <p v-if="passwordSuccess" class="profile-field-success" data-testid="settings-password-success">{{ passwordSuccess }}</p>
      </div>
      <p><strong>{{ t('settings.coupleCode') }}</strong> {{ authStore.couple?.inviteCode }}</p>
      <p><strong>{{ t('settings.relationshipMode') }}</strong> {{ relationshipModeLabel }}</p>
      <p><strong>{{ t('settings.contentStyle') }}</strong> {{ contentStyleLabel }}</p>
      <p class="privacy-note"><ShieldCheck :size="18" /> {{ t('settings.privacyNote') }}</p>
      <p v-if="message" class="success-note">{{ message }}</p>
      <p v-if="error" class="form-error">{{ error }}</p>

      <div class="settings-actions">
        <button class="secondary-button" type="button" data-testid="settings-export" @click="exportData">{{ t('settings.exportData') }}</button>
        <button class="secondary-button" type="button" data-testid="settings-logout" @click="authStore.logout()">{{ t('settings.logout') }}</button>
        <button class="secondary-button" type="button" data-testid="settings-leave-couple" @click="leaveCouple">{{ t('settings.leaveCouple') }}</button>
        <button class="danger-button" type="button" data-testid="settings-delete-account" @click="deleteAccount">{{ t('settings.deleteAccount') }}</button>
      </div>
    </section>

    <section class="panel hint-settings" data-testid="settings-hint-settings">
      <div>
        <p class="eyebrow">{{ t('settings.hintSettingsEyebrow') }}</p>
        <h2>{{ t('settings.hintSettingsTitle') }}</h2>
        <p class="muted">{{ t('settings.hintSettingsText') }}</p>
      </div>

      <div class="toggle-list">
        <label v-for="item in featureExplainerItems" :key="item.key" class="toggle-row" :for="`feature-explainer-toggle-${item.key}`">
          <span>{{ item.label }}</span>
          <input
            :id="`feature-explainer-toggle-${item.key}`"
            type="checkbox"
            role="switch"
            :checked="authStore.showFeatureExplainer(item.key)"
            :data-testid="`settings-feature-explainer-${item.key}`"
            @change="updateFeatureExplainer(item.key, checkedFromEvent($event))"
          />
        </label>
      </div>
    </section>

    <section class="panel privacy-details" data-testid="privacy-details">
      <div>
        <p class="eyebrow">{{ t('settings.privacyTitle') }}</p>
        <p>{{ t('settings.privacyIntro') }}</p>
      </div>
      <div class="privacy-grid">
        <article>
          <h2>{{ t('settings.privacyPrivateTitle') }}</h2>
          <p>{{ t('settings.privacyPrivateText') }}</p>
        </article>
        <article>
          <h2>{{ t('settings.privacyPartnerTitle') }}</h2>
          <p>{{ t('settings.privacyPartnerText') }}</p>
        </article>
        <article>
          <h2>{{ t('settings.privacyLeaveTitle') }}</h2>
          <p>{{ t('settings.privacyLeaveText') }}</p>
        </article>
        <article>
          <h2>{{ t('settings.privacyDeleteTitle') }}</h2>
          <p>{{ t('settings.privacyDeleteText') }}</p>
        </article>
      </div>
    </section>

    <div v-if="pendingConfirm" class="confirm-overlay" role="presentation" @click.self="closeConfirmDialog">
      <section class="confirm-dialog" role="dialog" aria-modal="true" :aria-labelledby="pendingConfirm === 'deleteAccount' ? 'delete-confirm-title' : 'leave-confirm-title'" data-testid="settings-confirm-dialog">
        <AlertTriangle class="confirm-icon" :size="24" aria-hidden="true" />
        <div>
          <h2 :id="pendingConfirm === 'deleteAccount' ? 'delete-confirm-title' : 'leave-confirm-title'">
            {{ pendingConfirm === 'deleteAccount' ? t('settings.confirmDeleteTitle') : t('settings.confirmLeaveTitle') }}
          </h2>
          <p>{{ pendingConfirm === 'deleteAccount' ? t('settings.confirmDelete') : t('settings.confirmLeave') }}</p>
        </div>
        <div class="confirm-actions">
          <button class="secondary-button" type="button" data-testid="settings-confirm-cancel" @click="closeConfirmDialog">{{ t('common.close') }}</button>
          <button
            :class="pendingConfirm === 'deleteAccount' ? 'danger-button' : 'primary-button'"
            type="button"
            data-testid="settings-confirm-accept"
            @click="confirmPendingAction"
          >
            {{ pendingConfirm === 'deleteAccount' ? t('settings.deleteAccount') : t('settings.leaveCouple') }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
