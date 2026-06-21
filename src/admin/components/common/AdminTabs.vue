<script setup lang="ts" generic="T extends string">
defineProps<{
  modelValue: T;
  options: Array<{ id: T; label: string }>;
  ariaLabel?: string;
  testIdPrefix?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: T];
  change: [value: T];
}>();

function select(value: T) {
  emit('update:modelValue', value);
  emit('change', value);
}
</script>

<template>
  <div class="admin-tabs" role="tablist" :aria-label="ariaLabel">
    <button
      v-for="option in options"
      :key="option.id"
      type="button"
      :class="{ active: modelValue === option.id }"
      :data-testid="testIdPrefix ? `${testIdPrefix}-${option.id}` : undefined"
      @click="select(option.id)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
