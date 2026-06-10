<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { ClipboardList, FileText, LayoutDashboard, LogOut, Users, Workflow } from '@lucide/vue';
import { useAdminStore } from '@/stores/adminStore';

const adminStore = useAdminStore();
const router = useRouter();

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
        <span>Admin</span>
      </RouterLink>
      <nav class="admin-nav" aria-label="Admin">
        <RouterLink to="/admin" class="admin-nav-item">
          <LayoutDashboard :size="18" aria-hidden="true" />
          Dashboard
        </RouterLink>
        <RouterLink to="/admin/users" class="admin-nav-item">
          <Users :size="18" aria-hidden="true" />
          User
        </RouterLink>
        <RouterLink to="/admin/couples" class="admin-nav-item">
          <Workflow :size="18" aria-hidden="true" />
          Paarräume
        </RouterLink>
        <RouterLink to="/admin/content" class="admin-nav-item">
          <FileText :size="18" aria-hidden="true" />
          Content
        </RouterLink>
        <RouterLink to="/admin/audit-log" class="admin-nav-item">
          <ClipboardList :size="18" aria-hidden="true" />
          Audit
        </RouterLink>
      </nav>
      <button class="admin-nav-item admin-logout" type="button" data-testid="admin-logout" @click="logout">
        <LogOut :size="18" aria-hidden="true" />
        Logout
      </button>
    </aside>

    <main class="admin-main">
      <div v-if="adminStore.usesDefaultAdminPassword" class="admin-warning" data-testid="admin-default-password-warning">
        Default-Passwort aktiv
      </div>
      <RouterView />
    </main>
  </div>
</template>
