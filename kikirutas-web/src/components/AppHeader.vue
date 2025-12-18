<template>
  <header class="w-full border-b border-brand/40 bg-humo/70 backdrop-blur">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <img src="@/assets/img/Logo_letras.png" alt="Kikibá" class="h-9 w-auto" />
        <span class="text-crema font-semibold tracking-wide">KikiRutas — Plataforma</span>
      </div>

      <nav class="hidden sm:flex items-center gap-6 text-sm">
        <template v-if="showAuthLinks">
          <RouterLink class="hover:text-maiz transition" to="/login">Ingresar</RouterLink>
          <RouterLink class="hover:text-maiz transition" to="/registro">Crear cuenta</RouterLink>
        </template>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const auth = useAuthStore();

// Oculta links si ya hay sesión o si la ruta marca hideAuthLinks (login/registro)
const showAuthLinks = computed(() => {
  const onAuthPage = route.matched.some(r => r.meta?.hideAuthLinks);
  return !auth.isAuth && !onAuthPage;
});
</script>
