<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { Gift, HeartHandshake, LockKeyhole } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import LoveJarComposer from '@/components/loveJar/LoveJarComposer.vue';
import { useLoveJarStore } from '@/stores/loveJarStore';

const loveJarStore = useLoveJarStore();
const { t } = useI18n();

onMounted(() => {
  loveJarStore.loadNotes();
});

const drawHint = computed(() => {
  if (loveJarStore.drawStatus.drawnToday) {
    return t('loveJar.drawHints.drawnToday');
  }
  if (loveJarStore.drawStatus.partnerUnreadCount > 0) {
    return t('loveJar.drawHints.partnerUnread', loveJarStore.drawStatus.partnerUnreadCount, {
      named: { count: loveJarStore.drawStatus.partnerUnreadCount },
    });
  }
  if (loveJarStore.drawStatus.ownUnreadCount > 0) {
    return t('loveJar.drawHints.ownUnread');
  }
  return t('loveJar.drawHints.none');
});
</script>

<template>
  <div class="view-grid">
    <section>
      <p class="eyebrow">{{ t('loveJar.eyebrow') }}</p>
      <h1>{{ t('loveJar.title') }}</h1>
    </section>

    <section class="panel feature-explainer">
      <HeartHandshake :size="24" aria-hidden="true" />
      <div>
        <h2>{{ t('loveJar.howTitle') }}</h2>
        <p>
          {{ t('loveJar.howText') }}
        </p>
      </div>
    </section>

    <LoveJarComposer />

    <section class="panel draw-panel">
      <div class="draw-header">
        <div>
          <p class="eyebrow">{{ t('loveJar.drawEyebrow') }}</p>
          <h2>{{ t('loveJar.drawTitle') }}</h2>
      <p class="muted" data-testid="love-jar-draw-hint">{{ drawHint }}</p>
        </div>
        <span class="draw-counter">
          <LockKeyhole :size="16" aria-hidden="true" />
          {{ t('loveJar.unread', loveJarStore.unreadCount, { named: { count: loveJarStore.unreadCount } }) }}
        </span>
      </div>

      <button
        class="secondary-button"
        type="button"
        data-testid="love-jar-draw"
        :disabled="loveJarStore.loading || !loveJarStore.drawStatus.canDrawToday"
        @click="loveJarStore.drawNote"
      >
        <Gift :size="18" aria-hidden="true" />
        {{ loveJarStore.loading ? t('loveJar.drawing') : t('loveJar.draw') }}
      </button>

      <p v-if="loveJarStore.error" class="form-error" data-testid="love-jar-error">{{ loveJarStore.error }}</p>
      <p v-if="!loveJarStore.loading && loveJarStore.notes.length === 0" class="empty-state" data-testid="love-jar-empty">
        {{ t('loveJar.empty') }}
      </p>
      <p v-else-if="!loveJarStore.loading && !loveJarStore.drawStatus.canDrawToday && !loveJarStore.drawStatus.drawnToday" class="empty-state" data-testid="love-jar-empty">
        {{ t('loveJar.nothingDrawable') }}
      </p>

      <div class="note-list">
        <article v-for="note in loveJarStore.notes" :key="note.id" class="note-card" :class="{ drawn: note.isDrawn }" data-testid="love-jar-note">
          <p class="eyebrow">{{ note.category }} - {{ note.authorName }}</p>
          <p>{{ note.isDrawn ? note.text : t('loveJar.unreadNote') }}</p>
        </article>
      </div>
    </section>
  </div>
</template>
