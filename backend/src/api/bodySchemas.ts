import { z } from 'zod';

export const emptyBodySchema = z.object({}).strict();

const trimmedString = z.string().transform((value) => value.trim());
const trimmedNullableString = z
  .string()
  .transform((value) => value.trim())
  .nullable();

export const authRegisterBodySchema = z
  .object({
    email: trimmedString.optional(),
    displayName: trimmedString.optional(),
    password: trimmedString.optional(),
  })
  .strict();

export const authLoginBodySchema = z
  .object({
    email: trimmedString.optional(),
    password: trimmedString.optional(),
  })
  .strict();

const featureExplainersSchema = z.record(z.string(), z.boolean());
const knownPreferencesSchema = z
  .object({
    featureExplainers: featureExplainersSchema.optional(),
    futureOption: z.object({ enabled: z.boolean() }).strict().optional(),
  })
  .strict();

export const preferencesBodySchema = z
  .object({
    preferences: knownPreferencesSchema.optional(),
    featureExplainers: featureExplainersSchema.optional(),
    futureOption: z.object({ enabled: z.boolean() }).strict().optional(),
  })
  .strict();

export const profileBodySchema = z
  .object({
    email: z.string().trim().email().optional(),
    displayName: trimmedString.optional(),
  })
  .strict();

export const passwordBodySchema = z
  .object({
    currentPassword: trimmedString,
    newPassword: trimmedString.pipe(z.string().min(8)),
  })
  .strict();

export const createCoupleBodySchema = z
  .object({
    relationshipType: trimmedString.optional(),
    contentPreference: trimmedString.optional(),
  })
  .strict();

export const joinCoupleBodySchema = z
  .object({
    inviteCode: trimmedString.optional(),
  })
  .strict();

export const todayAnswerBodySchema = z
  .object({
    answerText: trimmedString.optional(),
  })
  .strict();

export const knowMeCreateBodySchema = z
  .object({
    questionText: trimmedString.optional(),
    catalogQuestionId: trimmedNullableString.optional(),
    options: z.array(trimmedString).optional(),
    correctOptionIndex: z.number().int().optional(),
  })
  .strict();

export const knowMeGuessBodySchema = z
  .object({
    selectedOptionIndex: z.number().int().optional(),
  })
  .strict();

export const loveJarNoteBodySchema = z
  .object({
    text: trimmedString.optional(),
    category: trimmedString.optional(),
  })
  .strict();

export const memoryBodySchema = z
  .object({
    title: trimmedString.optional(),
    description: trimmedNullableString.optional(),
    date: trimmedString.optional(),
    category: trimmedString.optional(),
  })
  .strict();

export const gardenPlacementBodySchema = z
  .object({
    areaKey: trimmedString.optional(),
    positionX: z.number().finite().optional(),
    positionY: z.number().finite().optional(),
    zIndex: z.number().finite().optional(),
    scale: z.number().finite().optional(),
    rotation: z.number().finite().optional(),
  })
  .strict();
