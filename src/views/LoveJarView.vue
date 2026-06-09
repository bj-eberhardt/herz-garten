<script setup lang="ts">
import { Gift } from '@lucide/vue';
import LoveJarComposer from '@/components/loveJar/LoveJarComposer.vue';
import { useLoveJarStore } from '@/stores/loveJarStore';

const loveJarStore = useLoveJarStore();
</script>

<template>
  <div class="view-grid">
    <section>
      <p class="eyebrow">Love Jar</p>
      <h1>Ein Glas voller kleiner Zettel.</h1>
    </section>

    <LoveJarComposer />

    <section class="panel">
      <button class="secondary-button" type="button" @click="loveJarStore.drawNote">
        <Gift :size="18" aria-hidden="true" />
        Zettel ziehen
      </button>
      <div class="note-list">
        <article v-for="note in loveJarStore.notes" :key="note.id" class="note-card" :class="{ drawn: note.isDrawn }">
          <p>{{ note.isDrawn ? note.text : 'Ein ungelesener Zettel wartet.' }}</p>
        </article>
      </div>
    </section>
  </div>
</template>
