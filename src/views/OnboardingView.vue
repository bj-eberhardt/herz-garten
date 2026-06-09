<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { LogIn, Sprout, UserPlus } from '@lucide/vue';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const mode = ref<'login' | 'register'>('register');
const displayName = ref('');
const email = ref('');
const password = ref('');
const inviteCode = ref('');
const formError = ref('');

async function submitAuth() {
  formError.value = '';
  try {
    if (mode.value === 'register') {
      await authStore.register(displayName.value, email.value, password.value);
    } else {
      await authStore.login(email.value, password.value);
    }
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Anmeldung fehlgeschlagen';
  }
}

async function createCouple() {
  formError.value = '';
  try {
    await authStore.createCouple();
    await router.push('/today');
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Paarraum konnte nicht erstellt werden';
  }
}

async function joinCouple() {
  formError.value = '';
  try {
    await authStore.joinCouple(inviteCode.value);
    await router.push('/today');
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Paar-Code konnte nicht genutzt werden';
  }
}
</script>

<template>
  <div class="view-grid onboarding-grid">
    <section class="hero-panel">
      <p class="eyebrow">Onboarding</p>
      <h1>Willkommen in eurem Herzgarten.</h1>
      <p>Erstellt ein Konto und verbindet euch ueber einen Paar-Code.</p>
    </section>

    <section v-if="!authStore.isAuthenticated" class="panel auth-panel">
      <div class="segmented-control" aria-label="Auth Modus">
        <button :class="{ active: mode === 'register' }" type="button" @click="mode = 'register'">
          <UserPlus :size="18" aria-hidden="true" />
          Registrieren
        </button>
        <button :class="{ active: mode === 'login' }" type="button" @click="mode = 'login'">
          <LogIn :size="18" aria-hidden="true" />
          Login
        </button>
      </div>

      <form class="composer" @submit.prevent="submitAuth">
        <label v-if="mode === 'register'" for="display-name">Name</label>
        <input v-if="mode === 'register'" id="display-name" v-model="displayName" autocomplete="name" />

        <label for="email">E-Mail</label>
        <input id="email" v-model="email" autocomplete="email" type="email" />

        <label for="password">Passwort</label>
        <input id="password" v-model="password" autocomplete="current-password" type="password" />

        <p v-if="formError || authStore.error" class="form-error">{{ formError || authStore.error }}</p>

        <button class="primary-button" type="submit" :disabled="authStore.loading">
          {{ mode === 'register' ? 'Konto erstellen' : 'Einloggen' }}
        </button>
      </form>
    </section>

    <section v-else class="panel auth-panel">
      <p class="eyebrow">Paarraum</p>
      <h2>Hallo {{ authStore.user?.displayName }}</h2>
      <p v-if="authStore.couple">
        Euer Paar-Code ist <strong>{{ authStore.couple.inviteCode }}</strong>.
      </p>
      <div v-else class="couple-actions">
        <button class="primary-button" type="button" @click="createCouple">
          <Sprout :size="18" aria-hidden="true" />
          Garten anlegen
        </button>

        <form class="join-form" @submit.prevent="joinCouple">
          <label for="invite-code">Partnercode eingeben</label>
          <input id="invite-code" v-model="inviteCode" placeholder="HERZ-4821" />
          <button class="secondary-button" type="submit">Beitreten</button>
        </form>
      </div>
      <p v-if="formError" class="form-error">{{ formError }}</p>
    </section>
  </div>
</template>
