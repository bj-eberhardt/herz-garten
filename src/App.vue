<script setup lang="ts">
import { computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import AppShell from '@/components/layout/AppShell.vue';

const route = useRoute();
const isAdminRoute = computed(() => route.path.startsWith('/admin'));
</script>

<template>
  <RouterView v-if="isAdminRoute" />
  <AppShell v-else />
</template>
