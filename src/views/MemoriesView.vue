<script setup lang="ts">
import { ref } from 'vue';
import { Plus } from '@lucide/vue';
import MemoryTimeline from '@/components/memories/MemoryTimeline.vue';
import { useMemoryStore } from '@/stores/memoryStore';

const memoryStore = useMemoryStore();
const title = ref('');
</script>

<template>
  <div class="view-grid">
    <section>
      <p class="eyebrow">Erinnerungen</p>
      <h1>Bewahrt die Momente, aus denen euer Garten waechst.</h1>
    </section>

    <form class="panel composer" @submit.prevent="memoryStore.addMemory(title)">
      <label for="memory-title">Neue Erinnerung</label>
      <input id="memory-title" v-model="title" placeholder="Titel der Erinnerung" />
      <button class="primary-button" type="submit">
        <Plus :size="18" aria-hidden="true" />
        Speichern
      </button>
    </form>

    <MemoryTimeline :memories="memoryStore.memories" />
  </div>
</template>
