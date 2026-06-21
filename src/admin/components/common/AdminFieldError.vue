<script setup lang="ts">
defineProps<{
  message?: string;
  testId?: string;
  paragraph?: boolean;
}>();
</script>

<template>
  <p v-if="message && paragraph" class="form-error admin-settings-field-error" :data-testid="testId">{{ message }}</p>
  <small v-else-if="message" class="admin-field-error" :data-testid="testId">{{ message }}</small>
</template>
