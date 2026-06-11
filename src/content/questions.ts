import type { DailyQuestion } from '@/types/domain';

export const dailyQuestions: DailyQuestion[] = [
  {
    id: 'q-001',
    text: 'Was war ein Moment, in dem du dich durch mich geliebt gefühlt hast?',
    category: 'gratitude',
    depthLevel: 2,
    longDistanceSuitable: true,
    active: true,
  },
  {
    id: 'q-002',
    text: 'Welche kleine Geste von mir bedeutet dir viel?',
    category: 'romance',
    depthLevel: 1,
    longDistanceSuitable: true,
    active: true,
  },
  {
    id: 'q-003',
    text: 'Was möchtest du bald wieder gemeinsam machen?',
    category: 'future',
    depthLevel: 1,
    longDistanceSuitable: false,
    active: true,
  },
];
