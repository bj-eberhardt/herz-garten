<script setup lang="ts">
import { ref } from 'vue';
import { Plus } from '@lucide/vue';
import { loveJarTemplates } from '@/content/loveJarTemplates';
import { useLoveJarStore } from '@/stores/loveJarStore';
import type { LoveJarCategory } from '@/types/domain';

const loveJarStore = useLoveJarStore();
const note = ref(loveJarTemplates[0]);
const category = ref<LoveJarCategory>('compliment');

async function submitNote() {
  await loveJarStore.addNote(note.value, category.value);
  note.value = '';
}
</script>

<template>
  <form class="panel composer" @submit.prevent="submitNote">
    <div>
      <p class="eyebrow">Zettel schreiben</p>
      <h2>Was passt gut ins Glas?</h2>
      <p class="muted">
        Kleine Saetze reichen: ein Kompliment, ein Dank, eine Erinnerung, ein Wunsch oder ein Gutschein fuer einen Moment zu zweit.
      </p>
    </div>

    <label for="love-jar-category">Kategorie</label>
    <select id="love-jar-category" v-model="category">
      <option value="compliment">Kompliment</option>
      <option value="memory">Erinnerung</option>
      <option value="voucher">Gutschein</option>
      <option value="wish">Wunsch</option>
      <option value="surprise">Ueberraschung</option>
    </select>

    <label for="love-jar-note">Neuer Zettel</label>
    <textarea id="love-jar-note" v-model="note" rows="4" placeholder="Heute moechte ich dir sagen ..." />
    <button class="primary-button" type="submit" :disabled="loveJarStore.loading">
      <Plus :size="18" aria-hidden="true" />
      {{ loveJarStore.loading ? 'Speichert...' : 'In das Glas legen' }}
    </button>
  </form>
</template>
