<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Plus } from '@lucide/vue';
import MemoryTimeline from '@/components/memories/MemoryTimeline.vue';
import type { MemoryCategory } from '@/types/domain';
import { useMemoryStore } from '@/stores/memoryStore';

const memoryStore = useMemoryStore();
const title = ref('');
const description = ref('');
const date = ref(new Date().toISOString().slice(0, 10));
const category = ref<MemoryCategory>('everyday');

async function submitMemory() {
  await memoryStore.addMemory({
    title: title.value,
    description: description.value,
    date: date.value,
    category: category.value,
  });
  title.value = '';
  description.value = '';
  date.value = new Date().toISOString().slice(0, 10);
  category.value = 'everyday';
}

onMounted(() => {
  memoryStore.loadMemories();
});
</script>

<template>
  <div class="view-grid">
    <section>
      <p class="eyebrow">Erinnerungen</p>
      <h1>Bewahrt die Momente, aus denen euer Garten waechst.</h1>
    </section>

    <form class="panel composer" @submit.prevent="submitMemory">
      <label for="memory-title">Neue Erinnerung</label>
      <input id="memory-title" v-model="title" placeholder="Titel der Erinnerung" />

      <label for="memory-description">Beschreibung</label>
      <textarea id="memory-description" v-model="description" rows="3" placeholder="Was moechtest du festhalten?" />

      <label for="memory-date">Datum</label>
      <input id="memory-date" v-model="date" type="date" />

      <label for="memory-category">Kategorie</label>
      <select id="memory-category" v-model="category">
        <option value="everyday">Alltag</option>
        <option value="date">Date</option>
        <option value="travel">Reise</option>
        <option value="milestone">Meilenstein</option>
        <option value="funny">Lustig</option>
        <option value="special">Besonders</option>
      </select>

      <p v-if="memoryStore.error" class="form-error">{{ memoryStore.error }}</p>

      <button class="primary-button" type="submit" :disabled="memoryStore.loading">
        <Plus :size="18" aria-hidden="true" />
        {{ memoryStore.loading ? 'Speichert...' : 'Speichern' }}
      </button>
    </form>

    <p v-if="!memoryStore.loading && memoryStore.memories.length === 0" class="muted">Noch keine Erinnerungen.</p>
    <MemoryTimeline :memories="memoryStore.memories" />
  </div>
</template>
