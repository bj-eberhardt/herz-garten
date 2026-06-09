import { defineStore } from 'pinia';
import type { Couple } from '@/types/domain';

const now = new Date().toISOString();

export const useCoupleStore = defineStore('couple', {
  state: () => ({
    couple: {
      id: 'demo-couple',
      partnerAId: 'demo-a',
      partnerBId: 'demo-b',
      inviteCode: 'HERZ-4821',
      relationshipType: 'mixed',
      contentPreference: 'balanced',
      heartPoints: 120,
      gardenStage: 2,
      createdAt: now,
    } satisfies Couple,
  } as { couple: Couple }),
  actions: {
    setCouple(couple: Couple) {
      this.couple = couple;
    },
    addHeartPoints(points: number) {
      this.couple.heartPoints += points;
      this.couple.gardenStage = Math.max(1, Math.floor(this.couple.heartPoints / 80) + 1);
    },
  },
});
