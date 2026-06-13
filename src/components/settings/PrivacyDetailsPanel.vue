<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <section class="panel privacy-details" data-testid="privacy-details">
    <div>
      <p class="eyebrow">{{ t('settings.privacyTitle') }}</p>
      <p>{{ t('settings.privacyIntro') }}</p>
    </div>
    <div class="privacy-grid">
      <article>
        <h2>{{ t('settings.privacyPrivateTitle') }}</h2>
        <p>{{ t('settings.privacyPrivateText') }}</p>
      </article>
      <article>
        <h2>{{ t('settings.privacyPartnerTitle') }}</h2>
        <p>{{ t('settings.privacyPartnerText') }}</p>
      </article>
      <article>
        <h2>{{ t('settings.privacyLeaveTitle') }}</h2>
        <p>{{ t('settings.privacyLeaveText') }}</p>
      </article>
      <article>
        <h2>{{ t('settings.privacyDeleteTitle') }}</h2>
        <p>{{ t('settings.privacyDeleteText') }}</p>
      </article>
    </div>
  </section>
</template>
