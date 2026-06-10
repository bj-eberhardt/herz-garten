export type RelationshipType = 'local' | 'long_distance' | 'mixed';
export type ContentPreference = 'romantic' | 'playful' | 'deep' | 'balanced';
export type QuestCategory = 'romance' | 'date' | 'humor' | 'memory' | 'teamwork' | 'long_distance';
export type EffortLevel = 'low' | 'medium' | 'high';
export type GardenObjectType = 'flower' | 'tree' | 'bench' | 'light' | 'stone' | 'pond' | 'decoration';
export type GardenSourceType = 'question' | 'quest' | 'memory' | 'love_jar' | 'milestone' | 'know_me';
export type LoveJarCategory = 'compliment' | 'memory' | 'voucher' | 'wish' | 'surprise';
export type MemoryCategory = 'date' | 'travel' | 'milestone' | 'funny' | 'everyday' | 'special';
export type NotificationType =
  | 'daily_answer_waiting'
  | 'daily_revealed'
  | 'quest_waiting_confirmation'
  | 'quest_completed'
  | 'love_jar_note'
  | 'memory_created'
  | 'know_me_question'
  | 'know_me_answered';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Couple {
  id: string;
  partnerAId?: string;
  partnerBId?: string;
  inviteCode: string;
  relationshipType: RelationshipType;
  contentPreference: ContentPreference;
  heartPoints: number;
  gardenStage: number;
  createdAt: string;
}

export interface DailyQuestion {
  id: string;
  text: string;
  category: string;
  depthLevel: 1 | 2 | 3 | 4;
  longDistanceSuitable: boolean;
  active: boolean;
}

export interface DailyQuestionAnswer {
  id: string;
  coupleId: string;
  questionId: string;
  userId: string;
  answerText: string;
  createdAt: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  titleKey?: string;
  descriptionKey?: string;
  category: QuestCategory;
  estimatedMinutes: number;
  effortLevel: EffortLevel;
  rewardPoints: number;
  rewardSeedType?: string;
  requiresBothPartners: boolean;
}

export interface CoupleQuest {
  id: string;
  coupleId: string;
  questId: string;
  status: 'available' | 'accepted' | 'completed';
  completedByUserIds: string[];
  completedAt?: string;
}

export interface GardenObject {
  id: string;
  coupleId: string;
  type: GardenObjectType;
  sourceType: GardenSourceType;
  sourceId?: string;
  label: string;
  positionX: number;
  positionY: number;
  level: number;
  createdAt: string;
}

export interface LoveJarNote {
  id: string;
  coupleId: string;
  authorId: string;
  text: string;
  category: LoveJarCategory;
  isDrawn: boolean;
  drawnAt?: string;
  createdAt: string;
}

export interface MemoryEntry {
  id: string;
  coupleId: string;
  authorId: string;
  title: string;
  description?: string;
  date: string;
  imageUrl?: string;
  category: MemoryCategory;
  linkedGardenObjectId?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  coupleId: string | null;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  titleKey?: string | null;
  bodyKey?: string | null;
  params?: Record<string, unknown>;
  sourceType: string;
  sourceId?: string;
  readAt?: string | null;
  createdAt: string;
}

export interface KnowMeGuess {
  id: string;
  userId: string;
  userName?: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  createdAt: string;
}

export interface KnowMeCatalogQuestion {
  id: string;
  questionText: string;
  category: string;
}

export interface KnowMeRound {
  id: string;
  coupleId: string;
  authorId: string;
  authorName?: string;
  catalogQuestionId?: string | null;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  status: 'open' | 'answered';
  rewardAppliedAt?: string | null;
  answeredAt?: string | null;
  createdAt: string;
  guess: KnowMeGuess | null;
}
