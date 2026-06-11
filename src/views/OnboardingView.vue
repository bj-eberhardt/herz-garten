<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Clipboard, KeyRound, LogIn, Sprout, UserPlus } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import FeatureExplainer from '@/components/common/FeatureExplainer.vue';
import type { ContentPreference, RelationshipType } from '@/types/domain';
import { useAuthStore } from '@/stores/authStore';
import { localizeApiError } from '@/services/errorMessages';

const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const mode = ref<'login' | 'register'>('register');
const displayName = ref('');
const email = ref('');
const password = ref('');
const inviteCode = ref('');
const relationshipType = ref<RelationshipType>('mixed');
const contentPreference = ref<ContentPreference>('balanced');
const formError = ref('');
const copied = ref(false);
const authSubmitAttempted = ref(false);
const joinSubmitAttempted = ref(false);
const createSubmitAttempted = ref(false);

async function submitAuth() {
  formError.value = '';
  try {
    if (mode.value === 'register') {
      await authStore.register(displayName.value, email.value, password.value);
    } else {
      await authStore.login(email.value, password.value);
    }
  } catch (error) {
    formError.value = localizeApiError(error, 'errors.fallback.auth');
  }
}

async function createCouple() {
  formError.value = '';
  try {
    await authStore.createCouple({
      relationshipType: relationshipType.value,
      contentPreference: contentPreference.value,
    });
    await router.push('/today');
  } catch (error) {
    formError.value = localizeApiError(error, 'errors.fallback.createCouple');
  }
}

async function joinCouple() {
  formError.value = '';
  try {
    await authStore.joinCouple(inviteCode.value);
    await router.push('/today');
  } catch (error) {
    formError.value = localizeApiError(error, 'errors.fallback.joinCouple');
  }
}

watch(mode, () => {
  authSubmitAttempted.value = false;
});

async function copyInviteCode() {
  if (!authStore.couple?.inviteCode) return;
  await navigator.clipboard.writeText(authStore.couple.inviteCode);
  copied.value = true;
  window.setTimeout(() => {
    copied.value = false;
  }, 1500);
}
</script>

<template>
  <div class="view-grid onboarding-grid">
    <section class="hero-panel">
      <p class="eyebrow">{{ t('auth.onboarding') }}</p>
      <h1>{{ t('auth.welcomeTitle') }}</h1>
      <p v-if="!authStore.isAuthenticated">{{ t('auth.introGuest') }}</p>
      <p v-else-if="!authStore.hasCouple">{{ t('auth.introNoCouple') }}</p>
      <p v-else>{{ t('auth.introCouple') }}</p>
    </section>

    <FeatureExplainer feature-key="onboarding" :icon="Sprout" :title="t('auth.howTitle')" :text="t('auth.howText')" />

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

      <form class="composer" :class="{ 'form-submitted': authSubmitAttempted }" data-testid="auth-form" @submit.prevent="submitAuth">
        <label v-if="mode === 'register'" for="display-name">{{ t('common.name') }}</label>
        <input v-if="mode === 'register'" id="display-name" v-model="displayName" autocomplete="name" data-testid="auth-display-name" required />

        <label for="email">{{ t('common.email') }}</label>
        <input id="email" v-model="email" autocomplete="email" type="email" data-testid="auth-email" required />

        <label for="password">{{ t('common.password') }}</label>
        <input id="password" v-model="password" autocomplete="current-password" type="password" minlength="8" data-testid="auth-password" required />

        <p v-if="formError || authStore.error" class="form-error" data-testid="auth-error">{{ formError || authStore.error }}</p>

        <button class="primary-button" type="submit" :disabled="authStore.loading" data-testid="auth-submit" @click="authSubmitAttempted = true">
          {{ mode === 'register' ? t('auth.createAccount') : t('auth.loginAction') }}
        </button>
      </form>
    </section>

    <section v-else class="panel auth-panel">
      <p class="eyebrow">{{ t('nav.coupleRoom') }}</p>
      <h2>{{ t('auth.hello', { name: authStore.user?.displayName }) }}</h2>
      <div v-if="authStore.couple" class="couple-code" data-testid="couple-code-panel">
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
          <KeyRound :size="20" aria-hidden="true" />
          <div>
            <strong>{{ t('auth.enterPartnerCodeLater') }}</strong>
            <p>{{ t('auth.enterPartnerCodeHint') }}</p>
          </div>
        </div>

        <form class="join-form highlighted-form" :class="{ 'form-submitted': joinSubmitAttempted }" data-testid="join-couple-form" @submit.prevent="joinCouple">
          <label for="invite-code">{{ t('auth.partnerCode') }}</label>
          <input id="invite-code" v-model="inviteCode" placeholder="apfel-sonne-4821" autocomplete="off" data-testid="invite-code-input" required />
          <button class="primary-button" type="submit" data-testid="join-couple-submit" @click="joinSubmitAttempted = true">
            <KeyRound :size="18" aria-hidden="true" />
            {{ t('auth.connectPartner') }}
          </button>
        </form>

        <div class="section-divider"><span>{{ t('auth.orCreateNew') }}</span></div>

        <form class="join-form" :class="{ 'form-submitted': createSubmitAttempted }" data-testid="create-couple-form" @submit.prevent="createCouple">
          <label for="relationship-type">{{ t('auth.relationshipMode') }}</label>
          <select id="relationship-type" v-model="relationshipType" data-testid="relationship-type-select" required>
            <option value="mixed">{{ t('auth.relationship.mixed') }}</option>
            <option value="local">{{ t('auth.relationship.local') }}</option>
            <option value="long_distance">{{ t('auth.relationship.long_distance') }}</option>
          </select>

          <label for="content-preference">{{ t('auth.contentStyle') }}</label>
          <select id="content-preference" v-model="contentPreference" data-testid="content-preference-select" required>
            <option value="balanced">{{ t('auth.preference.balanced') }}</option>
            <option value="romantic">{{ t('auth.preference.romantic') }}</option>
            <option value="playful">{{ t('auth.preference.playful') }}</option>
            <option value="deep">{{ t('auth.preference.deep') }}</option>
          </select>

          <button class="primary-button" type="submit" data-testid="create-couple-submit" @click="createSubmitAttempted = true">
            <Sprout :size="18" aria-hidden="true" />
            {{ t('auth.createGarden') }}
          </button>
        </form>
      </div>
      <p v-if="formError" class="form-error" data-testid="couple-error">{{ formError }}</p>
    </section>
  </div>
</template>
