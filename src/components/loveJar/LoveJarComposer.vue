<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Plus } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { useLoveJarStore } from '@/stores/loveJarStore';
import type { LoveJarCategory } from '@/types/domain';

const loveJarStore = useLoveJarStore();
const { t } = useI18n();
const note = ref('');
const category = ref<LoveJarCategory>('compliment');
const loveJarTemplates = computed(() => loveJarStore.templates);

async function submitNote() {
  await loveJarStore.addNote(note.value, category.value);
  note.value = '';
}

onMounted(async () => {
  await loveJarStore.loadTemplates();
  note.value = loveJarTemplates.value[0]?.text ?? '';
});

watch(loveJarTemplates, (templates) => {
  if (!note.value && templates[0]) {
    note.value = templates[0].text;
    category.value = templates[0].category;
  }
});
</script>

<template>
  <form class="panel composer" data-testid="love-jar-form" @submit.prevent="submitNote">
    <div>
      <p class="eyebrow">{{ t('loveJar.composerEyebrow') }}</p>
      <h2>{{ t('loveJar.composerTitle') }}</h2>
      <p class="muted">
        {{ t('loveJar.composerHint') }}
      </p>
    </div>

    <label for="love-jar-category">{{ t('common.category') }}</label>
    <select id="love-jar-category" v-model="category" data-testid="love-jar-category">
      <option value="compliment">{{ t('loveJar.categories.compliment') }}</option>
      <option value="memory">{{ t('loveJar.categories.memory') }}</option>
      <option value="voucher">{{ t('loveJar.categories.voucher') }}</option>
      <option value="wish">{{ t('loveJar.categories.wish') }}</option>
      <option value="surprise">{{ t('loveJar.categories.surprise') }}</option>
    </select>

    <label for="love-jar-note">{{ t('loveJar.newNote') }}</label>
    <textarea id="love-jar-note" v-model="note" rows="4" :placeholder="t('loveJar.notePlaceholder')" data-testid="love-jar-note-input" />
    <div v-if="loveJarTemplates.length" class="template-chip-list">
      <button
        v-for="template in loveJarTemplates.slice(0, 6)"
        :key="template.id"
        class="template-chip"
        type="button"
        @click="note = template.text; category = template.category"
      >
        {{ template.text }}
      </button>
    </div>
    <button class="primary-button" type="submit" :disabled="loveJarStore.loading" data-testid="love-jar-save">
      <Plus :size="18" aria-hidden="true" />
      {{ loveJarStore.loading ? t('common.saving') : t('loveJar.saveNote') }}
    </button>
  </form>
</template>
