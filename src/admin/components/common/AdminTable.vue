<script setup lang="ts">
defineProps<{
  loading?: boolean;
  empty?: boolean;
  loadingText?: string;
  emptyText?: string;
}>();
</script>

<template>
  <div class="admin-table-wrap">
    <table class="admin-table">
      <slot></slot>
    </table>
    <p v-if="loading" class="muted">{{ loadingText }}</p>
    <p v-else-if="empty" class="muted"><slot name="empty">{{ emptyText }}</slot></p>
  </div>
</template>
