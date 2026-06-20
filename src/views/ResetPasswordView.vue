<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { KeyRound } from '@lucide/vue';
import { useAuthStore } from '@/stores/authStore';
import { localizeApiError } from '@/services/errorMessages';

const route = useRoute();
const authStore = useAuthStore();
const { t } = useI18n();

const password = ref('');
const formError = ref('');
const success = ref(false);
const submitting = ref(false);
const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''));

async function submitReset() {
  formError.value = '';
  success.value = false;
  if (!token.value) {
    formError.value = t('errors.auth.resetTokenInvalid');
    return;
  }

  submitting.value = true;
  try {
    await authStore.resetPassword(token.value, password.value);
    success.value = true;
    password.value = '';
  } catch (error) {
    formError.value = localizeApiError(error, 'errors.fallback.auth');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="view-grid onboarding-grid">
    <section class="panel feature-explainer onboarding-returning" data-testid="reset-password-info">
      <KeyRound class="feature-explainer-icon" aria-hidden="true" />
      <div>
        <p class="eyebrow">{{ t('auth.resetPasswordInfoEyebrow') }}</p>
        <h2>{{ t('auth.resetPasswordInfoTitle') }}</h2>
        <p>{{ t('auth.resetPasswordInfoText') }}</p>
      </div>
    </section>

    <section class="panel auth-panel" data-testid="reset-password-view">
      <div class="onboarding-option-header">
        <span class="onboarding-option-icon"><KeyRound :size="20" aria-hidden="true" /></span>
        <div>
          <p class="eyebrow">{{ t('auth.resetPasswordEyebrow') }}</p>
          <h1>{{ t('auth.resetPasswordTitle') }}</h1>
        </div>
      </div>

      <form v-if="!success" class="composer" data-testid="reset-password-form" @submit.prevent="submitReset">
        <label for="reset-password">{{ t('auth.newPassword') }}</label>
        <input id="reset-password" v-model="password" autocomplete="new-password" type="password" minlength="8" data-testid="reset-password-input" required />

        <p v-if="formError" class="form-error" data-testid="reset-password-error">{{ formError }}</p>

        <button class="primary-button" type="submit" :disabled="submitting" data-testid="reset-password-submit">
          {{ submitting ? t('common.saving') : t('auth.resetPasswordSubmit') }}
        </button>
      </form>

      <div v-else class="composer">
        <p class="success-note" data-testid="reset-password-success">{{ t('auth.resetPasswordSuccess') }}</p>
        <RouterLink class="primary-button" to="/onboarding" data-testid="reset-password-login-link">
          {{ t('auth.backToLogin') }}
        </RouterLink>
      </div>
    </section>
  </div>
</template>
