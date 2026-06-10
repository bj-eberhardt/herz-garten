<script setup lang="ts">
import { CalendarHeart, Flower2, Gamepad2, GlassWater, HeartHandshake, Images, Settings } from '@lucide/vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const items = [
  { to: '/garden', labelKey: 'nav.garden', icon: Flower2, testId: 'nav-garden' },
  { to: '/today', labelKey: 'nav.today', icon: CalendarHeart, testId: 'nav-today' },
  { to: '/quests', labelKey: 'nav.quests', icon: HeartHandshake, testId: 'nav-quests' },
  { to: '/know-me', labelKey: 'nav.knowMe', icon: Gamepad2, testId: 'nav-know-me' },
  { to: '/love-jar', labelKey: 'nav.loveJar', icon: GlassWater, testId: 'nav-love-jar' },
  { to: '/memories', labelKey: 'nav.memories', icon: Images, testId: 'nav-memories' },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings, testId: 'nav-settings' },
];
</script>

<template>
  <nav class="bottom-nav" :aria-label="t('nav.main')">
    <RouterLink v-for="item in items" :key="item.to" :to="item.to" class="nav-item" :data-testid="item.testId">
      <component :is="item.icon" :size="20" aria-hidden="true" />
      <span>{{ t(item.labelKey) }}</span>
    </RouterLink>
  </nav>
</template>
