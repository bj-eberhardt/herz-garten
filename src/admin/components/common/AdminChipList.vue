<script setup lang="ts">
defineProps<{
  items: Array<string | number>;
  button?: boolean;
}>();

const emit = defineEmits<{
  select: [value: string | number];
}>();
</script>

<template>
  <template v-for="item in items" :key="item">
    <button v-if="button" class="admin-chip admin-chip-button" type="button" @click="emit('select', item)">
      <slot :item="item">{{ item }}</slot>
    </button>
    <span v-else class="admin-chip">
      <slot :item="item">{{ item }}</slot>
    </span>
  </template>
</template>
