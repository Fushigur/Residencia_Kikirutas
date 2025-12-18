<!-- src/views/user/LoginView.vue -->
<template>
  <section class="min-h-screen flex items-center justify-center px-4 bg-crema">
    <!-- Premium Card -->
    <div
      class="w-full max-w-lg bg-surface rounded-3xl shadow-card border border-gray-100 p-8 md:p-12 transition-all duration-500 hover:shadow-2xl">

      <div class="mb-8 text-center md:text-left">
        <h1 class="text-3xl font-bold text-gray-900 tracking-tight mb-2">Bienvenido</h1>
        <p class="text-humo text-sm font-medium">
          Ingresa tus credenciales para continuar en <span class="text-brand font-bold">KikiRutas</span>.
        </p>
      </div>

      <form class="grid gap-6" @submit.prevent="onSubmit">
        <!-- Correo -->
        <label class="grid gap-1.5">
          <span class="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Correo Electrónico</span>
          <div class="relative group">
            <input v-model.trim="email"
              class="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-3.5 text-gray-900 outline-none transition-all focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 placeholder-gray-400"
              :class="emailErr ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''" type="email"
              placeholder="nombre@ejemplo.com" autocomplete="email" @blur="touched.email = true" required />
          </div>
          <small v-if="emailErr" class="text-red-500 text-xs font-medium ml-1 transition-all">{{ emailErr }}</small>
        </label>

        <!-- Password -->
        <label class="grid gap-1.5">
          <div class="flex justify-between items-center ml-1">
            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Contraseña</span>
            <RouterLink :to="{ name: 'forgot', query: { email: email || undefined } }"
              class="text-xs font-semibold text-brand hover:text-red-900 transition-colors">
              ¿Olvidaste tu contraseña?
            </RouterLink>
          </div>
          <div class="relative">
            <input v-model="password"
              class="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-3.5 pr-10 text-gray-900 outline-none transition-all focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 placeholder-gray-400"
              :class="passwordErr ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''"
              :type="showPassword ? 'text' : 'password'" placeholder="••••••••" autocomplete="current-password"
              @blur="touched.password = true" required />
            <button type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              @click="showPassword = !showPassword" tabindex="-1">
              <svg v-if="!showPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </button>
          </div>
          <small v-if="passwordErr" class="text-red-500 text-xs font-medium ml-1 transition-all">{{ passwordErr
          }}</small>
        </label>

        <!-- Botón -->
        <button type="submit"
          class="mt-2 w-full rounded-xl bg-brand text-white font-bold text-sm px-6 py-4 shadow-lg shadow-brand/20 transition-all hover:bg-red-900 hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          :disabled="loading || hasErrors">
          <span v-if="loading" class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-5 w-5 text-white/50" xmlns="http://www.w3.org/2000/svg" fill="none"
              viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            Iniciando sesión...
          </span>
          <span v-else>Entrar a mi cuenta</span>
        </button>

        <!-- Errores del backend -->
        <div v-if="serverErr"
          class="rounded-lg bg-red-50 border border-red-100 p-3 text-red-600 text-sm flex items-center gap-2">
          <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd" />
          </svg>
          {{ serverErr }}
        </div>

        <p class="text-center text-sm text-gray-500 mt-2">
          ¿No tienes cuenta?
          <RouterLink :to="{ name: 'register' }" class="text-brand font-bold hover:underline">Registrate aquí mismo
          </RouterLink>
        </p>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, type ExplicitRole } from '@/stores/auth'
// (opcional) si quieres extraer errores 422 de Laravel:
// import { getFieldErrors } from '@/api'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)

const loading = ref(false)
const serverErr = ref('')
const fieldErrs = ref<Record<string, string[]>>({})
const touched = ref({ email: false, password: false })
const tried = ref(false)

// Validaciones front
const emailOk = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))
const passStrong = computed(() => /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password.value))

const emailErr = computed(() => {
  if (!(touched.value.email || tried.value)) return ''
  if (!email.value.trim()) return 'Escribe tu correo'
  if (!emailOk.value) return 'Formato de correo inválido'
  return ''
})
const passwordErr = computed(() => {
  if (!(touched.value.password || tried.value)) return ''
  if (!password.value.length) return 'Escribe tu contraseña'
  if (password.value.length < 8) return 'Mínimo 8 caracteres'
  if (!passStrong.value) return 'Debe tener 1 mayúscula y 1 número'
  return ''
})
const hasErrors = computed(() => !!emailErr.value || !!passwordErr.value)

// Destino por rol
function destFor(role: ExplicitRole | null) {
  if (role === 'admin') return { name: 'a.resumen' }
  if (role === 'operator') return { name: 'op.hoy' }
  return { name: 'u.inicio' }
}

async function onSubmit() {
  tried.value = true
  serverErr.value = ''
  fieldErrs.value = {}

  if (hasErrors.value) return

  loading.value = true
  try {
    // auth.login ahora devuelve el rol y lanza error si algo sale mal
    const role = await auth.login({ email: email.value, password: password.value })
    router.push(destFor(role)).catch(() => { })
  } catch (e: any) {
    serverErr.value = e?.message || 'No se pudo iniciar sesión'
    // (opcional) si importaste getFieldErrors:
    // fieldErrs.value = getFieldErrors(e)
  } finally {
    loading.value = false
  }
}
</script>
