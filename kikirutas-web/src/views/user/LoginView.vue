<!-- src/views/user/LoginView.vue -->
<template>
  <section class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-lg">
      <h1 class="text-2xl font-bold text-crema">Ingresar</h1>
      <p class="text-sm text-crema/70 mt-1">
        Acceso para navegar por las vistas de KikiRutas.
      </p>

      <form class="mt-6 grid gap-4" @submit.prevent="onSubmit">
        <!-- Correo -->
        <label class="grid gap-1">
          <span class="text-sm text-crema/80">Correo</span>
          <input
            v-model.trim="email"
            class="rounded-md bg-black/30 border px-3 py-2 text-crema outline-none focus:border-maiz"
            :class="emailErr ? 'border-rose-400' : 'border-brand/40'"
            type="email"
            autocomplete="email"
            @blur="touched.email = true"
            required
          />
          <small v-if="emailErr" class="text-rose-300">{{ emailErr }}</small>
        </label>

        <!-- Password -->
        <label class="grid gap-1">
          <span class="text-sm text-crema/80">Contraseña</span>
          <input
            v-model="password"
            class="rounded-md bg-black/30 border px-3 py-2 text-crema outline-none focus:border-maiz"
            :class="passwordErr ? 'border-rose-400' : 'border-brand/40'"
            type="password"
            autocomplete="current-password"
            @blur="touched.password = true"
            required
          />
          <small v-if="passwordErr" class="text-rose-300">{{ passwordErr }}</small>
        </label>

        <!-- Botón único -->
        <button
          type="submit"
          class="rounded bg-blue-600 text-sm px-5 py-2 w-fit self-start disabled:opacity-50"
          :disabled="loading || hasErrors"
        >
          {{ loading ? 'Entrando…' : 'Entrar' }}
        </button>

        <!-- Errores del backend / validación -->
        <p v-if="serverErr" class="text-rose-300 text-sm mt-2">{{ serverErr }}</p>
        <ul v-if="Object.keys(fieldErrs).length" class="text-rose-300 text-xs space-y-1">
          <li v-for="(arr, k) in fieldErrs" :key="k">{{ k }}: {{ arr[0] }}</li>
        </ul>

        <p class="text-sm text-crema/70 mt-2">
          ¿No tienes cuenta?
          <RouterLink :to="{ name: 'register' }" class="text-maiz underline">Crear cuenta</RouterLink>
        </p>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, type ExplicitRole } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

// Puedes dejarlos en blanco; los relleno para pruebas.
const email = ref('')
const password = ref('')

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
  if (role === 'admin')    return { name: 'a.resumen' }
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
    const res = await auth.login({ email: email.value, password: password.value })

    if (!res.ok) {
      serverErr.value = String(res.error || 'Credenciales inválidas')
      fieldErrs.value = (res as any).fieldErrors ?? {}
      return
    }

    // auth.role ya quedó seteado por el store
    const safeRole = (auth.role || 'user') as ExplicitRole
    router.push(destFor(safeRole)).catch(() => {})
  } catch (e: any) {
    serverErr.value = e?.message || 'No se pudo iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>
