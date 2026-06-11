import { expect, type APIResponse } from '@playwright/test';
import type {
  Couple,
  DailyQuestion,
  GardenObject,
  KnowMeCatalogQuestion,
  KnowMeRound,
  LoveJarNote,
  MemoryEntry,
  NotificationItem,
  Quest,
  User,
} from '../../../src/types/domain';

export interface AuthPayload {
  token: string;
  user: Pick<User, 'id' | 'email' | 'displayName'> & { preferences?: Record<string, unknown> };
}

export interface ErrorPayload {
  errorKey: string;
  error: string;
  params?: Record<string, unknown>;
}

export interface MePayload {
  user: Pick<User, 'id' | 'email' | 'displayName'> & { preferences?: Record<string, unknown> };
  couple: Couple | null;
}

export interface NotificationsPayload {
  notifications: NotificationItem[];
  unreadCount: number;
}

export interface TodayPayload {
  couple: Couple;
  locale: string;
  question: DailyQuestion;
  instance: { id: string; coupleId: string; questionId: string; date: string; rewardAppliedAt: string | null };
  answeredByCurrentUser: boolean;
  revealed: boolean;
  answers: Array<{
    id: string;
    coupleId: string;
    questionId: string;
    userId: string;
    displayName: string;
    answerText: string | null;
    createdAt: string;
  }>;
}

export interface QuestsPayload {
  couple: Couple;
  locale: string;
  quests: Array<
    Quest & {
      coupleQuest: {
        id: string;
        status: 'available' | 'accepted' | 'completed';
        completedByUserIds: string[];
        completedAt: string | null;
        rewardAppliedAt: string | null;
      } | null;
    }
  >;
  filters: Record<string, unknown>;
}

export interface KnowMePayload {
  couple: Couple;
  locale: string;
  rounds: KnowMeRound[];
  catalogQuestions: KnowMeCatalogQuestion[];
}

export interface LoveJarPayload {
  couple: Couple;
  notes: LoveJarNote[];
  categories?: Array<{ value: string; label: string }>;
  drawStatus: {
    drawnToday: boolean;
    canDrawToday: boolean;
    partnerUnreadCount: number;
    ownUnreadCount: number;
  };
}

export interface MemoriesPayload {
  couple: Couple;
  categories?: Array<{ value: string; label: string }>;
  memories: MemoryEntry[];
}

export interface GardenPayload {
  couple: Couple;
  objects: GardenObject[];
  progress: {
    answeredQuestionCount: number;
    completedQuestCount: number;
    loveJarNoteCount: number;
    drawnLoveJarNoteCount: number;
    memoryCount: number;
    knowMeRoundCount: number;
    knowMeHitCount: number;
    gardenObjectCount: number;
    lastGardenMomentAt: string | null;
  };
}

export interface GardenObjectDetailPayload {
  couple: Couple;
  object: GardenObject | null;
  source: Record<string, unknown> | null;
}

export interface ExportPayload {
  exportedAt: string;
  locale: string;
  user: Pick<User, 'id' | 'email' | 'displayName'>;
  couple: Couple | null;
  data?: Record<string, unknown[]>;
}

export async function expectApiError(response: APIResponse, status: number, errorKey: string) {
  expect(response.status()).toBe(status);
  const payload = (await response.json()) as ErrorPayload;
  expect(payload).toEqual(
    expect.objectContaining({
      errorKey,
      error: expect.any(String),
    }),
  );
  if ('params' in payload) {
    expect(payload.params).toEqual(expect.any(Object));
  }
  return payload;
}

export async function expectJson<T>(response: APIResponse, status = 200) {
  expect(response.status()).toBe(status);
  return (await response.json()) as T;
}

function expectUser(value: unknown) {
  expect(value).toEqual(
    expect.objectContaining({
      id: expect.any(String),
      email: expect.any(String),
      displayName: expect.any(String),
    }),
  );
}

function expectCouple(value: unknown) {
  expect(value).toEqual(
    expect.objectContaining({
      id: expect.any(String),
      inviteCode: expect.stringMatching(/^[a-z]+-[a-z]+-\d{4}$/),
      relationshipType: expect.any(String),
      contentPreference: expect.any(String),
      heartPoints: expect.any(Number),
      gardenStage: expect.any(Number),
      createdAt: expect.any(String),
      memberCount: expect.any(Number),
    }),
  );
}

function expectGardenObject(value: unknown) {
  expect(value).toEqual(
    expect.objectContaining({
      id: expect.any(String),
      coupleId: expect.any(String),
      type: expect.any(String),
      sourceType: expect.any(String),
      label: expect.any(String),
      positionX: expect.any(Number),
      positionY: expect.any(Number),
      level: expect.any(Number),
      createdAt: expect.any(String),
    }),
  );
}

export function expectAuthPayload(payload: AuthPayload) {
  expect(payload.token).toEqual(expect.any(String));
  expectUser(payload.user);
}

export function expectMePayload(payload: MePayload) {
  expectUser(payload.user);
  expect(payload.user.preferences).toEqual(expect.any(Object));
  expect(payload.user.preferences?.featureExplainers).toEqual(expect.any(Object));
  if (payload.couple) expectCouple(payload.couple);
}

export function expectNotificationsPayload(payload: NotificationsPayload) {
  expect(payload.unreadCount).toEqual(expect.any(Number));
  expect(Array.isArray(payload.notifications)).toBeTruthy();
  for (const notification of payload.notifications) {
    expect(notification).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        userId: expect.any(String),
        type: expect.any(String),
        title: expect.any(String),
        body: expect.any(String),
        sourceType: expect.any(String),
        createdAt: expect.any(String),
      }),
    );
  }
}

export function expectTodayPayload(payload: TodayPayload) {
  expectCouple(payload.couple);
  expect(payload.locale).toEqual(expect.any(String));
  expect(payload.question).toEqual(
    expect.objectContaining({
      id: expect.any(String),
      text: expect.any(String),
      category: expect.any(String),
      depthLevel: expect.any(Number),
      longDistanceSuitable: expect.any(Boolean),
      active: expect.any(Boolean),
    }),
  );
  expect(payload.answeredByCurrentUser).toEqual(expect.any(Boolean));
  expect(payload.revealed).toEqual(expect.any(Boolean));
  expect(Array.isArray(payload.answers)).toBeTruthy();
}

export function expectQuestsPayload(payload: QuestsPayload) {
  expectCouple(payload.couple);
  expect(payload.locale).toEqual(expect.any(String));
  expect(Array.isArray(payload.quests)).toBeTruthy();
  expect(payload.filters).toEqual(expect.any(Object));
  for (const quest of payload.quests) {
    expect(quest).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: expect.any(String),
        description: expect.any(String),
        category: expect.any(String),
        estimatedMinutes: expect.any(Number),
        effortLevel: expect.any(String),
        rewardPoints: expect.any(Number),
        requiresBothPartners: expect.any(Boolean),
      }),
    );
  }
}

export function expectKnowMePayload(payload: KnowMePayload) {
  expectCouple(payload.couple);
  expect(payload.locale).toEqual(expect.any(String));
  expect(Array.isArray(payload.rounds)).toBeTruthy();
  expect(Array.isArray(payload.catalogQuestions)).toBeTruthy();
  for (const round of payload.rounds) {
    expect(round).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        coupleId: expect.any(String),
        authorId: expect.any(String),
        questionText: expect.any(String),
        options: expect.any(Array),
        correctOptionIndex: expect.any(Number),
        status: expect.any(String),
        createdAt: expect.any(String),
      }),
    );
  }
}

export function expectLoveJarPayload(payload: LoveJarPayload) {
  expectCouple(payload.couple);
  expect(Array.isArray(payload.notes)).toBeTruthy();
  for (const note of payload.notes) {
    expect(note).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        coupleId: expect.any(String),
        authorId: expect.any(String),
        category: expect.any(String),
        categoryLabel: expect.any(String),
        isDrawn: expect.any(Boolean),
        createdAt: expect.any(String),
      }),
    );
  }
  expect(payload.drawStatus).toEqual(
    expect.objectContaining({
      drawnToday: expect.any(Boolean),
      canDrawToday: expect.any(Boolean),
      partnerUnreadCount: expect.any(Number),
      ownUnreadCount: expect.any(Number),
    }),
  );
}

export function expectMemoriesPayload(payload: MemoriesPayload) {
  expectCouple(payload.couple);
  if (payload.categories) {
    expect(Array.isArray(payload.categories)).toBeTruthy();
  }
  expect(Array.isArray(payload.memories)).toBeTruthy();
  for (const memory of payload.memories) {
    expect(memory).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        coupleId: expect.any(String),
        authorId: expect.any(String),
        title: expect.any(String),
        date: expect.any(String),
        category: expect.any(String),
        categoryLabel: expect.any(String),
        createdAt: expect.any(String),
      }),
    );
  }
}

export function expectGardenPayload(payload: GardenPayload) {
  expectCouple(payload.couple);
  expect(Array.isArray(payload.objects)).toBeTruthy();
  for (const object of payload.objects) expectGardenObject(object);
  expect(payload.progress).toEqual(
    expect.objectContaining({
      answeredQuestionCount: expect.any(Number),
      completedQuestCount: expect.any(Number),
      loveJarNoteCount: expect.any(Number),
      drawnLoveJarNoteCount: expect.any(Number),
      memoryCount: expect.any(Number),
      knowMeRoundCount: expect.any(Number),
      knowMeHitCount: expect.any(Number),
      gardenObjectCount: expect.any(Number),
    }),
  );
}

export function expectGardenObjectDetailPayload(payload: GardenObjectDetailPayload) {
  expectCouple(payload.couple);
  if (payload.object) expectGardenObject(payload.object);
  if (payload.source) expect(payload.source.type).toEqual(expect.any(String));
}

export function expectExportPayload(payload: ExportPayload) {
  expect(payload.exportedAt).toEqual(expect.any(String));
  expect(payload.locale).toEqual(expect.any(String));
  expectUser(payload.user);
  if (payload.couple) expectCouple(payload.couple);
  if (payload.data) expect(payload.data).toEqual(expect.any(Object));
}
