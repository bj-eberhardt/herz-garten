<script setup lang="ts">
import { onMounted } from 'vue';
import { Gift } from '@lucide/vue';
import LoveJarComposer from '@/components/loveJar/LoveJarComposer.vue';
import { useLoveJarStore } from '@/stores/loveJarStore';

const loveJarStore = useLoveJarStore();

onMounted(() => {
  loveJarStore.loadNotes();
});
</script>

<template>
  <div class="view-grid">
    <section>
      <p class="eyebrow">Love Jar</p>
      <h1>Ein Glas voller kleiner Zettel.</h1>
    </section>

    <LoveJarComposer />

    <section class="panel">
      <button class="secondary-button" type="button" :disabled="loveJarStore.loading" @click="loveJarStore.drawNote">
        <Gift :size="18" aria-hidden="true" />
        {{ loveJarStore.loading ? 'Zieht...' : 'Zettel ziehen' }}
      </button>

      <p v-if="loveJarStore.error" class="form-error">{{ loveJarStore.error }}</p>
      <p v-if="!loveJarStore.loading && loveJarStore.notes.length === 0" class="muted">
        Noch keine Zettel im Glas.
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
