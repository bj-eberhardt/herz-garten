import type { Quest } from '@/types/domain';

export const quests: Quest[] = [
  {
    id: 'quest-001',
    title: 'Drei Komplimente',
    description: 'Schreibt euch gegenseitig drei konkrete Komplimente.',
    category: 'romance',
    estimatedMinutes: 10,
    effortLevel: 'low',
    rewardPoints: 15,
    rewardSeedType: 'compliment_seed',
    requiresBothPartners: true,
  },
  {
    id: 'quest-002',
    title: 'Spaziergang ohne Handy',
    description: 'Geht gemeinsam spazieren und lasst die Handys in der Tasche.',
    category: 'date',
    estimatedMinutes: 30,
    effortLevel: 'medium',
    rewardPoints: 20,
    rewardSeedType: 'date_seed',
    requiresBothPartners: true,
  },
  {
    id: 'quest-003',
    title: 'Aktueller Moment',
    description: 'Schickt euch ein Foto von eurem aktuellen Moment.',
    category: 'long_distance',
    estimatedMinutes: 5,
    effortLevel: 'low',
    rewardPoints: 10,
    rewardSeedType: 'light_seed',
    requiresBothPartners: false,
  },
];
