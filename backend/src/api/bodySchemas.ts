import { z } from 'zod';

export const emptyBodySchema = z.object({}).strict();

const trimmedString = z.string().transform((value) => value.trim());
const trimmedNullableString = z
  .string()
  .transform((value) => value.trim())
  .nullable();
const optionalQueryString = z.string().optional();

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
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: 'At least one placement field is required',
  });

export const pushSubscriptionBodySchema = z
  .object({
    endpoint: trimmedString.pipe(z.string().url()),
    expirationTime: z.number().nullable().optional(),
    keys: z
      .object({
        p256dh: trimmedString.pipe(z.string().min(1)),
        auth: trimmedString.pipe(z.string().min(1)),
      })
      .strict(),
  })
  .strict();

export const pushUnsubscribeBodySchema = z
  .object({
    endpoint: trimmedString.pipe(z.string().url()).optional(),
  })
  .strict();

export const questQuerySchema = z
  .object({
    category: optionalQueryString,
    effortLevel: z.enum(['all', 'low', 'medium', 'high']).optional(),
    maxMinutes: z
      .string()
      .regex(/^\d+$/)
      .refine((value) => Number(value) > 0)
      .optional(),
    mode: z.enum(['all', 'solo', 'together', 'long_distance']).optional(),
    lang: optionalQueryString,
  })
  .strict();
