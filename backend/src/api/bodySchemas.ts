import { z } from 'zod';

export const emptyBodySchema = z.object({}).strict();

export const configResponseSchema = z.object({
  defaultLocale: z.string(),
  supportedLocales: z.array(
    z.object({
      locale: z.string(),
      label: z.string(),
      isDefault: z.boolean(),
    }),
  ),
  features: z
    .object({
      passwordResetEmailEnabled: z.boolean(),
    })
    .strict(),
});
export type ConfigResponse = z.infer<typeof configResponseSchema>;
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
export type AuthRegisterBody = z.infer<typeof authRegisterBodySchema>;

export const authLoginBodySchema = z
  .object({
    email: trimmedString.optional(),
    password: trimmedString.optional(),
  })
  .strict();
export type AuthLoginBody = z.infer<typeof authLoginBodySchema>;

export const forgotPasswordBodySchema = z
  .object({
    email: z.string().trim().email(),
  })
  .strict();
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;

export const resetPasswordBodySchema = z
  .object({
    token: trimmedString.pipe(z.string().min(32)),
    password: trimmedString.pipe(z.string().min(8)),
  })
  .strict();
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;

const featureExplainersSchema = z.record(z.string(), z.boolean());
const pushNotificationModeSchema = z.enum(['all', 'actions_only']);
const knownPreferencesSchema = z
  .object({
    featureExplainers: featureExplainersSchema.optional(),
    pushNotificationMode: pushNotificationModeSchema.optional(),
    futureOption: z.object({ enabled: z.boolean() }).strict().optional(),
  })
  .strict();

export const preferencesBodySchema = z
  .object({
    preferences: knownPreferencesSchema.optional(),
    featureExplainers: featureExplainersSchema.optional(),
    pushNotificationMode: pushNotificationModeSchema.optional(),
    futureOption: z.object({ enabled: z.boolean() }).strict().optional(),
  })
  .strict();
export type PreferencesBody = z.infer<typeof preferencesBodySchema>;

export const profileBodySchema = z
  .object({
    email: z.string().trim().email().optional(),
    displayName: trimmedString.optional(),
  })
  .strict();
export type ProfileBody = z.infer<typeof profileBodySchema>;

export const passwordBodySchema = z
  .object({
    currentPassword: trimmedString,
    newPassword: trimmedString.pipe(z.string().min(8)),
  })
  .strict();
export type PasswordBody = z.infer<typeof passwordBodySchema>;

export const createCoupleBodySchema = z
  .object({
    relationshipType: trimmedString.optional(),
    contentPreference: trimmedString.optional(),
  })
  .strict();
export type CreateCoupleBody = z.infer<typeof createCoupleBodySchema>;

export const joinCoupleBodySchema = z
  .object({
    inviteCode: trimmedString.optional(),
  })
  .strict();
export type JoinCoupleBody = z.infer<typeof joinCoupleBodySchema>;

export const todayAnswerBodySchema = z
  .object({
    answerText: trimmedString.optional(),
  })
  .strict();
export type TodayAnswerBody = z.infer<typeof todayAnswerBodySchema>;

export const knowMeCreateBodySchema = z
  .object({
    questionText: trimmedString.optional(),
    catalogQuestionId: trimmedNullableString.optional(),
    options: z.array(trimmedString).optional(),
    correctOptionIndex: z.number().int().optional(),
  })
  .strict();
export type KnowMeCreateBody = z.infer<typeof knowMeCreateBodySchema>;

export const knowMeGuessBodySchema = z
  .object({
    selectedOptionIndex: z.number().int().optional(),
  })
  .strict();
export type KnowMeGuessBody = z.infer<typeof knowMeGuessBodySchema>;

export const loveJarNoteBodySchema = z
  .object({
    text: trimmedString.optional(),
    category: trimmedString.optional(),
  })
  .strict();
export type LoveJarNoteBody = z.infer<typeof loveJarNoteBodySchema>;

export const memoryBodySchema = z
  .object({
    title: trimmedString.optional(),
    description: trimmedNullableString.optional(),
    date: trimmedString.optional(),
    category: trimmedString.optional(),
  })
  .strict();
export type MemoryBody = z.infer<typeof memoryBodySchema>;

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
export type GardenPlacementBody = z.infer<typeof gardenPlacementBodySchema>;

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
export type PushSubscriptionBody = z.infer<typeof pushSubscriptionBodySchema>;

export const pushUnsubscribeBodySchema = z
  .object({
    endpoint: trimmedString.pipe(z.string().url()).optional(),
  })
  .strict();
export type PushUnsubscribeBody = z.infer<typeof pushUnsubscribeBodySchema>;

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
export type QuestQuery = z.infer<typeof questQuerySchema>;
