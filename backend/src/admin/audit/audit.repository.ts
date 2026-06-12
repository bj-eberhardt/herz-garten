import { randomUUID } from 'node:crypto';
import { pool } from '../../db.js';

export async function insertAuditEntry(
  action: string,
  resourceType: string,
  resourceId: string | null,
  metadata: Record<string, unknown> = {},
) {
  await pool.query(
    `
      insert into admin_audit_log (id, action, resource_type, resource_id, metadata)
      values ($1, $2, $3, $4, $5)
    `,
    [randomUUID(), action, resourceType, resourceId, JSON.stringify(metadata)],
  );
}

export async function listAuditEntries(limit = 100) {
  const result = await pool.query(
    `
      select id, action, resource_type as "resourceType", resource_id as "resourceId", metadata, created_at as "createdAt"
      from admin_audit_log
      order by created_at desc
      limit $1
    `,
    [limit],
  );
  return result.rows;
}
