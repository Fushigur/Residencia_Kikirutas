<!-- src/views/user/RegisterView.vue -->
<template>
  <section class="min-h-screen grid place-items-center px-4">
    <div class="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <h2 class="text-2xl font-bold mb-1">Crear cuenta</h2>
      <p class="text-sm text-gray-400 mb-6">Crea tu cuenta con nosotros y unete a ese lindo proyecto, Kikibá</p>

      <!-- Mensaje de error general -->
      <p v-if="formError" class="mb-3 text-sm text-rose-400">{{ formError }}</p>

      <form class="space-y-5" @submit.prevent="onSubmit">
        <!-- Nombres y Apellidos -->
        <div class="grid md:grid-cols-2 gap-4">
          <div class="grid gap-2">
            <label class="text-sm text-gray-300">Nombres</label>
            <input
              v-model.trim="nombres"
              type="text"
              :class="inputClass(!!nombres && nombres.trim().length === 0 || !!serverErrs.nombres)"
              class="base-input"
              autocomplete="given-name"
            />
            <p v-if="serverErrs.nombres" class="hint-err">{{ serverErrs.nombres }}</p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm text-gray-300">Apellidos</label>
            <input
              v-model.trim="apellidos"
              type="text"
              :class="inputClass(!!apellidos && apellidos.trim().length === 0 || !!serverErrs.apellidos)"
              class="base-input"
              autocomplete="family-name"
            />
            <p v-if="serverErrs.apellidos" class="hint-err">{{ serverErrs.apellidos }}</p>
          </div>
        </div>

        <!-- Municipio y Comunidad -->
        <div class="grid md:grid-cols-2 gap-4">
          <div class="grid gap-2">
            <label class="text-sm text-gray-300">Municipio</label>
            <select v-model="municipio" class="base-input">
              <option value="" disabled>Selecciona un municipio</option>
              <option v-for="mun in municipios" :key="mun" :value="mun">{{ mun }}</option>
            </select>
            <p v-if="serverErrs.municipio" class="hint-err">{{ serverErrs.municipio }}</p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm text-gray-300">Comunidad</label>
            <select v-model="comunidad" class="base-input">
              <option value="" disabled>Selecciona una comunidad</option>
              <option v-for="com in comunidadesFiltradas" :key="com" :value="com">{{ com }}</option>
            </select>
            <p v-if="serverErrs.comunidad" class="hint-err">{{ serverErrs.comunidad }}</p>
          </div>
        </div>

        <!-- Teléfono y Correo -->
        <div class="grid md:grid-cols-2 gap-4">
          <div class="grid gap-2">
            <label class="text-sm text-gray-300">Número de teléfono</label>
            <input
              v-model.trim="telefono"
              type="tel"
              inputmode="numeric"
              maxlength="10"
              :class="inputClass(!!telefono && !telefonoValido || !!serverErrs.telefono)"
              class="base-input"
              placeholder="10 dígitos"
              autocomplete="tel"
            />
            <p v-if="!!telefono && !telefonoValido" class="hint-err">Debe tener 10 dígitos.</p>
            <p v-if="serverErrs.telefono" class="hint-err">{{ serverErrs.telefono }}</p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm text-gray-300">Correo</label>
            <input
              v-model.trim="email"
              type="email"
              :class="inputClass(!!email && !emailValido || !!serverErrs.email)"
              class="base-input"
              placeholder="ejemplo@correo.com"
              autocomplete="email"
            />
            <p v-if="!!email && !emailValido" class="hint-err">Ingresa un correo válido.</p>
            <p v-if="serverErrs.email" class="hint-err">{{ serverErrs.email }}</p>
          </div>
        </div>

        <!-- Sexo y Edad -->
        <div class="grid md:grid-cols-2 gap-4">
          <div class="grid gap-2">
            <label class="text-sm text-gray-300">Sexo</label>
            <select v-model="sexo" class="base-input">
              <option value="" disabled>Selecciona sexo</option>
              <option v-for="s in sexos" :key="s" :value="s">{{ s }}</option>
            </select>
            <p v-if="serverErrs.sexo" class="hint-err">{{ serverErrs.sexo }}</p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm text-gray-300">Edad</label>
            <input
              v-model.number="edad"
              type="number"
              min="1" max="120"
              :class="inputClass(!!edad && !edadValida || !!serverErrs.edad)"
              class="base-input"
            />
            <p v-if="!!edad && !edadValida" class="hint-err">La edad debe estar entre 1 y 120 años.</p>
            <p v-if="serverErrs.edad" class="hint-err">{{ serverErrs.edad }}</p>
          </div>
        </div>

        <!-- Contraseñas -->
        <div class="grid md:grid-cols-2 gap-4">
          <div class="grid gap-2">
            <label class="text-sm text-gray-300">Contraseña</label>
            <input
              v-model="password"
              type="password"
              :class="inputClass(!!password && !passwordFuerte || !!serverErrs.password)"
              class="base-input"
              autocomplete="new-password"
            />
            <p v-if="!!password && !passwordFuerte" class="hint-err">
              Mínimo 8 caracteres, con una mayúscula y un número.
            </p>
            <p v-if="serverErrs.password" class="hint-err">{{ serverErrs.password }}</p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm text-gray-300">Confirmar contraseña</label>
            <input
              v-model="confirm"
              type="password"
              :class="inputClass(!!confirm && !passwordsMatch || !!serverErrs.confirm)"
              class="base-input"
              autocomplete="new-password"
            />
            <p v-if="!!confirm && !passwordsMatch" class="hint-err">Las contraseñas no coinciden.</p>
            <p v-if="serverErrs.confirm" class="hint-err">{{ serverErrs.confirm }}</p>
          </div>
        </div>

        <!-- Rol -->
        <div class="grid gap-2">
          <label class="text-sm text-gray-300">Rol</label>
          <select v-model="role" class="base-input">
            <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Términos -->
        <div class="flex items-start gap-2">
          <input id="terms" type="checkbox" v-model="accept" class="mt-1" />
          <label for="terms" class="text-sm text-gray-300">Acepto los términos y condiciones.</label>
        </div>

        <!-- Botones -->
        <div class="flex gap-3 pt-1">
          <button
            type="submit"
            class="rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!isValid || auth.loading"
          >
            {{ auth.loading ? 'Registrando…' : 'Registrarme' }}
          </button>

          <RouterLink :to="{ name: 'login' }" class="rounded bg-slate-700 px-4 py-2 hover:bg-slate-600">
            Ya tengo cuenta
          </RouterLink>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

type ExplicitRole = 'user' | 'operator'

/* ---------- State ---------- */
const nombres    = ref<string>('')
const apellidos  = ref<string>('')

const municipio  = ref<string>('')
const comunidad  = ref<string>('')

const telefono   = ref<string>('')
const email      = ref<string>('')

const sexo       = ref<string>('')
const edad       = ref<number | null>(null)

const password   = ref<string>('')
const confirm    = ref<string>('')

const accept     = ref<boolean>(false)
const role       = ref<ExplicitRole>('user')

/* ---------- Catálogos simples (por ahora hardcode) ---------- */
const municipios = ref<string[]>(['José María Morelos', 'Felipe Carrillo Puerto'])
const comunidades = ref<Record<string, string[]>>({
  'José María Morelos': [
    'José María Morelos',
    'Candelaria', 'Dziuché', 'La Presumida', 'Santa Gertrudis', 'Kancabchén',
    'Cafetalito', 'Cafetal Grande', 'Benito Juárez', 'Pozo Pirata', 'San Carlos',
    'Chunhuhub', 'Polyuc', 'Dos Aguadas', 'El Naranjal', 'Othón P. Blanco', 'Puerto Arturo'
  ],
  'Felipe Carrillo Puerto': ['Felipe Carrillo Puerto', 'Dzula', 'X-Yatil', 'El Señor', 'Tihosuco']
})
const sexos = ref<string[]>(['Femenino', 'Masculino'])
const roleOptions = [
  { label: 'Usuaria',  value: 'user' as ExplicitRole },
  { label: 'Operador', value: 'operator' as ExplicitRole },
]

/* ---------- Derivados ---------- */
const comunidadesFiltradas = computed(() => comunidades.value[municipio.value] ?? [])
watch(municipio, () => { comunidad.value = '' })

/* ---------- Validaciones ---------- */
const telefonoValido   = computed(() => /^\d{10}$/.test(telefono.value))
const emailValido      = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))
const passwordFuerte   = computed(() => /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password.value))
const passwordsMatch   = computed(() => password.value === confirm.value)
const edadValida       = computed(() => !!edad.value && edad.value >= 1 && edad.value <= 120)

const isValid = computed(() =>
  nombres.value.trim().length > 0 &&
  apellidos.value.trim().length > 0 &&
  municipio.value.length > 0 &&
  comunidad.value.length > 0 &&
  telefonoValido.value &&
  emailValido.value &&
  sexo.value.length > 0 &&
  edadValida.value &&
  passwordFuerte.value &&
  passwordsMatch.value &&
  accept.value
)

/* ---------- UI helpers ---------- */
const inputClass = (invalid: boolean) =>
  `rounded bg-neutral-900 border px-3 py-2 outline-none ${
    invalid ? 'border-rose-500/70 focus:border-rose-400'
            : 'border-white/10 focus:border-emerald-500'
  }`

/* ---------- Errores del servidor ---------- */
const serverErrs = ref<Record<string, string>>({})
const formError  = ref<string>('')

/* Traducción rápida de mensajes típicos de Laravel al español */
function toSpanish(msg: string): string {
  const m = (msg || '').toLowerCase()
  if (m.includes('the name field is required'))   return 'Debes escribir tu nombre.'
  if (m.includes('email has already been taken')) return 'El correo ya está registrado'
  if (m.includes('already been taken'))           return 'Este dato ya está registrado'
  if (m.includes('password confirmation'))        return 'Las contraseñas no coinciden'
  if (m.includes('the password field is required')) return 'Debes escribir tu contraseña.'
  if (m.includes('must be at least') && m.includes('characters'))
    return 'La contraseña debe tener al menos 8 caracteres'
  if (m.includes('invalid') && m.includes('email')) return 'Correo inválido'
  return msg
}

function takeFirstErrors(errors: any): Record<string, string> {
  const out: Record<string, string> = {}
  if (!errors || typeof errors !== 'object') return out
  for (const [k, v] of Object.entries(errors)) {
    const first = Array.isArray(v) ? String(v[0]) : String(v)
    out[k] = toSpanish(first)
  }
  // Normalizaciones comunes de Laravel
  if (!out.email && (errors as any)?.correo) out.email = toSpanish((errors as any).correo?.[0] ?? (errors as any).correo)
  if (!out.confirm && (errors as any)?.password_confirmation)
    out.confirm = toSpanish((errors as any).password_confirmation?.[0] ?? (errors as any).password_confirmation)
  return out
}

/* ---------- Submit ---------- */
const auth = useAuthStore()
const router = useRouter()

// Limpia mensaje general cuando el usuario edita campos críticos
watch([email, telefono, password, confirm], () => { formError.value = '' })

async function onSubmit() {
  serverErrs.value = {}
  formError.value = ''

  if (!isValid.value) {
    formError.value = 'Revisa los campos marcados en rojo.'
    return
  }

  // 1=admin, 2=operator, 3=user (solo usamos 2/3 aquí)
  const roleId = role.value === 'operator' ? 2 : 3

  const res = await auth.register({
    nombres:   nombres.value,
    apellidos: apellidos.value,
    municipio: municipio.value,
    comunidad: comunidad.value,
    telefono:  telefono.value,
    email:     email.value,
    sexo:      sexo.value,
    edad:      Number(edad.value || 0),
    password:  password.value,
    confirm:   confirm.value,
    role:      role.value,   // 'user' | 'operator'
    role_id:   roleId,       // el que espera el back
  } as any)

  if ((res as any).ok) {
    // Usa el rol que normalizó el store si el back devolvió usuario con rol
    const r = (auth.role || role.value) as ExplicitRole
    router.push(r === 'operator' ? { name: 'op.hoy' } : { name: 'u.inicio' }).catch(() => {})
  } else {
    serverErrs.value = takeFirstErrors((res as any).fieldErrors)
    formError.value  = toSpanish(String((res as any).error || 'No se pudo registrar'))
  }
}
</script>



<style scoped>
.base-input { @apply bg-neutral-900 border border-white/10 px-3 py-2 rounded outline-none; }
.hint-err   { @apply text-xs text-rose-400; }
</style>
