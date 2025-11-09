<template>
  <div class="min-h-screen bg-kikiba">
    <AppHeader v-if="!hideGlobalHeader" />
    <main class="max-w-6xl mx-auto px-4 py-10">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';

const route = useRoute();
// Si alguna ruta indica noGlobalHeader (paneles), ocultamos el header global
const hideGlobalHeader = computed(() =>
  route.matched.some(r => r.meta?.noGlobalHeader)
);
</script>
