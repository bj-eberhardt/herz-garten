import { defineStore } from 'pinia';
import { quests } from '@/content/quests';
import { useCoupleStore } from './coupleStore';
import { useGardenStore } from './gardenStore';

export const useQuestStore = defineStore('quests', {
  state: () => ({
    quests,
    completedQuestIds: [] as string[],
  }),
  actions: {
    completeQuest(questId: string) {
      if (this.completedQuestIds.includes(questId)) return;
      const quest = this.quests.find((item) => item.id === questId);
      if (!quest) return;

      this.completedQuestIds.push(questId);
      useCoupleStore().addHeartPoints(quest.rewardPoints);
      useGardenStore().addObject({
        type: quest.category === 'date' ? 'decoration' : 'light',
        sourceType: 'quest',
        sourceId: quest.id,
        label: quest.title,
      });
    },
  },
});
