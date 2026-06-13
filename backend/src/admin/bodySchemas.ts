import { z } from 'zod';

const trimmedString = z.string().transform((value) => value.trim());
const translationValueSchema = z.record(z.string(), z.unknown());
const translationsSchema = z.record(z.string(), translationValueSchema).optional();
const preferenceValuesSchema = z.array(trimmedString).optional();
const adminContentFormBase = {
  text: trimmedString.optional(),
  title: trimmedString.optional(),
  description: trimmedString.optional(),
  questionText: trimmedString.optional(),
  category: trimmedString.optional(),
  depthLevel: z.number().int().optional(),
  longDistanceSuitable: z.boolean().optional(),
  estimatedMinutes: z.number().int().optional(),
  effortLevel: trimmedString.optional(),
  rewardPoints: z.number().int().optional(),
  rewardSeedType: trimmedString.optional().nullable(),
  requiresBothPartners: z.boolean().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  translations: translationsSchema,
};

export const adminLoginBodySchema = z
  .object({
    password: trimmedString.optional(),
  })
  .strict();

export const categoryBodySchema = z
  .object({
    contentType: trimmedString.optional(),
    value: trimmedString.optional(),
    label: trimmedString.optional(),
    active: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    relationshipModes: preferenceValuesSchema,
    contentStyles: preferenceValuesSchema,
    translations: translationsSchema,
  })
  .strict();

export const preferenceBodySchema = z
  .object({
    value: trimmedString.optional(),
    label: trimmedString.optional(),
    active: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    translations: translationsSchema,
  })
  .strict();

export const adminCouplePreferencesBodySchema = z
  .object({
    relationshipType: trimmedString.optional(),
    contentPreference: trimmedString.optional(),
  })
  .strict();

export const messageTemplateBodySchema = z
  .object({
    translations: z.record(
      z.string(),
      z
        .object({
          text: trimmedString.optional(),
        })
        .strict(),
    ),
  })
  .strict();

export const dailyQuestionBodySchema = z
  .object({
    ...adminContentFormBase,
  })
  .strict();

export const questBodySchema = z
  .object({
    ...adminContentFormBase,
  })
  .strict();

export const knowMeCatalogBodySchema = z
  .object({
    ...adminContentFormBase,
  })
  .strict();

export const loveJarTemplateBodySchema = z
  .object({
    ...adminContentFormBase,
  })
  .strict();

export function contentBodySchema(type: string) {
  if (type === 'daily-questions') return dailyQuestionBodySchema;
  if (type === 'quests') return questBodySchema;
  if (type === 'know-me-catalog') return knowMeCatalogBodySchema;
  return loveJarTemplateBodySchema;
}
