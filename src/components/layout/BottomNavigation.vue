<script setup lang="ts">
import { CalendarHeart, Flower2, GlassWater, HeartHandshake, Images, Settings } from '@lucide/vue';

const items = [
  { to: '/garden', label: 'Garten', icon: Flower2 },
  { to: '/today', label: 'Heute', icon: CalendarHeart },
  { to: '/quests', label: 'Quests', icon: HeartHandshake },
  { to: '/love-jar', label: 'Love Jar', icon: GlassWater },
  { to: '/memories', label: 'Momente', icon: Images },
  { to: '/settings', label: 'Profil', icon: Settings },
];
</script>

<template>
  <nav class="bottom-nav" aria-label="Hauptnavigation">
    <RouterLink v-for="item in items" :key="item.to" :to="item.to" class="nav-item">
      <component :is="item.icon" :size="20" aria-hidden="true" />
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>
