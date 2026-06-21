<script setup lang="ts">
interface LocaleOption {
  locale: string;
  label?: string;
  isDefault?: boolean;
}

defineProps<{
  locales: LocaleOption[];
}>();
</script>

<template>
  <section v-if="locales.length > 0" class="admin-translation-box">
    <slot name="header"></slot>
    <div v-for="locale in locales" :key="locale.locale" class="admin-translation-row">
      <slot :locale="locale">
        <strong>{{ locale.label ?? locale.locale }}</strong>
      </slot>
    </div>
  </section>
</template>
