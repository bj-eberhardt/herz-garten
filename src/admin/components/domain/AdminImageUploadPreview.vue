<script setup lang="ts">
defineProps<{
  label: string;
  help?: string;
  src?: string;
  accept?: string;
  testId?: string;
  previewClass?: string;
}>();

const emit = defineEmits<{
  change: [event: Event];
}>();
</script>

<template>
  <label>
    {{ label }}
    <input type="file" :accept="accept ?? 'image/png,image/jpeg,image/webp'" :data-testid="testId" @change="emit('change', $event)" />
    <small v-if="help">{{ help }}</small>
  </label>
  <img v-if="src" class="admin-image-preview" :class="previewClass" :src="src" alt="" />
</template>
