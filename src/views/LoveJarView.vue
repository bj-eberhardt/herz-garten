<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { Gift, HeartHandshake, LockKeyhole } from '@lucide/vue';
import LoveJarComposer from '@/components/loveJar/LoveJarComposer.vue';
import { useLoveJarStore } from '@/stores/loveJarStore';

const loveJarStore = useLoveJarStore();

onMounted(() => {
  loveJarStore.loadNotes();
});

const drawHint = computed(() => {
  if (loveJarStore.drawStatus.drawnToday) {
    return 'Du hast heute schon einen Zettel gezogen. Morgen ist wieder ein neuer Moment dran.';
  }
  if (loveJarStore.drawStatus.partnerUnreadCount > 0) {
    return `${loveJarStore.drawStatus.partnerUnreadCount} Partner-Zettel wartet. Eigene Zettel bleiben zurueckgestellt.`;
  }
  if (loveJarStore.drawStatus.ownUnreadCount > 0) {
    return 'Es warten nur eigene Zettel. Du kannst einen als Rueckblick ziehen oder erst neue Partnerzettel sammeln.';
  }
  return 'Gerade ist kein ungelesener Zettel im Glas. Schreibt euch neue kleine Botschaften.';
});
</script>

<template>
  <div class="view-grid">
    <section>
      <p class="eyebrow">Love Jar</p>
      <h1>Ein Glas voller kleiner Zettel.</h1>
    </section>

    <section class="panel feature-explainer">
      <HeartHandshake :size="24" aria-hidden="true" />
      <div>
        <h2>Wie funktioniert das?</h2>
        <p>
          Ihr legt kurze Botschaften ins Glas. Ziehen ist bewusst langsam: Jede Person kann pro Tag nur einen Zettel ziehen.
          Partnerzettel haben Vorrang, damit der Moment sich wie eine kleine Nachricht vom anderen anfuehlt.
        </p>
      </div>
    </section>

    <LoveJarComposer />

    <section class="panel draw-panel">
      <div class="draw-header">
        <div>
          <p class="eyebrow">Heute ziehen</p>
          <h2>Ein Zettel pro Tag</h2>
          <p class="muted">{{ drawHint }}</p>
        </div>
        <span class="draw-counter">
          <LockKeyhole :size="16" aria-hidden="true" />
          {{ loveJarStore.unreadCount }} ungelesen
        </span>
      </div>

      <button
        class="secondary-button"
        type="button"
        :disabled="loveJarStore.loading || !loveJarStore.drawStatus.canDrawToday"
        @click="loveJarStore.drawNote"
      >
        <Gift :size="18" aria-hidden="true" />
        {{ loveJarStore.loading ? 'Zieht...' : 'Zettel ziehen' }}
      </button>

      <p v-if="loveJarStore.error" class="form-error">{{ loveJarStore.error }}</p>
      <p v-if="!loveJarStore.loading && loveJarStore.notes.length === 0" class="empty-state">
        Noch keine Zettel im Glas. Fangt mit einem Kompliment, einem Danke oder einem kleinen Gutschein an.
      </p>
      <p v-else-if="!loveJarStore.loading && !loveJarStore.drawStatus.canDrawToday && !loveJarStore.drawStatus.drawnToday" class="empty-state">
        Es ist gerade nichts ziehbar. Schreibt neue Zettel, damit morgen wieder etwas im Glas wartet.
      </p>

      <div class="note-list">
        <article v-for="note in loveJarStore.notes" :key="note.id" class="note-card" :class="{ drawn: note.isDrawn }">
          <p class="eyebrow">{{ note.category }} - {{ note.authorName }}</p>
          <p>{{ note.isDrawn ? note.text : 'Ein ungelesener Zettel wartet.' }}</p>
        </article>
      </div>
    </section>
  </div>
</template>
