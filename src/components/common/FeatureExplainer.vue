<script setup lang="ts">
import { computed } from 'vue';
import { X } from '@lucide/vue';
import type { Component } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import type { FeatureExplainerKey } from '@/types/domain';

const props = defineProps<{
  icon: Component;
  title: string;
  text: string;
  featureKey?: FeatureExplainerKey;
}>();

const authStore = useAuthStore();
const visible = computed(() => !props.featureKey || authStore.showFeatureExplainer(props.featureKey));
const canDismiss = computed(() => Boolean(props.featureKey && authStore.isAuthenticated));

function dismiss() {
  if (!props.featureKey) return;
  authStore.setFeatureExplainerVisible(props.featureKey, false);
}
</script>

<template>
  <section v-if="visible" class="panel feature-explainer" :data-testid="featureKey ? `feature-explainer-${featureKey}` : undefined">
    <component :is="icon" class="feature-explainer-icon" aria-hidden="true" />
    <div>
      <h2>{{ title }}</h2>
      <p>{{ text }}</p>
    </div>
    <button
      v-if="canDismiss"
      class="feature-explainer-close"
      type="button"
      :aria-label="`${title} ausblenden`"
      :data-testid="featureKey ? `feature-explainer-close-${featureKey}` : undefined"
      @click="dismiss"
    >
      <X :size="18" aria-hidden="true" />
    </button>
  </section>
</template>
