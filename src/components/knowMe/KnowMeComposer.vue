<script setup lang="ts">
import { computed, ref } from 'vue';
import { Plus } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import KnowMeCatalogCombobox from '@/components/knowMe/KnowMeCatalogCombobox.vue';
import KnowMeOptionFields from '@/components/knowMe/KnowMeOptionFields.vue';
import { useKnowMeStore } from '@/stores/knowMeStore';

const knowMeStore = useKnowMeStore();
const { t } = useI18n();
const questionText = ref('');
const selectedCatalogQuestionId = ref<string | null>(null);
const options = ref(['', '', '', '']);
const createSubmitAttempted = ref(false);

const filledOptions = computed(() => options.value.map((option) => option.trim()).filter(Boolean));
const canCreate = computed(
  () =>
    questionText.value.trim().length > 0 &&
    options.value[0].trim().length > 0 &&
    options.value[1].trim().length > 0,
);

async function submitRound() {
  createSubmitAttempted.value = true;
  if (!canCreate.value) return;
  await knowMeStore.createRound({
    questionText: questionText.value.trim(),
    options: filledOptions.value,
    correctOptionIndex: 0,
    catalogQuestionId: selectedCatalogQuestionId.value,
  });
  questionText.value = '';
  selectedCatalogQuestionId.value = null;
  options.value = ['', '', '', ''];
  createSubmitAttempted.value = false;
}
</script>

<template>
  <form
    class="panel composer"
    :class="{ 'form-submitted': createSubmitAttempted }"
    data-testid="know-me-create-panel"
    @submit.prevent="submitRound"
  >
    <div>
      <p class="eyebrow">{{ t('knowMe.createEyebrow') }}</p>
      <h2>{{ t('knowMe.createTitle') }}</h2>
    </div>

    <KnowMeCatalogCombobox
      v-model="questionText"
      v-model:selected-question-id="selectedCatalogQuestionId"
      :questions="knowMeStore.catalogQuestions"
    />

    <KnowMeOptionFields v-model="options" />

    <button
      class="primary-button"
      type="submit"
      data-testid="know-me-create-submit"
      :disabled="knowMeStore.loading"
      @click="createSubmitAttempted = true"
    >
      <Plus :size="18" aria-hidden="true" />
      {{ t('knowMe.sendQuestion') }}
    </button>
  </form>
</template>
