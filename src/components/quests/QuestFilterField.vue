<script setup lang="ts">
interface QuestFilterOption {
  value: string;
  label: string;
}

defineProps<{
  id: string;
  label: string;
  modelValue: string;
  options: QuestFilterOption[];
  testId: string;
}>();

defineEmits<{
  'update:modelValue': [value: string];
  change: [];
}>();
</script>

<template>
  <div class="quest-filter-field">
    <label :for="id">{{ label }}</label>
    <select
      :id="id"
      :value="modelValue"
      :data-testid="testId"
      @change="
        $emit('update:modelValue', ($event.target as HTMLSelectElement).value);
        $emit('change');
      "
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </div>
</template>
