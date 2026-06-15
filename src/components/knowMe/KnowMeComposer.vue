<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { Plus } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import KnowMeCatalogCombobox from '@/components/knowMe/KnowMeCatalogCombobox.vue';
import KnowMeOptionFields from '@/components/knowMe/KnowMeOptionFields.vue';
import { FIELD_SUCCESS_VISIBLE_MS } from '@/constants/timing';
import { useKnowMeStore } from '@/stores/knowMeStore';

const knowMeStore = useKnowMeStore();
const { t } = useI18n();
const questionText = ref('');
const selectedCatalogQuestionId = ref<string | null>(null);
const options = ref(['', '', '', '']);
const createSubmitAttempted = ref(false);
const successMessage = ref('');
let successTimeout: ReturnType<typeof window.setTimeout> | undefined;

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
  try {
    await knowMeStore.createRound({
      questionText: questionText.value.trim(),
      options: filledOptions.value,
      correctOptionIndex: 0,
      catalogQuestionId: selectedCatalogQuestionId.value,
    });
  } catch {
    return;
  }
  questionText.value = '';
  selectedCatalogQuestionId.value = null;
  options.value = ['', '', '', ''];
  createSubmitAttempted.value = false;
  successMessage.value = t('knowMe.createSuccess');
  if (successTimeout) window.clearTimeout(successTimeout);
  successTimeout = window.setTimeout(() => {
    successMessage.value = '';
    successTimeout = undefined;
  }, FIELD_SUCCESS_VISIBLE_MS);
}

onBeforeUnmount(() => {
  if (successTimeout) window.clearTimeout(successTimeout);
});
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
    <p v-if="successMessage" class="success-note" data-testid="know-me-create-success">{{ successMessage }}</p>
  </form>
</template>
