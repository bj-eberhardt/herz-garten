<script setup lang="ts">
import { ref } from 'vue';
import { Plus } from '@lucide/vue';
import { loveJarTemplates } from '@/content/loveJarTemplates';
import { useLoveJarStore } from '@/stores/loveJarStore';

const loveJarStore = useLoveJarStore();
const note = ref(loveJarTemplates[0]);
</script>

<template>
  <form class="panel composer" @submit.prevent="loveJarStore.addNote(note)">
    <label for="love-jar-note">Neuer Zettel</label>
    <textarea id="love-jar-note" v-model="note" rows="4" />
    <button class="primary-button" type="submit">
      <Plus :size="18" aria-hidden="true" />
      In das Glas legen
    </button>
  </form>
</template>
