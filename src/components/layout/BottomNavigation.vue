<script setup lang="ts">
import { CalendarHeart, Flower2, Gamepad2, GlassWater, HeartHandshake, Images, Settings } from '@lucide/vue';

const items = [
  { to: '/garden', label: 'Garten', icon: Flower2, testId: 'nav-garden' },
  { to: '/today', label: 'Heute', icon: CalendarHeart, testId: 'nav-today' },
  { to: '/quests', label: 'Quests', icon: HeartHandshake, testId: 'nav-quests' },
  { to: '/know-me', label: 'Spiel', icon: Gamepad2, testId: 'nav-know-me' },
  { to: '/love-jar', label: 'Love Jar', icon: GlassWater, testId: 'nav-love-jar' },
  { to: '/memories', label: 'Momente', icon: Images, testId: 'nav-memories' },
  { to: '/settings', label: 'Profil', icon: Settings, testId: 'nav-settings' },
];
</script>

<template>
  <nav class="bottom-nav" aria-label="Hauptnavigation">
    <RouterLink v-for="item in items" :key="item.to" :to="item.to" class="nav-item" :data-testid="item.testId">
      <component :is="item.icon" :size="20" aria-hidden="true" />
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>
