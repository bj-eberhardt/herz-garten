<script setup lang="ts">
defineProps<{
  title: string;
  badge?: string | number;
}>();
</script>

<template>
  <div class="admin-heading">
    <slot name="before"></slot>
    <h1>{{ title }}</h1>
    <span v-if="badge !== undefined && badge !== ''">{{ badge }}</span>
  </div>
</template>
