import { nextTick, ref } from 'vue';

interface ScrollablePanel {
  scrollIntoView: (options?: ScrollIntoViewOptions) => void;
}

export function useAdminFormPanel() {
  const showForm = ref(false);
  const formAnchor = ref<ScrollablePanel | HTMLElement | null>(null);

  async function scrollToForm() {
    await nextTick();
    formAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function openForm() {
    showForm.value = true;
    await scrollToForm();
  }

  function closeForm() {
    showForm.value = false;
  }

  return {
    showForm,
    formAnchor,
    scrollToForm,
    openForm,
    closeForm,
  };
}
