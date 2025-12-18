<template>
  <section class="min-h-screen grid place-items-center px-4 bg-gray-50 flex items-center justify-center">
    <div class="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">

      <!-- Fondo Decorativo -->
      <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand to-red-600"></div>
      <div class="absolute -top-20 -right-20 w-48 h-48 bg-brand/5 rounded-full blur-3xl pointer-events-none"></div>

      <div class="p-8 md:p-10 relative z-10">

        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center p-3 bg-brand/5 rounded-2xl mb-4">
            <img src="@/assets/img/Logo.png" alt="KikiRutas" class="h-12 w-12 object-contain" />
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Restablecer Contraseña</h1>
          <p class="text-gray-500 text-sm">Crea una nueva contraseña para tu cuenta.</p>

          <div class="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-gray-100">
            <div class="p-1 bg-brand/10 rounded-full">
              <svg class="w-3.5 h-3.5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span class="text-xs font-bold text-gray-600 truncate max-w-[200px]">{{ email }}</span>
          </div>
        </div>

        <form class="space-y-6" @submit.prevent="onSubmit">

          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">Nueva contraseña</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400 group-focus-within:text-brand transition-colors" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input v-model="password" :type="showPassword ? 'text' : 'password'" required
                class="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-10 text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all text-sm font-medium"
                placeholder="Ingresa tu nueva contraseña">
              <button type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                @click="showPassword = !showPassword" tabindex="-1">
                <svg v-if="!showPassword" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">Confirmar
              contraseña</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400 group-focus-within:text-brand transition-colors" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <input v-model="confirm" :type="showConfirm ? 'text' : 'password'" required
                class="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-10 text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all text-sm font-medium"
                placeholder="Repite la contraseña">
              <button type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                @click="showConfirm = !showConfirm" tabindex="-1">
                <svg v-if="!showConfirm" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <button :disabled="loading"
            class="w-full py-3.5 px-6 bg-brand hover:bg-red-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand/20 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
            <span v-if="loading" class="flex items-center gap-2">
              <svg class="animate-spin h-5 w-5 text-white/50" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              Restableciendo...
            </span>
            <span v-else class="flex items-center gap-2">
              Restablecer Contraseña
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </button>

          <transition enter-active-class="transition duration-300 ease-out"
            enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-200 ease-in" leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0">
            <div v-if="msg"
              class="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 shadow-sm">
              <svg class="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-sm text-emerald-700 font-bold">{{ msg }}</p>
            </div>
          </transition>

          <transition enter-active-class="transition duration-300 ease-out"
            enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-200 ease-in" leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0">
            <div v-if="err" class="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 shadow-sm">
              <svg class="w-5 h-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-sm text-red-700 font-bold">{{ err }}</p>
            </div>
          </transition>

          <div class="text-center pt-4 border-t border-gray-100 mt-6">
            <RouterLink :to="{ name: 'login' }"
              class="inline-flex items-center gap-2 text-gray-500 hover:text-brand transition-colors font-bold text-sm group">
              <svg class="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al inicio de sesión
            </RouterLink>
          </div>

        </form>
      </div>
    </div>
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
const showPassword = ref(false)
const showConfirm = ref(false)
const loading = ref(false)
const msg = ref('')
const err = ref('')

async function onSubmit() {
  err.value = ''; msg.value = ''
  if (password.value !== confirm.value) {
    err.value = 'Las contraseñas no coinciden'
    return
  }
  if (password.value.length < 8) {
    err.value = 'La contraseña debe tener al menos 8 caracteres'
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
    msg.value = '¡Contraseña actualizada con éxito! Redirigiendo...'
    setTimeout(() => router.push({ name: 'login' }), 2500)
  } catch (e: any) {
    err.value = e?.response?.data?.message || e?.message || 'No se pudo restablecer la contraseña. Inténtalo de nuevo.'
  } finally {
    loading.value = false
  }
}
</script>