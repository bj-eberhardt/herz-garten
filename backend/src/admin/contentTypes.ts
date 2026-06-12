export type ContentType = 'daily-questions' | 'quests' | 'know-me-catalog' | 'love-jar-templates' | 'memories';
export type EditableContentType = Exclude<ContentType, 'memories'>;

const contentUsageTables: Record<ContentType, string> = {
  'daily-questions': 'daily_questions',
  quests: 'quests',
  'know-me-catalog': 'know_me_catalog_questions',
  'love-jar-templates': 'love_jar_templates',
  memories: 'memory_entries',
};

const editableContentTypes = new Set<EditableContentType>([
  'daily-questions',
  'quests',
  'know-me-catalog',
  'love-jar-templates',
]);

export function usageTableForContentType(contentType: ContentType) {
  return contentUsageTables[contentType];
}

export function isContentType(value: string): value is ContentType {
  return value in contentUsageTables;
}

export function isEditableContentType(value: string): value is EditableContentType {
  return editableContentTypes.has(value as EditableContentType);
}
