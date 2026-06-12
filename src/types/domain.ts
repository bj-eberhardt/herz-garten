export type RelationshipType = 'local' | 'long_distance' | 'mixed';
export type ContentPreference = 'romantic' | 'playful' | 'deep' | 'balanced';
export type QuestCategory = 'romance' | 'date' | 'humor' | 'memory' | 'teamwork' | 'long_distance';
export type EffortLevel = 'low' | 'medium' | 'high';
export type GardenObjectType = 'flower' | 'tree' | 'bench' | 'light' | 'stone' | 'pond' | 'decoration';
export type GardenSourceType = 'question' | 'quest' | 'memory' | 'love_jar' | 'milestone' | 'know_me';
export type GardenAreaKey =
  | 'heart_bed'
  | 'flower_meadow'
  | 'bench_grove'
  | 'memory_tree'
  | 'light_meadow'
  | 'pond'
  | 'picnic'
  | 'star_meadow'
  | 'wishing_well'
  | 'garden_fest';
export type LoveJarCategory = string;
export type MemoryCategory = string;
export type FeatureExplainerKey =
  | 'onboarding'
  | 'today'
  | 'quests'
  | 'garden'
  | 'knowMe'
  | 'loveJar'
  | 'memories'
  | 'notifications'
  | 'settings';

export interface UserPreferences {
  featureExplainers: Record<FeatureExplainerKey, boolean> & Record<string, boolean>;
  [key: string]: unknown;
}

export interface CategoryOption {
  value: string;
  label: string;
}
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
  memberCount?: number;
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
  categoryLabel?: string;
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
  areaKey: GardenAreaKey;
  assetKey: string;
  historyTitle?: string | null;
  positionX: number;
  positionY: number;
  zIndex: number;
  scale: number;
  rotation: number;
  placedByUser: boolean;
  rewardPoints: number;
  level: number;
  createdAt: string;
}

export interface GardenArea {
  key: GardenAreaKey;
  label: string;
  stageUnlock: number;
  startX: number;
  width: number;
  accent: string;
  backgroundImage: string;
}

export interface GardenAsset {
  key: string;
  label: string;
  objectType: GardenObjectType;
  sourceTypes: GardenSourceType[];
  stageUnlock: number;
  image: string;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
}

export interface GardenUnlock {
  stage: number;
  points: number;
  unlock: string;
  areaKey: GardenAreaKey;
  areaLabel: string;
}

export interface GardenNextUnlock extends GardenUnlock {
  pointsRemaining: number;
}

export interface LoveJarNote {
  id: string;
  coupleId: string;
  authorId: string;
  text: string;
  category: LoveJarCategory;
  categoryLabel?: string;
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
  categoryLabel?: string;
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
