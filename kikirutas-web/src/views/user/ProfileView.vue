<template>
  <div class="max-w-xl">
    <h2 class="text-xl font-semibold mb-4">Perfil</h2>
    <div class="rounded-xl border border-white/10 bg-white/5 p-4">
      <p class="text-sm text-gray-300">Nombre: <span class="text-gray-100 font-medium">{{ name }}</span></p>
      <p class="text-sm text-gray-300">Rol: <span class="text-gray-100 font-medium">{{ role }}</span></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const { role, displayName } = storeToRefs(auth)

// alias “name” y maneja null
const name = computed(() => displayName.value ?? '—')
</script>

