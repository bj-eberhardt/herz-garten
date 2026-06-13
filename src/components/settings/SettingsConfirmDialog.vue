<script setup lang="ts">
import { AlertTriangle } from '@lucide/vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  open: boolean;
  variant: 'danger' | 'primary';
  title: string;
  message: string;
  confirmLabel: string;
  titleId: string;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div v-if="open" class="confirm-overlay" role="presentation" @click.self="emit('cancel')">
    <section class="confirm-dialog" role="dialog" aria-modal="true" :aria-labelledby="titleId" data-testid="settings-confirm-dialog">
      <AlertTriangle class="confirm-icon" :size="24" aria-hidden="true" />
      <div>
        <h2 :id="props.titleId">{{ title }}</h2>
        <p>{{ message }}</p>
      </div>
      <div class="confirm-actions">
        <button class="secondary-button" type="button" data-testid="settings-confirm-cancel" @click="emit('cancel')">{{ t('common.close') }}</button>
        <button :class="variant === 'danger' ? 'danger-button' : 'primary-button'" type="button" data-testid="settings-confirm-accept" @click="emit('confirm')">
          {{ confirmLabel }}
        </button>
      </div>
    </section>
  </div>
</template>
