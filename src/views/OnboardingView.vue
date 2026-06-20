<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Clipboard, HeartHandshake, KeyRound, Link2, LogIn, Mail, Sprout, UserPlus } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import FeatureExplainer from '@/components/common/FeatureExplainer.vue';
import type { ContentPreference, RelationshipType } from '@/types/domain';
import { useAuthStore } from '@/stores/authStore';
import { localizeApiError } from '@/services/errorMessages';

const rememberedEmailKey = 'herzgarten_remembered_email';
const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const mode = ref<'login' | 'register' | 'forgot'>('register');
const displayName = ref('');
const email = ref('');
const password = ref('');
const rememberEmail = ref(true);
const inviteCode = ref('');
const relationshipType = ref<RelationshipType>('mixed');
const contentPreference = ref<ContentPreference>('balanced');
const formError = ref('');
const forgotSuccess = ref(false);
const joinError = ref('');
const createError = ref('');
const copied = ref(false);
const showInviteModal = ref(false);
const authSubmitAttempted = ref(false);
const joinSubmitAttempted = ref(false);
const createSubmitAttempted = ref(false);
const showGuestAd = computed(() => !authStore.isAuthenticated && mode.value === 'register');
const showReturningUserPanel = computed(() => !authStore.isAuthenticated && mode.value === 'login');
const showForgotPasswordPanel = computed(() => !authStore.isAuthenticated && mode.value === 'forgot');
const authErrorMessage = computed(() => formError.value || authStore.error || (authStore.sessionExpiredMessageKey ? t(authStore.sessionExpiredMessageKey) : ''));
const relationshipOptions = computed(() =>
  authStore.relationshipModes.length
    ? authStore.relationshipModes
    : [
        { value: 'mixed', label: t('auth.relationship.mixed') },
        { value: 'local', label: t('auth.relationship.local') },
        { value: 'long_distance', label: t('auth.relationship.long_distance') },
      ],
);
const contentStyleOptions = computed(() =>
  authStore.contentStyles.length
    ? authStore.contentStyles
    : [
        { value: 'balanced', label: t('auth.preference.balanced') },
        { value: 'romantic', label: t('auth.preference.romantic') },
        { value: 'playful', label: t('auth.preference.playful') },
        { value: 'deep', label: t('auth.preference.deep') },
      ],
);

function saveRememberedEmail() {
  const normalizedEmail = email.value.trim().toLowerCase();
  if (rememberEmail.value && normalizedEmail) {
    window.localStorage.setItem(rememberedEmailKey, normalizedEmail);
    return;
  }
  window.localStorage.removeItem(rememberedEmailKey);
}

async function submitAuth() {
  formError.value = '';
  authStore.sessionExpiredMessageKey = '';
  try {
    if (mode.value === 'register') {
      await authStore.register(displayName.value, email.value, password.value);
    } else {
      await authStore.login(email.value, password.value);
    }
    saveRememberedEmail();
    if (authStore.hasCompleteCouple) {
      await router.push('/today');
    }
  } catch (error) {
    formError.value = localizeApiError(error, 'errors.fallback.auth');
  }
}

async function submitForgotPassword() {
  formError.value = '';
  forgotSuccess.value = false;
  try {
    await authStore.forgotPassword(email.value);
    forgotSuccess.value = true;
  } catch (error) {
    formError.value = localizeApiError(error, 'errors.fallback.auth');
  }
}

async function createCouple() {
  createError.value = '';
  joinError.value = '';
  try {
    await authStore.createCouple({
      relationshipType: relationshipType.value,
      contentPreference: contentPreference.value,
    });
    showInviteModal.value = true;
  } catch (error) {
    createError.value = localizeApiError(error, 'errors.fallback.createCouple');
  }
}

async function joinCouple() {
  joinError.value = '';
  createError.value = '';
  try {
    await authStore.joinCouple(inviteCode.value);
    if (authStore.hasCompleteCouple) {
      await router.push('/today');
    }
  } catch (error) {
    joinError.value = localizeApiError(error, 'errors.fallback.joinCouple');
  }
}

watch(mode, () => {
  authSubmitAttempted.value = false;
  formError.value = '';
  forgotSuccess.value = false;
});

onMounted(() => {
  authStore.loadPublicConfig().catch(() => undefined);
  authStore.loadPreferenceOptions().catch(() => undefined);
  if (authStore.isAuthenticated) return;
  const rememberedEmail = window.localStorage.getItem(rememberedEmailKey);
  if (rememberedEmail) {
    email.value = rememberedEmail;
    rememberEmail.value = true;
    mode.value = 'login';
  }
});

async function copyInviteCode() {
  if (!authStore.couple?.inviteCode) return;
  await navigator.clipboard.writeText(authStore.couple.inviteCode);
  copied.value = true;
  window.setTimeout(() => {
    copied.value = false;
  }, 1500);
}

async function continueToToday() {
  showInviteModal.value = false;
  if (authStore.hasCompleteCouple) {
    await router.push('/today');
  }
}
</script>

<template>
  <div class="view-grid onboarding-grid">
    <section v-if="authStore.isAuthenticated" class="hero-panel">
      <p class="eyebrow">{{ t('auth.onboarding') }}</p>
      <h1>{{ t('auth.welcomeTitle') }}</h1>
      <p v-if="!authStore.hasCouple">{{ t('auth.introNoCouple') }}</p>
      <p v-else>{{ t('auth.introCouple') }}</p>
    </section>

    <FeatureExplainer v-if="authStore.isAuthenticated" feature-key="onboarding" :icon="Sprout" :title="t('auth.howTitle')" :text="t('auth.howText')" />

    <section v-if="showGuestAd" class="panel feature-explainer onboarding-ad" data-testid="onboarding-ad">
      <HeartHandshake class="feature-explainer-icon" aria-hidden="true" />
      <div>
        <p class="eyebrow">{{ t('auth.adEyebrow') }}</p>
        <h2>{{ t('auth.adTitle') }}</h2>
        <p>{{ t('auth.adText') }}</p>
      </div>
    </section>

    <section v-if="showReturningUserPanel" class="panel feature-explainer onboarding-returning" data-testid="onboarding-returning">
      <Sprout class="feature-explainer-icon" aria-hidden="true" />
      <div>
        <p class="eyebrow">{{ t('auth.returningEyebrow') }}</p>
        <h2>{{ t('auth.returningTitle') }}</h2>
        <p>{{ t('auth.returningText') }}</p>
      </div>
    </section>

    <section v-if="showForgotPasswordPanel" class="panel feature-explainer onboarding-returning" data-testid="onboarding-forgot-password-info">
      <KeyRound class="feature-explainer-icon" aria-hidden="true" />
      <div>
        <p class="eyebrow">{{ t('auth.forgotPasswordEyebrow') }}</p>
        <h2>{{ t('auth.forgotPasswordTitle') }}</h2>
        <p>{{ t('auth.forgotPasswordText') }}</p>
      </div>
    </section>

    <section v-if="!authStore.isAuthenticated" class="panel auth-panel">
      <div class="segmented-control" :aria-label="t('auth.modeLabel')">
        <button data-testid="auth-mode-register" :class="{ active: mode === 'register' }" type="button" @click="mode = 'register'">
          <UserPlus :size="18" aria-hidden="true" />
          {{ t('auth.register') }}
        </button>
        <button data-testid="auth-mode-login" :class="{ active: mode === 'login' }" type="button" @click="mode = 'login'">
          <LogIn :size="18" aria-hidden="true" />
          {{ t('auth.login') }}
        </button>
      </div>

      <form v-if="mode !== 'forgot'" class="composer" :class="{ 'form-submitted': authSubmitAttempted }" data-testid="auth-form" @submit.prevent="submitAuth">
        <label v-if="mode === 'register'" for="display-name">{{ t('common.name') }}</label>
        <input v-if="mode === 'register'" id="display-name" v-model="displayName" autocomplete="name" data-testid="auth-display-name" required />

        <label for="email">{{ t('common.email') }}</label>
        <input id="email" v-model="email" autocomplete="email" type="email" data-testid="auth-email" required />

        <label class="remember-email-row">
          <input v-model="rememberEmail" type="checkbox" data-testid="remember-email" />
          <span>{{ t('auth.rememberEmail') }}</span>
        </label>

        <label for="password">{{ t('common.password') }}</label>
        <input id="password" v-model="password" autocomplete="current-password" type="password" minlength="8" data-testid="auth-password" required />

        <p v-if="authErrorMessage" class="form-error" data-testid="auth-error">{{ authErrorMessage }}</p>

        <button class="primary-button" type="submit" :disabled="authStore.loading" data-testid="auth-submit" @click="authSubmitAttempted = true">
          {{ mode === 'register' ? t('auth.createAccount') : t('auth.loginAction') }}
        </button>

        <button
          v-if="mode === 'login' && authStore.passwordResetEmailEnabled"
          class="text-button"
          type="button"
          data-testid="forgot-password-link"
          @click="mode = 'forgot'"
        >
          {{ t('auth.forgotPassword') }}
        </button>
      </form>

      <form v-else class="composer" :class="{ 'form-submitted': authSubmitAttempted }" data-testid="forgot-password-form" @submit.prevent="submitForgotPassword">
        <label for="forgot-email">{{ t('common.email') }}</label>
        <div class="input-with-icon">
          <Mail :size="18" aria-hidden="true" />
          <input id="forgot-email" v-model="email" autocomplete="email" type="email" data-testid="forgot-password-email" required />
        </div>
        <small class="input-hint">{{ t('auth.forgotPasswordEmailHint') }}</small>

        <p v-if="forgotSuccess" class="success-note" data-testid="forgot-password-success">{{ t('auth.forgotPasswordSuccess') }}</p>
        <p v-if="authErrorMessage" class="form-error" data-testid="auth-error">{{ authErrorMessage }}</p>

        <button class="primary-button" type="submit" :disabled="authStore.loading" data-testid="forgot-password-submit" @click="authSubmitAttempted = true">
          {{ t('auth.forgotPasswordSubmit') }}
        </button>
        <button class="text-button" type="button" data-testid="forgot-password-back" @click="mode = 'login'">
          {{ t('auth.backToLogin') }}
        </button>
      </form>
    </section>

    <section v-else class="panel auth-panel">
      <p class="eyebrow">{{ t('nav.coupleRoom') }}</p>
      <h2>{{ t('auth.hello', { name: authStore.user?.displayName }) }}</h2>
      <div v-if="authStore.couple && !authStore.hasCompleteCouple" class="waiting-partner-panel" data-testid="waiting-partner-panel">
        <div class="next-step-note waiting-partner-note">
          <HeartHandshake :size="22" aria-hidden="true" />
          <div>
            <p class="eyebrow">{{ t('auth.waitingPartnerEyebrow') }}</p>
            <h3>{{ t('auth.waitingPartnerTitle') }}</h3>
            <p>{{ t('auth.waitingPartnerText') }}</p>
          </div>
        </div>

        <div class="couple-code waiting-partner-code" data-testid="couple-code-panel">
          <p>
            {{ t('auth.waitingPartnerShareText') }}
            <strong data-testid="couple-code">{{ authStore.couple.inviteCode }}</strong>
          </p>
          <button class="secondary-button inline-button" type="button" data-testid="copy-couple-code" @click="copyInviteCode">
            <Clipboard :size="18" aria-hidden="true" />
            {{ copied ? t('common.copied') : t('auth.copyCode') }}
          </button>
        </div>
      </div>
      <div v-else-if="authStore.couple" class="couple-code" data-testid="couple-code-panel">
        <p>
          {{ t('auth.coupleCodePrefix') }}
          <strong data-testid="couple-code">{{ authStore.couple.inviteCode }}</strong>.
          {{ t('auth.coupleCodeSuffix') }}
        </p>
        <button class="secondary-button inline-button" type="button" data-testid="copy-couple-code" @click="copyInviteCode">
          <Clipboard :size="18" aria-hidden="true" />
          {{ copied ? t('common.copied') : t('auth.copyCode') }}
        </button>
      </div>
      <div v-else class="couple-actions">
        <div class="next-step-note">
          <HeartHandshake :size="20" aria-hidden="true" />
          <p>{{ t('auth.onboardingNextSteps') }}</p>
        </div>

        <div class="onboarding-flow-grid">
          <article class="onboarding-option-card" data-testid="onboarding-join-option">
            <div class="onboarding-option-header">
              <span class="onboarding-option-icon"><Link2 :size="20" aria-hidden="true" /></span>
              <div>
                <h3>{{ t('auth.joinPartnerTitle') }}</h3>
                <p>{{ t('auth.enterPartnerCodeHint') }}</p>
              </div>
            </div>

            <form class="join-form" :class="{ 'form-submitted': joinSubmitAttempted }" data-testid="join-couple-form" @submit.prevent="joinCouple">
              <label for="invite-code">{{ t('auth.partnerCode') }}</label>
              <input id="invite-code" v-model="inviteCode" placeholder="apfel-sonne-4821" autocomplete="off" data-testid="invite-code-input" required />
              <button class="primary-button" type="submit" data-testid="join-couple-submit" @click="joinSubmitAttempted = true">
                <Link2 :size="18" aria-hidden="true" />
                {{ t('auth.connectPartner') }}
              </button>
              <p v-if="joinError" class="form-error" data-testid="join-couple-error">{{ joinError }}</p>
            </form>
          </article>

          <article class="onboarding-option-card" data-testid="onboarding-create-option">
            <div class="onboarding-option-header">
              <span class="onboarding-option-icon"><Sprout :size="20" aria-hidden="true" /></span>
              <div>
                <h3>{{ t('auth.createGardenTitle') }}</h3>
                <p>{{ t('auth.createGardenHint') }}</p>
              </div>
            </div>

            <form class="join-form" :class="{ 'form-submitted': createSubmitAttempted }" data-testid="create-couple-form" @submit.prevent="createCouple">
              <label for="relationship-type">{{ t('auth.relationshipMode') }}</label>
              <select id="relationship-type" v-model="relationshipType" data-testid="relationship-type-select" required>
                <option v-for="option in relationshipOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>

              <label for="content-preference">{{ t('auth.contentStyle') }}</label>
              <select id="content-preference" v-model="contentPreference" data-testid="content-preference-select" required>
                <option v-for="option in contentStyleOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>

              <button class="primary-button" type="submit" data-testid="create-couple-submit" @click="createSubmitAttempted = true">
                <Sprout :size="18" aria-hidden="true" />
                {{ t('auth.createGarden') }}
              </button>
              <p v-if="createError" class="form-error" data-testid="create-couple-error">{{ createError }}</p>
            </form>
          </article>
        </div>
      </div>
    </section>

    <div v-if="showInviteModal && authStore.couple" class="confirm-overlay" role="presentation">
      <section class="invite-code-dialog" role="dialog" aria-modal="true" :aria-labelledby="'invite-code-title'" data-testid="invite-code-modal">
        <div class="onboarding-option-header">
          <span class="onboarding-option-icon"><HeartHandshake :size="20" aria-hidden="true" /></span>
          <div>
            <p class="eyebrow">{{ t('nav.coupleRoom') }}</p>
            <h2 id="invite-code-title">{{ t('auth.inviteModalTitle') }}</h2>
          </div>
        </div>

        <div class="invite-code-copy">
          <strong data-testid="invite-modal-code">{{ authStore.couple.inviteCode }}</strong>
          <button class="secondary-button inline-button" type="button" data-testid="invite-modal-copy" @click="copyInviteCode">
            <Clipboard :size="18" aria-hidden="true" />
            {{ copied ? t('common.copied') : t('auth.copyCode') }}
          </button>
        </div>

        <p>{{ t('auth.inviteModalText') }}</p>

        <button class="primary-button" type="button" data-testid="invite-modal-confirm" @click="continueToToday">
          {{ t('auth.continueToToday') }}
        </button>
      </section>
    </div>
  </div>
</template>
