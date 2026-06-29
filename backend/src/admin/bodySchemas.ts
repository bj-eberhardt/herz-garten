import { z } from 'zod';

const trimmedString = z.string().transform((value) => value.trim());
const boundedQueryString = trimmedString.pipe(z.string().max(200));
const optionalBoundedQueryString = boundedQueryString.optional();
const integerQueryString = z
  .string()
  .trim()
  .regex(/^\d+$/)
  .transform((value) => Number(value));
const localeQueryString = z
  .string()
  .trim()
  .regex(/^[a-z]{2}(?:-[A-Z]{2})?$/);
const localeCodeString = z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/);
const webUrlString = trimmedString
  .pipe(z.string().max(2048).url())
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  });
const messageTemplateDescription = trimmedString.pipe(z.string().max(500));
const messageTemplateTranslationSchema = z
  .object({
    text: trimmedString.optional(),
    description: messageTemplateDescription.optional(),
  })
  .strict()
  .refine(
    (translation) =>
      Object.prototype.hasOwnProperty.call(translation, 'text') ||
      Object.prototype.hasOwnProperty.call(translation, 'description'),
  );
const translationValueSchema = z.record(z.string(), z.unknown());
const translationsSchema = z.record(z.string(), translationValueSchema).optional();
const localizedLabelSchema = z
  .object({
    label: trimmedString.pipe(z.string().max(200)).optional(),
  })
  .strict();
const localizedLabelsSchema = z.record(localeCodeString, localizedLabelSchema);
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
    password: trimmedString.pipe(z.string().min(1)),
  })
  .strict();
export const emptyQuerySchema = z.object({}).strict();

export const adminListQuerySchema = z
  .object({
    search: optionalBoundedQueryString,
    limit: integerQueryString.pipe(z.number().int().min(1).max(100)).optional(),
    offset: integerQueryString.pipe(z.number().int().min(0)).optional(),
    format: z.enum(['json', 'csv']).optional(),
  })
  .strict();

export const adminContentListQuerySchema = z
  .object({
    search: optionalBoundedQueryString,
    category: optionalBoundedQueryString,
    active: z.enum(['true', 'false']).optional(),
  })
  .strict();

export const adminCategoriesQuerySchema = z
  .object({
    type: optionalBoundedQueryString,
    lang: localeQueryString.optional(),
  })
  .strict();

export const adminLocalizedQuerySchema = z
  .object({
    lang: localeQueryString.optional(),
  })
  .strict();

export const adminMessageTemplatesQuerySchema = z
  .object({
    namespace: z.enum(['notifications', 'push', 'email']).optional(),
    lang: localeQueryString.optional(),
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
    label: trimmedString.pipe(z.string().max(200)).optional(),
    active: z.boolean(),
    sortOrder: z.number().int(),
    translations: localizedLabelsSchema,
  })
  .strict();

export const adminCouplePreferencesBodySchema = z
  .object({
    relationshipType: trimmedString.pipe(z.string().min(1)),
    contentPreference: trimmedString.pipe(z.string().min(1)),
  })
  .strict();

export const adminUserPasswordBodySchema = z
  .object({
    password: trimmedString.pipe(z.string().min(8)),
  })
  .strict();

export const messageTemplateBodySchema = z
  .object({
    translations: z.record(localeCodeString, messageTemplateTranslationSchema).refine((translations) => Object.keys(translations).length > 0),
  })
  .strict();

export const adminSettingsBodySchema = z
  .object({
    auth: z
      .object({
        adminJwtTtlMinutes: z.number().int().positive().max(1440),
        userJwtTtlMinutes: z.number().int().positive().max(43200),
      })
      .strict(),
    server: z
      .object({
        publicBaseUrl: webUrlString,
      })
      .strict(),
    passwordReset: z
      .object({
        ttlMinutes: z.number().int().min(15).max(1440),
        limitPer24h: z.number().int().min(1).max(100),
      })
      .strict(),
    email: z
      .object({
        enabled: z.boolean(),
        smtpHost: trimmedString.pipe(z.string().max(255)),
        smtpPort: z.number().int().min(1).max(65535),
        smtpSecure: z.boolean(),
        smtpUser: trimmedString.pipe(z.string().max(320)),
        smtpPassword: trimmedString.pipe(z.string().max(1024)).optional(),
        fromAddress: trimmedString.pipe(z.string().max(320).email()).or(z.literal('')),
        fromName: trimmedString.pipe(z.string().max(120)),
        replyTo: trimmedString.pipe(z.string().max(320).email()).or(z.literal('')),
      })
      .strict()
      .superRefine((email, context) => {
        if (!email.enabled) return;
        if (!email.smtpHost) {
          context.addIssue({ code: 'custom', path: ['smtpHost'], message: 'SMTP host is required when email is enabled' });
        }
        if (!email.fromAddress) {
          context.addIssue({ code: 'custom', path: ['fromAddress'], message: 'From address is required when email is enabled' });
        }
      }),
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
