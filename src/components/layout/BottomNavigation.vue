<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { CalendarHeart, ChevronLeft, ChevronRight, Flower2, Gamepad2, GlassWater, HeartHandshake, Images, Settings } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/authStore';

const { t } = useI18n();
const authStore = useAuthStore();
const navScroll = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

const items = [
  { to: '/garden', labelKey: 'nav.garden', icon: Flower2, testId: 'nav-garden' },
  { to: '/today', labelKey: 'nav.today', icon: CalendarHeart, testId: 'nav-today' },
  { to: '/quests', labelKey: 'nav.quests', icon: HeartHandshake, testId: 'nav-quests' },
  { to: '/know-me', labelKey: 'nav.knowMe', icon: Gamepad2, testId: 'nav-know-me' },
  { to: '/love-jar', labelKey: 'nav.loveJar', icon: GlassWater, testId: 'nav-love-jar' },
  { to: '/memories', labelKey: 'nav.memories', icon: Images, testId: 'nav-memories' },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings, testId: 'nav-settings' },
];

const visibleItems = computed(() => (authStore.hasCompleteCouple ? items : items.filter((item) => item.to === '/garden')));

function updateScrollIndicators() {
  const element = navScroll.value;
  if (!element) {
    canScrollLeft.value = false;
    canScrollRight.value = false;
    return;
  }

  const maxScrollLeft = Math.max(0, element.scrollWidth - element.clientWidth);
  canScrollLeft.value = element.scrollLeft > 4;
  canScrollRight.value = element.scrollLeft < maxScrollLeft - 4;
}

function scrollNav(direction: -1 | 1) {
  const element = navScroll.value;
  if (!element) return;
  element.scrollBy({ left: direction * Math.round(element.clientWidth * 0.7), behavior: 'smooth' });
}

onMounted(() => {
  updateScrollIndicators();
  window.addEventListener('resize', updateScrollIndicators);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScrollIndicators);
});
</script>

<template>
  <div class="bottom-nav-shell">
    <button
      v-if="canScrollLeft"
      class="bottom-nav-scroll bottom-nav-scroll--left"
      type="button"
      aria-label="Navigation nach links"
      @click="scrollNav(-1)"
    >
      <ChevronLeft :size="18" aria-hidden="true" />
    </button>
    <nav ref="navScroll" class="bottom-nav" :aria-label="t('nav.main')" @scroll="updateScrollIndicators">
      <RouterLink v-for="item in visibleItems" :key="item.to" :to="item.to" class="nav-item" :data-testid="item.testId">
        <component :is="item.icon" :size="20" aria-hidden="true" />
        <span>{{ t(item.labelKey) }}</span>
      </RouterLink>
    </nav>
    <button
      v-if="canScrollRight"
      class="bottom-nav-scroll bottom-nav-scroll--right"
      type="button"
      aria-label="Navigation nach rechts"
      @click="scrollNav(1)"
    >
      <ChevronRight :size="18" aria-hidden="true" />
    </button>
  </div>
</template>
