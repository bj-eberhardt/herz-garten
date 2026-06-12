import {
  deleteCategory as deleteCategoryRecord,
  listCategories as listCategoryRecords,
  saveCategory as saveCategoryRecord,
} from './categories.repository.js';
import type { ContentType } from '../contentTypes.js';

export { categoryExists } from './categories.repository.js';

export async function listCategories(type?: ContentType, locale = 'de') {
  return listCategoryRecords(type, locale);
}

export async function saveCategory(body: Record<string, unknown>, id?: string) {
  return saveCategoryRecord(body, id);
}

export async function deleteCategory(id: string) {
  return deleteCategoryRecord(id);
}
