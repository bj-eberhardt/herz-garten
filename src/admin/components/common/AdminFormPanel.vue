<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps<{
  title: string;
  error?: string;
  testId?: string;
  closeTestId?: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();
const root = ref<HTMLElement | null>(null);

function scrollIntoView(options?: ScrollIntoViewOptions) {
  root.value?.scrollIntoView(options);
}

defineExpose({ scrollIntoView });
</script>

<template>
  <section ref="root" class="admin-panel admin-form" :data-testid="testId">
    <div class="admin-form-head">
      <h2>{{ title }}</h2>
      <button class="secondary-button admin-small-button" type="button" :data-testid="closeTestId" @click="emit('close')">
        {{ t('admin.common.close') }}
      </button>
    </div>
    <p v-if="error" class="form-error"><slot name="error">{{ error }}</slot></p>
    <slot></slot>
  </section>
</template>
