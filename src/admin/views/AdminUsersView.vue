<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Download, Search } from '@lucide/vue';
import { adminApiRequest, adminDownloadUrl, getAdminToken } from '@/admin/services/adminApi';

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  couples: Array<{ coupleId: string; inviteCode: string; role: string; heartPoints: number; gardenStage: number }>;
}

const users = ref<AdminUser[]>([]);
const total = ref(0);
const search = ref('');
const loading = ref(false);
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

async function loadUsers() {
  loading.value = true;
  try {
    const params = new URLSearchParams({ search: search.value, limit: '50' });
    const payload = await adminApiRequest<{ items: AdminUser[]; total: number }>(`/api/admin/users?${params}`);
    users.value = payload.items;
    total.value = payload.total;
  } finally {
    loading.value = false;
  }
}

async function download(format: 'json' | 'csv') {
  const params = new URLSearchParams({ search: search.value, limit: '100', format });
  const response = await fetch(adminDownloadUrl(`/api/admin/users?${params}`), {
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `herzgarten-users.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}

onMounted(() => {
  const querySearch = typeof route.query.search === 'string' ? route.query.search : '';
  if (querySearch) search.value = querySearch;
  loadUsers();
});

function filterCouples(inviteCode: string) {
  router.push({ path: '/admin/couples', query: { search: inviteCode } });
}
</script>

<template>
  <section class="admin-view" data-testid="admin-users">
    <div class="admin-heading">
      <h1>{{ t('admin.users.title') }}</h1>
      <span>{{ total }}</span>
    </div>

    <div class="admin-toolbar">
      <label class="admin-search">
        <Search :size="18" aria-hidden="true" />
        <input v-model="search" :placeholder="t('admin.common.search')" data-testid="admin-users-search" @keyup.enter="loadUsers" />
      </label>
      <button class="secondary-button" type="button" data-testid="admin-users-search-submit" @click="loadUsers">{{ t('admin.common.searchAction') }}</button>
      <button class="secondary-button" type="button" data-testid="admin-users-export-json" @click="download('json')">
        <Download :size="18" aria-hidden="true" />
        JSON
      </button>
      <button class="secondary-button" type="button" data-testid="admin-users-export-csv" @click="download('csv')">
        <Download :size="18" aria-hidden="true" />
        CSV
      </button>
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>{{ t('admin.common.name') }}</th>
            <th>E-Mail</th>
            <th>{{ t('admin.users.couples') }}</th>
            <th>{{ t('admin.common.created') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.displayName }}</td>
            <td>{{ user.email }}</td>
            <td>
              <button v-for="couple in user.couples" :key="couple.coupleId" class="admin-chip admin-chip-button" type="button" @click="filterCouples(couple.inviteCode)">
                {{ couple.inviteCode }} · {{ t('admin.users.pointsInline', { count: couple.heartPoints }) }}
              </button>
            </td>
            <td>{{ new Date(user.createdAt).toLocaleDateString('de-DE') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="loading" class="muted">{{ t('admin.common.loading') }}</p>
  </section>
</template>
