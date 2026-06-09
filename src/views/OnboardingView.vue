<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Clipboard, KeyRound, LogIn, Sprout, UserPlus } from '@lucide/vue';
import type { ContentPreference, RelationshipType } from '@/types/domain';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const mode = ref<'login' | 'register'>('register');
const displayName = ref('');
const email = ref('');
const password = ref('');
const inviteCode = ref('');
const relationshipType = ref<RelationshipType>('mixed');
const contentPreference = ref<ContentPreference>('balanced');
const formError = ref('');
const copied = ref(false);

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
    await authStore.createCouple({
      relationshipType: relationshipType.value,
      contentPreference: contentPreference.value,
    });
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

async function copyInviteCode() {
  if (!authStore.couple?.inviteCode) return;
  await navigator.clipboard.writeText(authStore.couple.inviteCode);
  copied.value = true;
  window.setTimeout(() => {
    copied.value = false;
  }, 1500);
}
</script>

<template>
  <div class="view-grid onboarding-grid">
    <section class="hero-panel">
      <p class="eyebrow">Onboarding</p>
      <h1>Willkommen in eurem Herzgarten.</h1>
      <p v-if="!authStore.isAuthenticated">Erstellt ein Konto oder loggt euch ein. Danach koennt ihr einen vorhandenen Partnercode eingeben oder einen neuen Paarraum anlegen.</p>
      <p v-else-if="!authStore.hasCouple">Dein Konto ist bereit. Verbinde dich jetzt nachtraeglich mit dem Partnercode oder lege euren gemeinsamen Garten an.</p>
      <p v-else>Teilt euren Paar-Code, damit dein Partner jederzeit nachtraeglich beitreten kann.</p>
    </section>

    <section v-if="!authStore.isAuthenticated" class="panel auth-panel">
      <div class="segmented-control" aria-label="Auth Modus">
        <button data-testid="auth-mode-register" :class="{ active: mode === 'register' }" type="button" @click="mode = 'register'">
          <UserPlus :size="18" aria-hidden="true" />
          Registrieren
        </button>
        <button data-testid="auth-mode-login" :class="{ active: mode === 'login' }" type="button" @click="mode = 'login'">
          <LogIn :size="18" aria-hidden="true" />
          Login
        </button>
      </div>

      <form class="composer" data-testid="auth-form" @submit.prevent="submitAuth">
        <label v-if="mode === 'register'" for="display-name">Name</label>
        <input v-if="mode === 'register'" id="display-name" v-model="displayName" autocomplete="name" data-testid="auth-display-name" />

        <label for="email">E-Mail</label>
        <input id="email" v-model="email" autocomplete="email" type="email" data-testid="auth-email" />

        <label for="password">Passwort</label>
        <input id="password" v-model="password" autocomplete="current-password" type="password" data-testid="auth-password" />

        <p v-if="formError || authStore.error" class="form-error" data-testid="auth-error">{{ formError || authStore.error }}</p>

        <button class="primary-button" type="submit" :disabled="authStore.loading" data-testid="auth-submit">
          {{ mode === 'register' ? 'Konto erstellen' : 'Einloggen' }}
        </button>
      </form>
    </section>

    <section v-else class="panel auth-panel">
      <p class="eyebrow">Paarraum</p>
      <h2>Hallo {{ authStore.user?.displayName }}</h2>
      <div v-if="authStore.couple" class="couple-code" data-testid="couple-code-panel">
        <p>Euer Paar-Code ist <strong data-testid="couple-code">{{ authStore.couple.inviteCode }}</strong>. Dein Partner kann ihn auch spaeter nach dem Login eingeben.</p>
        <button class="secondary-button inline-button" type="button" data-testid="copy-couple-code" @click="copyInviteCode">
          <Clipboard :size="18" aria-hidden="true" />
          {{ copied ? 'Kopiert' : 'Code kopieren' }}
        </button>
      </div>
      <div v-else class="couple-actions">
        <div class="next-step-note">
          <KeyRound :size="20" aria-hidden="true" />
          <div>
            <strong>Partnercode nachtraeglich eingeben</strong>
            <p>Wenn dein Partner den Garten schon angelegt hat, trage hier den Code ein. Danach landet ihr beide im selben Paarraum.</p>
          </div>
        </div>

        <form class="join-form highlighted-form" data-testid="join-couple-form" @submit.prevent="joinCouple">
          <label for="invite-code">Partnercode</label>
          <input id="invite-code" v-model="inviteCode" placeholder="HERZ-4821" autocomplete="off" data-testid="invite-code-input" />
          <button class="primary-button" type="submit" :disabled="!inviteCode.trim()" data-testid="join-couple-submit">
            <KeyRound :size="18" aria-hidden="true" />
            Mit Partner verbinden
          </button>
        </form>

        <div class="section-divider"><span>oder neuen Paarraum erstellen</span></div>

        <form class="join-form" data-testid="create-couple-form" @submit.prevent="createCouple">
          <label for="relationship-type">Beziehungsmodus</label>
          <select id="relationship-type" v-model="relationshipType" data-testid="relationship-type-select">
            <option value="mixed">Gemischt</option>
            <option value="local">Zusammen vor Ort</option>
            <option value="long_distance">Fernbeziehung</option>
          </select>

          <label for="content-preference">Content-Stil</label>
          <select id="content-preference" v-model="contentPreference" data-testid="content-preference-select">
            <option value="balanced">Ausgewogen</option>
            <option value="romantic">Romantisch</option>
            <option value="playful">Verspielt</option>
            <option value="deep">Tiefgruendig</option>
          </select>

          <button class="primary-button" type="submit" data-testid="create-couple-submit">
            <Sprout :size="18" aria-hidden="true" />
            Garten anlegen
          </button>
        </form>
      </div>
      <p v-if="formError" class="form-error" data-testid="couple-error">{{ formError }}</p>
    </section>
  </div>
</template>
