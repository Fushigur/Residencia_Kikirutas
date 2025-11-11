<template>
  <!-- ANTES: <section class="min-h-[70vh] grid place-items-center"> -->
  <section class="min-h-screen grid place-items-center px-4">
    <div class="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <h2 class="text-2xl font-bold mb-1">Crear cuenta</h2>
      <p class="text-sm text-gray-400 mb-6">Registro de prueba. Luego lo conectamos a tu API real.</p>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <!-- Nombres y Apellidos -->
        <div class="grid md:grid-cols-2 gap-4">
          <div class="grid gap-2">
            <label class="text-sm text-gray-300">Nombres</label>
            <input v-model.trim="nombres" type="text" required
                   class="rounded bg-neutral-900 border border-white/10 px-3 py-2 focus:border-cyan-500 outline-none" />
          </div>
          <div class="grid gap-2">
            <label class="text-sm text-gray-300">Apellidos</label>
            <input v-model.trim="apellidos" type="text" required
                   class="rounded bg-neutral-900 border border-white/10 px-3 py-2 focus:border-cyan-500 outline-none" />
          </div>
        </div>

        <!-- Municipio y Comunidad -->
        <div class="grid md:grid-cols-2 gap-4">
          <div class="grid gap-2">
            <label class="text-sm text-gray-300">Municipio</label>
            <select v-model="municipio" required
                    class="rounded bg-neutral-900 border border-white/10 px-3 py-2 focus:border-cyan-500 outline-none">
              <option value="" disabled selected>Selecciona un municipio</option>
              <option v-for="mun in municipios" :key="mun" :value="mun">{{ mun }}</option>
            </select>
          </div>
          <div class="grid gap-2">
            <label class="text-sm text-gray-300">Comunidad</label>
            <select v-model="comunidad" required
                    class="rounded bg-neutral-900 border border-white/10 px-3 py-2 focus:border-cyan-500 outline-none">
              <option value="" disabled selected>Selecciona una comunidad</option>
              <option v-for="com in comunidadesFiltradas" :key="com" :value="com">{{ com }}</option>
            </select>
          </div>
        </div>

        <!-- Teléfono y Correo -->
        <div class="grid md:grid-cols-2 gap-4">
          <div class="grid gap-2">
            <label class="text-sm text-gray-300">Número de teléfono</label>
            <input v-model.trim="telefono" type="tel" inputmode="numeric" maxlength="10" required
                   placeholder="10 dígitos"
                   class="rounded bg-neutral-900 border border-white/10 px-3 py-2 focus:border-cyan-500 outline-none" />
            <p v-if="telefono && !telefonoValido" class="text-xs text-red-400 -mt-1">
              El teléfono debe tener 10 dígitos.
            </p>
          </div>
          <div class="grid gap-2">
            <label class="text-sm text-gray-300">Correo</label>
            <input v-model.trim="email" type="email" required
                   class="rounded bg-neutral-900 border border-white/10 px-3 py-2 focus:border-cyan-500 outline-none" />
          </div>
        </div>

        <!-- Sexo y Edad -->
        <div class="grid md:grid-cols-2 gap-4">
          <div class="grid gap-2">
            <label class="text-sm text-gray-300">Sexo</label>
            <select v-model="sexo" required
                    class="rounded bg-neutral-900 border border-white/10 px-3 py-2 focus:border-cyan-500 outline-none">
              <option value="" disabled selected>Selecciona sexo</option>
              <option v-for="s in sexos" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div class="grid gap-2">
            <label class="text-sm text-gray-300">Edad</label>
            <input v-model.number="edad" type="number" min="1" max="120" required
                   class="rounded bg-neutral-900 border border-white/10 px-3 py-2 focus:border-cyan-500 outline-none" />
          </div>
        </div>

        <!-- Contraseñas -->
        <div class="grid md:grid-cols-2 gap-4">
          <div class="grid gap-2">
            <label class="text-sm text-gray-300">Contraseña</label>
            <input v-model="password" type="password" required minlength="8"
                   class="rounded bg-neutral-900 border border-white/10 px-3 py-2 focus:border-cyan-500 outline-none" />
            <p v-if="password && !passwordFuerte" class="text-xs text-red-400 -mt-1">
              Debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número.
            </p>
          </div>
          <div class="grid gap-2">
            <label class="text-sm text-gray-300">Confirmar contraseña</label>
            <input v-model="confirm" type="password" required minlength="8"
                   class="rounded bg-neutral-900 border border-white/10 px-3 py-2 focus:border-cyan-500 outline-none" />
            <p v-if="!passwordsMatch && password.length && confirm.length" class="text-xs text-red-400 -mt-1">
              Las contraseñas no coinciden.
            </p>
          </div>
        </div>

        <!-- Rol (solo Usuaria u Operador) -->
        <div class="grid gap-2">
          <label class="text-sm text-gray-300">Rol</label>
          <select v-model="role"
                  class="rounded bg-neutral-900 border border-white/10 px-3 py-2 focus:border-cyan-500 outline-none">
            <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Términos y condiciones -->
        <div class="flex items-start gap-2">
          <input id="terms" type="checkbox" v-model="accept" class="mt-1" />
          <label for="terms" class="text-sm text-gray-300">
            Acepto los términos y condiciones.
          </label>
        </div>

        <!-- Botones -->
        <div class="flex gap-3 pt-2">
          <button
            class="rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            :disabled="!isValid"
          >
            Registrarme
          </button>
          <RouterLink :to="{ name: 'login' }" class="rounded bg-slate-700 px-4 py-2 hover:bg-slate-600">
            Ya tengo cuenta
          </RouterLink>
        </div>

        <!-- Mensajes extra -->
        <p v-if="edad && (edad < 1 || edad > 120)" class="text-xs text-red-400">
          La edad debe estar entre 1 y 120 años.
        </p>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore, ROLE_OPTIONS, type ExplicitRole } from '@/stores/auth'

// Datos del formulario
const nombres = ref('')
const apellidos = ref('')
const municipio = ref('')
const comunidad = ref('')
const telefono = ref('')
const email = ref('')
const sexo = ref('')
const edad = ref<number | null>(null)
const password = ref('')
const confirm = ref('')
const accept = ref(false)

// Rol elegido (por defecto: 'user')
const role = ref<ExplicitRole>('user')
// SOLO mostrar Usuaria y Operador en el selector
const roleOptions = computed(() => ROLE_OPTIONS.filter(o => o.value !== 'admin'))

// Listas de opciones
const municipios = ref([
  'José María Morelos',
  'Felipe Carrillo Puerto'
])

const comunidades = ref<Record<string, string[]>>({
  'José María Morelos': [
    'José María Morelos',
    'Candelaria',
    'Dziuché',
    'La Presumida',
    'Santa Gertrudis',
    'Kancabchén',
    'Cafetalito',
    'Cafetal Grande',
    'Benito Juárez',
    'Pozo Pirata',
    'San Carlos',
    'Chunhuhub',
    'Polyuc',
    'Dos Aguadas',
    'El Naranjal',
    'Othón P. Blanco',
    'Puerto Arturo'
  ],
  'Felipe Carrillo Puerto': [
    'Felipe Carrillo Puerto',
    'Dzula',
    'X-Yatil',
    'El Señor',
    'Tihosuco'
  ]
})

const sexos = ref(['Masculino', 'Femenino'])

// Computed para filtrar comunidades según municipio seleccionado
const comunidadesFiltradas = computed(() => {
  if (!municipio.value) return []
  return comunidades.value[municipio.value] || []
})

// Resetear comunidad cuando cambia el municipio
watch(municipio, () => {
  comunidad.value = ''
})

// Validaciones
const telefonoValido = computed(() => /^\d{10}$/.test(telefono.value))
const passwordsMatch = computed(() => password.value === confirm.value)
const passwordFuerte = computed(() =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&.,:;#\-_]{8,}$/.test(password.value)
)
const edadValida = computed(() => !!edad.value && edad.value >= 1 && edad.value <= 120)

const isValid = computed(() =>
  nombres.value.trim().length > 0 &&
  apellidos.value.trim().length > 0 &&
  municipio.value.length > 0 &&
  comunidad.value.length > 0 &&
  telefonoValido.value &&
  email.value.trim().length > 0 &&
  sexo.value.length > 0 &&
  edadValida.value &&
  passwordFuerte.value &&
  passwordsMatch.value &&
  accept.value
)

// Envío del formulario
const auth = useAuthStore()
const router = useRouter()

const onSubmit = () => {
  const userData = {
    nombres: nombres.value,
    apellidos: apellidos.value,
    municipio: municipio.value,
    comunidad: comunidad.value,
    telefono: telefono.value,
    email: email.value,
    sexo: sexo.value,
    edad: edad.value,
    nombreCompleto: `${nombres.value} ${apellidos.value}`
  }

  // Registro de prueba: marcamos sesión con el rol elegido y redirigimos por rol
  auth.loginAs(role.value, userData.nombreCompleto)

  // Aquí normalmente enviarías los datos a tu API
  console.log('Datos del usuario:', { ...userData, role: role.value })

  if (role.value === 'operator') {
    router.push({ name: 'op.hoy' })
  } else {
    // 'user'
    router.push({ name: 'u.inicio' })
  }
}
</script>
