<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
  title?: string;
}>();
</script>

<template>
  <article class="admin-metric" :title="title">
    <span>{{ label }}</span>
    <strong>{{ value }}</strong>
  </article>
</template>
