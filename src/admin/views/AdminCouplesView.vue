<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Download, Search } from '@lucide/vue';
import { adminApiRequest, adminDownloadUrl, getAdminToken } from '@/admin/services/adminApi';

interface AdminCouple {
  id: string;
  inviteCode: string;
  relationshipType: string;
  contentPreference: string;
  heartPoints: number;
  gardenStage: number;
  createdAt: string;
  members: Array<{ id: string; email: string; displayName: string; role: string }>;
  completedQuestCount: number;
  loveJarNoteCount: number;
  memoryCount: number;
  knowMeRoundCount: number;
}

const couples = ref<AdminCouple[]>([]);
const total = ref(0);
const search = ref('');
const loading = ref(false);
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

async function loadCouples() {
  loading.value = true;
  try {
    const params = new URLSearchParams({ search: search.value, limit: '50' });
    const payload = await adminApiRequest<{ items: AdminCouple[]; total: number }>(`/api/admin/couples?${params}`);
    couples.value = payload.items;
    total.value = payload.total;
  } finally {
    loading.value = false;
  }
}

async function download(format: 'json' | 'csv') {
  const params = new URLSearchParams({ search: search.value, limit: '100', format });
  const response = await fetch(adminDownloadUrl(`/api/admin/couples?${params}`), {
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `herzgarten-couples.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}

onMounted(() => {
  const querySearch = typeof route.query.search === 'string' ? route.query.search : '';
  if (querySearch) search.value = querySearch;
  loadCouples();
});

function filterUsers(value: string) {
  router.push({ path: '/admin/users', query: { search: value } });
}
</script>

<template>
  <section class="admin-view" data-testid="admin-couples">
    <div class="admin-heading">
      <h1>{{ t('admin.couples.title') }}</h1>
      <span>{{ total }}</span>
    </div>

    <div class="admin-toolbar">
      <label class="admin-search">
        <Search :size="18" aria-hidden="true" />
        <input v-model="search" :placeholder="t('admin.common.search')" data-testid="admin-couples-search" @keyup.enter="loadCouples" />
      </label>
      <button class="secondary-button" type="button" @click="loadCouples">{{ t('admin.common.searchAction') }}</button>
      <button class="secondary-button" type="button" data-testid="admin-couples-export-json" @click="download('json')">
        <Download :size="18" aria-hidden="true" />
        JSON
      </button>
      <button class="secondary-button" type="button" data-testid="admin-couples-export-csv" @click="download('csv')">
        <Download :size="18" aria-hidden="true" />
        CSV
      </button>
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>{{ t('admin.common.code') }}</th>
            <th>{{ t('admin.couples.members') }}</th>
            <th>{{ t('admin.common.points') }}</th>
            <th>{{ t('admin.couples.progress') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="couple in couples" :key="couple.id">
            <td>{{ couple.inviteCode }}</td>
            <td>
              <button v-for="member in couple.members" :key="member.id" class="admin-chip admin-chip-button" type="button" @click="filterUsers(member.email)">
                {{ member.displayName }}
              </button>
            </td>
            <td>{{ t('admin.couples.levelInline', { points: couple.heartPoints, stage: couple.gardenStage }) }}</td>
            <td>
              {{
                t('admin.couples.progressInline', {
                  quests: couple.completedQuestCount,
                  loveJar: couple.loveJarNoteCount,
                  memories: couple.memoryCount,
                  knowMe: couple.knowMeRoundCount,
                })
              }}
            </td>
            <td>
              <RouterLink class="secondary-button admin-small-button" :to="{ path: `/admin/couples/${couple.id}`, query: search ? { search } : {} }">
                {{ t('admin.common.details') }}
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="loading" class="muted">{{ t('admin.common.loading') }}</p>
  </section>
</template>
