<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Download, KeyRound, Save, Search } from '@lucide/vue';
import { adminApiRequest, adminDownloadUrl, getAdminToken } from '@/admin/services/adminApi';
import { ApiError } from '@/services/api';

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
const passwordUserId = ref('');
const newPassword = ref('');
const passwordSaving = ref(false);
const passwordError = ref('');
const passwordSuccess = ref('');
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

function startPasswordReset(user: AdminUser) {
  passwordUserId.value = user.id;
  newPassword.value = '';
  passwordError.value = '';
  passwordSuccess.value = '';
}

function cancelPasswordReset() {
  passwordUserId.value = '';
  newPassword.value = '';
  passwordError.value = '';
}

function localizeAdminError(caught: unknown) {
  if (caught instanceof ApiError && caught.errorKey) {
    const key = `admin.serverErrors.${caught.errorKey}`;
    const translated = t(key, caught.params ?? {});
    if (translated !== key) return translated;
  }

  return t('admin.users.passwordResetError');
}

async function saveUserPassword(user: AdminUser) {
  passwordError.value = '';
  passwordSuccess.value = '';
  if (newPassword.value.trim().length < 8) {
    passwordError.value = t('admin.users.passwordMinLength');
    return;
  }

  passwordSaving.value = true;
  try {
    await adminApiRequest(`/api/admin/users/${user.id}/password`, {
      method: 'POST',
      body: JSON.stringify({ password: newPassword.value }),
    });
    passwordSuccess.value = t('admin.users.passwordResetSaved', { name: user.displayName });
    cancelPasswordReset();
  } catch (caught) {
    passwordError.value = localizeAdminError(caught);
  } finally {
    passwordSaving.value = false;
  }
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
            <th>{{ t('admin.common.edit') }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="user in users" :key="user.id">
          <tr>
            <td>{{ user.displayName }}</td>
            <td>{{ user.email }}</td>
            <td>
              <button
                v-for="couple in user.couples"
                :key="couple.coupleId"
                class="admin-chip admin-chip-button"
                type="button"
                :data-testid="`admin-user-couple-filter-${couple.coupleId}`"
                @click="filterCouples(couple.inviteCode)"
              >
                {{ couple.inviteCode }} · {{ t('admin.users.pointsInline', { count: couple.heartPoints }) }}
              </button>
            </td>
            <td>{{ new Date(user.createdAt).toLocaleDateString('de-DE') }}</td>
            <td class="admin-actions">
              <button class="secondary-button admin-small-button" type="button" data-testid="admin-user-password-reset-open" @click="startPasswordReset(user)">
                <KeyRound :size="16" aria-hidden="true" />
                {{ t('admin.users.resetPassword') }}
              </button>
            </td>
          </tr>
          <tr v-if="passwordUserId === user.id" class="admin-inline-form-row">
            <td colspan="5">
                <form class="admin-inline-form" data-testid="admin-user-password-reset-form" novalidate @submit.prevent="saveUserPassword(user)">
                <label>
                  {{ t('admin.users.newPassword') }}
                  <input
                    v-model="newPassword"
                    type="password"
                    autocomplete="new-password"
                    minlength="8"
                    data-testid="admin-user-password-reset-input"
                    required
                  />
                </label>
                <div class="admin-inline-actions">
                  <button class="primary-button inline-button" type="submit" :disabled="passwordSaving" data-testid="admin-user-password-reset-save">
                    <Save :size="16" aria-hidden="true" />
                    {{ passwordSaving ? t('admin.common.saving') : t('admin.common.save') }}
                  </button>
                  <button class="secondary-button inline-button" type="button" data-testid="admin-user-password-reset-close" @click="cancelPasswordReset">{{ t('admin.common.close') }}</button>
                </div>
                <p v-if="passwordError" class="form-error" data-testid="admin-user-password-reset-error">{{ passwordError }}</p>
              </form>
            </td>
          </tr>
          </template>
        </tbody>
      </table>
    </div>
    <p v-if="passwordSuccess" class="success-note" data-testid="admin-user-password-reset-success">{{ passwordSuccess }}</p>
    <p v-if="loading" class="muted">{{ t('admin.common.loading') }}</p>
  </section>
</template>
