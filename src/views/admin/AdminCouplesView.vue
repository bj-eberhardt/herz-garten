<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { Download, Search } from '@lucide/vue';
import { adminApiRequest, adminDownloadUrl, getAdminToken } from '@/services/adminApi';

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

onMounted(loadCouples);
</script>

<template>
  <section class="admin-view" data-testid="admin-couples">
    <div class="admin-heading">
      <h1>Paarräume</h1>
      <span>{{ total }}</span>
    </div>

    <div class="admin-toolbar">
      <label class="admin-search">
        <Search :size="18" aria-hidden="true" />
        <input v-model="search" placeholder="Suche" data-testid="admin-couples-search" @keyup.enter="loadCouples" />
      </label>
      <button class="secondary-button" type="button" @click="loadCouples">Suchen</button>
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
            <th>Code</th>
            <th>Mitglieder</th>
            <th>Punkte</th>
            <th>Fortschritt</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="couple in couples" :key="couple.id">
            <td>{{ couple.inviteCode }}</td>
            <td>
              <span v-for="member in couple.members" :key="member.id" class="admin-chip">{{ member.displayName }}</span>
            </td>
            <td>{{ couple.heartPoints }} · Stage {{ couple.gardenStage }}</td>
            <td>
              {{ couple.completedQuestCount }} Quests · {{ couple.loveJarNoteCount }} Jar ·
              {{ couple.memoryCount }} Memories · {{ couple.knowMeRoundCount }} Know Me
            </td>
            <td>
              <RouterLink class="secondary-button admin-small-button" :to="`/admin/couples/${couple.id}`">Details</RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="loading" class="muted">Lade...</p>
  </section>
</template>
