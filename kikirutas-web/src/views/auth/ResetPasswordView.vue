<template>
  <section class="min-h-screen grid place-items-center p-4 relative overflow-hidden bg-[#121212]">
    <div class="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-700/20 to-transparent blur-3xl pointer-events-none"></div>
    <div class="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-amber-900/20 to-transparent blur-3xl pointer-events-none"></div>

    <div class="w-full max-w-md bg-[#1E1E1E]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl relative z-10">
      
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 mb-6 shadow-lg shadow-amber-900/30 transform rotate-12">
          <svg class="w-10 h-10 text-white transform -rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-white mb-3 tracking-tight">Restablecer Contraseña</h1>
        <p class="text-white/60 text-base">Crea una nueva contraseña para tu cuenta.</p>

        <div class="mt-6 inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10">
          <div class="p-1.5 bg-white/10 rounded-full">
            <svg class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <span class="text-sm font-medium text-white/90">{{ email }}</span>
        </div>
      </div>

      <form class="space-y-8" @submit.prevent="onSubmit">

        <div class="space-y-3">
          <label class="block text-xs font-semibold text-white/60 uppercase tracking-wider ml-1">Nueva contraseña</label>
          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-white/30 group-focus-within:text-amber-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input 
              v-model="password" 
              type="password" 
              required
              class="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-white/20 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
              placeholder="Ingresa tu nueva contraseña"
            >
          </div>
        </div>

        <div class="space-y-3">
          <label class="block text-xs font-semibold text-white/60 uppercase tracking-wider ml-1">Confirmar contraseña</label>
          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-white/30 group-focus-within:text-amber-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <input 
              v-model="confirm" 
              type="password" 
              required
              class="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-white/20 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
              placeholder="Repite la contraseña"
            >
          </div>
        </div>

        <button 
          :disabled="loading" 
          class="w-full py-4 px-6 bg-gradient-to-r from-amber-400 to-orange-600 hover:from-amber-500 hover:to-orange-700 text-white font-bold rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-amber-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
        >
          <svg v-if="!loading" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          <svg v-else class="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          {{ loading ? 'Restableciendo...' : 'Restablecer Contraseña' }}
        </button>

        <transition enter-active-class="animate-fade-in-down">
          <div v-if="msg" class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <svg class="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p class="text-sm text-emerald-200 font-medium">{{ msg }}</p>
          </div>
        </transition>

        <transition enter-active-class="animate-fade-in-down">
          <div v-if="err" class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
            <svg class="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p class="text-sm text-rose-200 font-medium">{{ err }}</p>
          </div>
        </transition>

        <div class="text-center pt-4 border-t border-white/5">
          <RouterLink :to="{ name: 'login' }" class="inline-flex items-center gap-2 text-white/50 hover:text-amber-400 transition-colors font-medium">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Volver al inicio de sesión
          </RouterLink>
        </div>

      </form>
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
const loading = ref(false)
const msg = ref('')
const err = ref('')

async function onSubmit() {
  err.value=''; msg.value=''
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