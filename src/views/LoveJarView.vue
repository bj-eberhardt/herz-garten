<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { Gift, HeartHandshake, LockKeyhole } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import FeatureExplainer from '@/components/common/FeatureExplainer.vue';
import LoveJarComposer from '@/components/loveJar/LoveJarComposer.vue';
import { useAuthStore } from '@/stores/authStore';
import { useLoveJarStore } from '@/stores/loveJarStore';
import type { LoveJarNoteView } from '@/stores/loveJarStore';

const authStore = useAuthStore();
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

function isOwnNote(note: LoveJarNoteView) {
  return note.authorId === authStore.user?.id;
}

function noteStatusLabel(note: LoveJarNoteView) {
  if (note.isDrawn) return t('loveJar.noteStatus.opened');
  return isOwnNote(note) ? t('loveJar.noteStatus.ownLocked') : t('loveJar.noteStatus.partnerLocked');
}

function noteBody(note: LoveJarNoteView) {
  if (note.isDrawn) return note.text;
  return isOwnNote(note) ? t('loveJar.ownUnreadNote') : t('loveJar.unreadNote');
}
</script>

<template>
  <div class="view-grid">
    <section>
      <p class="eyebrow">{{ t('loveJar.eyebrow') }}</p>
      <h1>{{ t('loveJar.title') }}</h1>
    </section>

    <FeatureExplainer feature-key="loveJar" :icon="HeartHandshake" :title="t('loveJar.howTitle')" :text="t('loveJar.howText')" />

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
        <article
          v-for="note in loveJarStore.notes"
          :key="note.id"
          class="note-card love-note-card"
          :class="{ drawn: note.isDrawn, 'own-note': isOwnNote(note), 'locked-note': !note.isDrawn }"
          data-testid="love-jar-note"
        >
          <div v-if="!note.isDrawn" class="love-note-seal" aria-hidden="true">
            <svg viewBox="0 0 64 48" focusable="false">
              <path d="M8 10h48v30H8z" />
              <path d="M10 12l22 16 22-16" />
              <path d="M10 40l16-14" />
              <path d="M54 40L38 26" />
            </svg>
          </div>
          <div>
            <p class="eyebrow">{{ note.categoryLabel ?? note.category }} - {{ noteStatusLabel(note) }}</p>
            <p class="love-note-author">{{ t('loveJar.fromAuthor', { name: note.authorName }) }}</p>
            <p class="love-note-text">{{ noteBody(note) }}</p>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
