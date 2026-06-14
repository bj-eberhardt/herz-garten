<script setup lang="ts">
import { useI18n } from 'vue-i18n';

defineProps<{
  modelValue: string[];
}>();

defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const { t } = useI18n();

function optionLabel(index: number) {
  return index === 0 ? t('knowMe.correctAnswer') : t('knowMe.option', { number: index + 1 });
}

function optionPlaceholder(index: number) {
  if (index === 0) return t('knowMe.correctAnswerPlaceholder');
  if (index === 1) return t('knowMe.answerOptionPlaceholder');
  return t('common.optional');
}

function updateOption(options: string[], index: number, value: string) {
  const nextOptions = [...options];
  nextOptions[index] = value;
  return nextOptions;
}
</script>

<template>
  <div class="option-grid know-me-option-grid">
    <label v-for="(_, index) in modelValue" :key="index" class="know-me-option-field" :for="`know-me-option-${index}`">
      <span class="option-label-text">{{ optionLabel(index) }}</span>
      <input
        :id="`know-me-option-${index}`"
        :value="modelValue[index]"
        :data-testid="`know-me-option-${index}`"
        :class="{ 'correct-answer-input': index === 0 }"
        :placeholder="optionPlaceholder(index)"
        :required="index < 2"
        @input="$emit('update:modelValue', updateOption(modelValue, index, ($event.target as HTMLInputElement).value))"
      />
      <small v-if="index === 0" class="field-hint">{{ t('knowMe.correctAnswerHint') }}</small>
    </label>
  </div>
</template>
