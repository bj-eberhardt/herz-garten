import { insertAuditEntry, listAuditEntries } from './audit.repository.js';

export async function audit(
  action: string,
  resourceType: string,
  resourceId: string | null,
  metadata: Record<string, unknown> = {},
) {
  await insertAuditEntry(action, resourceType, resourceId, metadata);
}

export async function buildAuditLogPayload() {
  return { items: await listAuditEntries(100) };
}
