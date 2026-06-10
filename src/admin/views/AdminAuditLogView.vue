<script setup lang="ts">
import { onMounted, ref } from 'vue';
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

async function loadAuditLog() {
  const payload = await adminApiRequest<{ items: AuditEntry[] }>('/api/admin/audit-log');
  entries.value = payload.items;
}

onMounted(loadAuditLog);
</script>

<template>
  <section class="admin-view" data-testid="admin-audit-log">
    <div class="admin-heading">
      <h1>Audit</h1>
      <span>{{ entries.length }}</span>
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Zeit</th>
            <th>Aktion</th>
            <th>Resource</th>
            <th>Metadata</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in entries" :key="entry.id">
            <td>{{ new Date(entry.createdAt).toLocaleString('de-DE') }}</td>
            <td>{{ entry.action }}</td>
            <td>{{ entry.resourceType }} · {{ entry.resourceId }}</td>
            <td><code>{{ JSON.stringify(entry.metadata) }}</code></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
