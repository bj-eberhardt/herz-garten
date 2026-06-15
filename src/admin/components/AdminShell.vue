<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ClipboardList, FileText, FolderTree, LayoutDashboard, LogOut, MessageSquare, Sprout, Tags, Users, Workflow } from '@lucide/vue';
import { useAdminStore } from '@/admin/stores/adminStore';
import '@/admin/admin.css';

const adminStore = useAdminStore();
const router = useRouter();
const { t } = useI18n();

function logout() {
  adminStore.logout();
  router.push('/admin/login');
}
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <RouterLink to="/admin" class="admin-brand" data-testid="admin-brand">
        <span class="brand-mark">H</span>
        <span>{{ t('admin.shell.brand') }}</span>
      </RouterLink>
      <nav class="admin-nav" :aria-label="t('admin.shell.navLabel')">
        <RouterLink to="/admin" class="admin-nav-item">
          <LayoutDashboard :size="18" aria-hidden="true" />
          {{ t('admin.shell.nav.dashboard') }}
        </RouterLink>
        <RouterLink to="/admin/users" class="admin-nav-item">
          <Users :size="18" aria-hidden="true" />
          {{ t('admin.shell.nav.users') }}
        </RouterLink>
        <RouterLink to="/admin/couples" class="admin-nav-item">
          <Workflow :size="18" aria-hidden="true" />
          {{ t('admin.shell.nav.couples') }}
        </RouterLink>
        <RouterLink to="/admin/content" class="admin-nav-item">
          <FileText :size="18" aria-hidden="true" />
          {{ t('admin.shell.nav.content') }}
        </RouterLink>
        <RouterLink to="/admin/garden" class="admin-nav-item">
          <Sprout :size="18" aria-hidden="true" />
          {{ t('admin.shell.nav.garden') }}
        </RouterLink>
        <RouterLink to="/admin/categories" class="admin-nav-item">
          <FolderTree :size="18" aria-hidden="true" />
          {{ t('admin.shell.nav.categories') }}
        </RouterLink>
        <RouterLink to="/admin/taxonomies" class="admin-nav-item">
          <Tags :size="18" aria-hidden="true" />
          {{ t('admin.shell.nav.taxonomies') }}
        </RouterLink>
        <RouterLink to="/admin/messages" class="admin-nav-item">
          <MessageSquare :size="18" aria-hidden="true" />
          {{ t('admin.shell.nav.messages') }}
        </RouterLink>
        <RouterLink to="/admin/audit-log" class="admin-nav-item">
          <ClipboardList :size="18" aria-hidden="true" />
          {{ t('admin.shell.nav.auditLog') }}
        </RouterLink>
      </nav>
      <button class="admin-nav-item admin-logout" type="button" data-testid="admin-logout" @click="logout">
        <LogOut :size="18" aria-hidden="true" />
        {{ t('admin.shell.logout') }}
      </button>
    </aside>

    <main class="admin-main">
      <div v-if="adminStore.usesDefaultAdminPassword" class="admin-warning" data-testid="admin-default-password-warning">
        {{ t('admin.shell.defaultPasswordWarning') }}
      </div>
      <RouterView />
    </main>
  </div>
</template>
