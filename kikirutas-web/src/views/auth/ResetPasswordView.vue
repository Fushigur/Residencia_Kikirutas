<template>
  <section class="min-h-screen grid place-items-center px-4">
    <form class="w-full max-w-md space-y-4 bg-white/5 p-6 rounded-xl border border-white/10"
          @submit.prevent="onSubmit">
      <h1 class="text-xl font-semibold text-crema">Restablecer contraseña</h1>
      <p class="text-sm text-crema/70">Correo: <b>{{ email }}</b></p>

      <label class="grid gap-1">
        <span class="text-sm text-crema/80">Nueva contraseña</span>
        <input v-model="password" type="password" required
               class="rounded-md bg-black/30 border border-white/20 px-3 py-2 text-crema outline-none">
      </label>

      <label class="grid gap-1">
        <span class="text-sm text-crema/80">Confirmar contraseña</span>
        <input v-model="confirm" type="password" required
               class="rounded-md bg-black/30 border border-white/20 px-3 py-2 text-crema outline-none">
      </label>

      <button :disabled="loading" class="rounded bg-maiz px-3 py-2 disabled:opacity-50">
        {{ loading ? 'Guardando…' : 'Restablecer' }}
      </button>

      <p v-if="msg" class="text-sm text-emerald-300">{{ msg }}</p>
      <p v-if="err" class="text-sm text-rose-300">{{ err }}</p>

      <RouterLink :to="{ name: 'login' }" class="text-sm text-maiz underline">Volver a ingresar</RouterLink>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'

const route = useRoute()
const router = useRouter()

const token = computed(() => String(route.query.token || ''))
const email = computed(() => String(route.query.email || ''))

const password = ref('')
const confirm = ref('')
const loading = ref(false)
const msg = ref('')
const err = ref('')

async function onSubmit() {
  err.value=''; msg.value=''
  if (password.value !== confirm.value) {
    err.value = 'Las contraseñas no coinciden'
    return
  }
  loading.value = true
  try {
    await api.post('/auth/reset-password', {
      email: email.value,
      token: token.value,
      password: password.value,
      password_confirmation: confirm.value,
    })
    msg.value = 'Contraseña actualizada. Ahora puedes ingresar.'
    setTimeout(() => router.push({ name: 'login' }), 800)
  } catch (e: any) {
    err.value = e?.response?.data?.message || e?.message || 'No se pudo restablecer'
  } finally {
    loading.value = false
  }
}
</script>
