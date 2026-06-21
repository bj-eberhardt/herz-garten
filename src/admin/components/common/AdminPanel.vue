<script setup lang="ts">
defineProps<{
  title?: string;
  intro?: string;
  error?: string;
  testId?: string;
  form?: boolean;
}>();
</script>

<template>
  <section class="admin-panel" :class="{ 'admin-form': form }" :data-testid="testId">
    <div v-if="title || intro || $slots.actions" class="admin-form-head">
      <div>
        <h2 v-if="title">{{ title }}</h2>
        <p v-if="intro" class="muted">{{ intro }}</p>
      </div>
      <slot name="actions"></slot>
    </div>
    <p v-if="error" class="form-error">{{ error }}</p>
    <slot></slot>
  </section>
</template>
