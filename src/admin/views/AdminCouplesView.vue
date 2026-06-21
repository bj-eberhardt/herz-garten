<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Download } from '@lucide/vue';
import { adminApiRequest } from '@/admin/services/adminApi';
import AdminPageHeader from '@/admin/components/common/AdminPageHeader.vue';
import AdminSearchField from '@/admin/components/common/AdminSearchField.vue';
import AdminTable from '@/admin/components/common/AdminTable.vue';
import AdminToolbar from '@/admin/components/common/AdminToolbar.vue';
import { useAdminExportDownload } from '@/admin/composables/useAdminExportDownload';

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
const { download: downloadExport } = useAdminExportDownload('herzgarten-couples');

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
  await downloadExport(`/api/admin/couples?${params}`, format);
}

onMounted(() => {
  const querySearch = typeof route.query.search === 'string' ? route.query.search : '';
  if (querySearch) search.value = querySearch;
  loadCouples();
});

function filterUsers(value: string) {
  router.push({ path: '/admin/users', query: { search: value } });
}

function sortedMembers(couple: AdminCouple) {
  return [...couple.members].sort((left, right) => left.email.localeCompare(right.email));
}
</script>

<template>
  <section class="admin-view" data-testid="admin-couples">
    <AdminPageHeader :title="t('admin.couples.title')" :badge="total" />

    <AdminToolbar>
      <AdminSearchField v-model="search" :placeholder="t('admin.common.search')" test-id="admin-couples-search" @submit="loadCouples" />
      <button class="secondary-button" type="button" data-testid="admin-couples-search-submit" @click="loadCouples">{{ t('admin.common.searchAction') }}</button>
      <button class="secondary-button" type="button" data-testid="admin-couples-export-json" @click="download('json')">
        <Download :size="18" aria-hidden="true" />
        JSON
      </button>
      <button class="secondary-button" type="button" data-testid="admin-couples-export-csv" @click="download('csv')">
        <Download :size="18" aria-hidden="true" />
        CSV
      </button>
    </AdminToolbar>

    <AdminTable :loading="loading" :loading-text="t('admin.common.loading')">
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
              <button
                v-for="member in sortedMembers(couple)"
                :key="member.id"
                class="admin-chip admin-chip-button"
                type="button"
                :data-testid="`admin-couple-member-filter-${member.id}`"
                @click="filterUsers(member.email)"
              >
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
              <RouterLink class="secondary-button admin-small-button" :data-testid="`admin-couple-details-${couple.id}`" :to="{ path: `/admin/couples/${couple.id}`, query: search ? { search } : {} }">
                {{ t('admin.common.details') }}
              </RouterLink>
            </td>
          </tr>
        </tbody>
    </AdminTable>
  </section>
</template>
