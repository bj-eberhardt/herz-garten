<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { adminApiRequest } from '@/admin/services/adminApi';

interface AuditEntry {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

const entries = ref<AuditEntry[]>([]);
const { t } = useI18n();

function metadataValue(entry: AuditEntry, key: string) {
  const value = entry.metadata?.[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function resourceLabel(entry: AuditEntry) {
  return entry.resourceId ?? metadataValue(entry, 'key') ?? metadataValue(entry, 'value') ?? '';
}

async function loadAuditLog() {
  const payload = await adminApiRequest<{ items: AuditEntry[] }>('/api/admin/audit-log');
  entries.value = payload.items;
}

onMounted(loadAuditLog);
</script>

<template>
  <section class="admin-view" data-testid="admin-audit-log">
    <div class="admin-heading">
      <h1>{{ t('admin.auditLog.title') }}</h1>
      <span>{{ entries.length }}</span>
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>{{ t('admin.auditLog.time') }}</th>
            <th>{{ t('admin.auditLog.action') }}</th>
            <th>{{ t('admin.auditLog.resource') }}</th>
            <th>{{ t('admin.auditLog.metadata') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in entries" :key="entry.id">
            <td>{{ new Date(entry.createdAt).toLocaleString('de-DE') }}</td>
            <td>{{ entry.action }}</td>
            <td>
              <strong>{{ entry.resourceType }}</strong>
              <span v-if="resourceLabel(entry)" class="admin-audit-resource-id">{{ resourceLabel(entry) }}</span>
            </td>
            <td><code>{{ JSON.stringify(entry.metadata) }}</code></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
