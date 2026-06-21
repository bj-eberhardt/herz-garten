<script setup lang="ts">
import { Search } from '@lucide/vue';

defineProps<{
  modelValue: string;
  placeholder: string;
  testId?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  submit: [];
}>();
</script>

<template>
  <label class="admin-search">
    <Search :size="18" aria-hidden="true" />
    <input
      :value="modelValue"
      :placeholder="placeholder"
      :data-testid="testId"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @keyup.enter="emit('submit')"
    />
  </label>
</template>
