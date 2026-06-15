<script setup lang="ts">
import { Bell, BellOff, Send } from '@lucide/vue';
import { useI18n } from 'vue-i18n';

defineProps<{
  statusKey: string;
  loading: boolean;
  saving: boolean;
  testing: boolean;
  active: boolean;
  canPrompt: boolean;
  message: string;
  error: string;
}>();

const emit = defineEmits<{
  enable: [];
  disable: [];
  test: [];
}>();

const { t } = useI18n();
</script>

<template>
  <section class="panel push-settings" data-testid="settings-push-panel">
    <div>
      <p class="eyebrow">{{ t('settings.push.eyebrow') }}</p>
      <h2>{{ t('settings.push.title') }}</h2>
      <p class="muted">{{ t('settings.push.text') }}</p>
    </div>

    <div class="push-status">
      <Bell v-if="active" :size="20" />
      <BellOff v-else :size="20" />
      <span>{{ t(`settings.push.status.${statusKey}`) }}</span>
    </div>

    <div class="settings-actions">
      <button
        v-if="!active"
        class="primary-button"
        type="button"
        data-testid="settings-push-enable"
        :disabled="loading || saving || !canPrompt"
        @click="emit('enable')"
      >
        <Bell :size="18" />
        {{ saving ? t('settings.push.enabling') : t('settings.push.enable') }}
      </button>
      <button
        v-if="active"
        class="secondary-button"
        type="button"
        data-testid="settings-push-test"
        :disabled="loading || testing"
        @click="emit('test')"
      >
        <Send :size="18" />
        {{ testing ? t('settings.push.testing') : t('settings.push.test') }}
      </button>
      <button
        v-if="active"
        class="secondary-button"
        type="button"
        data-testid="settings-push-disable"
        :disabled="loading || saving"
        @click="emit('disable')"
      >
        <BellOff :size="18" />
        {{ saving ? t('settings.push.disabling') : t('settings.push.disable') }}
      </button>
    </div>

    <p v-if="message" class="success-note" data-testid="settings-push-success">{{ message }}</p>
    <p v-if="error" class="form-error" data-testid="settings-push-error">{{ error }}</p>
  </section>
</template>
