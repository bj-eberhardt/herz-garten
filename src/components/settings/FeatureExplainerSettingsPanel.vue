<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { FeatureExplainerKey } from '@/types/domain';

defineProps<{
  items: Array<{ key: FeatureExplainerKey; label: string }>;
  isVisible: (key: FeatureExplainerKey) => boolean;
  messages: Record<FeatureExplainerKey, string>;
  errors: Record<FeatureExplainerKey, string>;
}>();

const emit = defineEmits<{
  toggle: [key: FeatureExplainerKey, visible: boolean];
}>();

const { t } = useI18n();

function checkedFromEvent(event: Event) {
  return (event.target as HTMLInputElement).checked;
}
</script>

<template>
  <section class="panel hint-settings" data-testid="settings-hint-settings">
    <div>
      <p class="eyebrow">{{ t('settings.hintSettingsEyebrow') }}</p>
      <h2>{{ t('settings.hintSettingsTitle') }}</h2>
      <p class="muted">{{ t('settings.hintSettingsText') }}</p>
    </div>

    <div class="toggle-list">
      <div v-for="item in items" :key="item.key" class="toggle-field">
        <label class="toggle-row" :for="`feature-explainer-toggle-${item.key}`">
          <span>{{ item.label }}</span>
          <input
            :id="`feature-explainer-toggle-${item.key}`"
            type="checkbox"
            role="switch"
            :checked="isVisible(item.key)"
            :data-testid="`settings-feature-explainer-${item.key}`"
            @change="emit('toggle', item.key, checkedFromEvent($event))"
          />
        </label>
        <p v-if="messages[item.key]" class="toggle-feedback field-success" :data-testid="`settings-feature-explainer-${item.key}-success`">
          {{ messages[item.key] }}
        </p>
        <p v-if="errors[item.key]" class="toggle-feedback form-error" :data-testid="`settings-feature-explainer-${item.key}-error`">
          {{ errors[item.key] }}
        </p>
      </div>
    </div>
  </section>
</template>
