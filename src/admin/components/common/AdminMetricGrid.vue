<script setup lang="ts">
defineProps<{
  compact?: boolean;
}>();
</script>

<template>
  <div class="admin-metric-grid" :class="{ compact }">
    <slot></slot>
  </div>
</template>
