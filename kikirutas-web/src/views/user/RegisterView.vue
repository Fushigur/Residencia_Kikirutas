<template>
  <section class="min-h-screen py-6 px-4 bg-gray-50 flex items-center justify-center">
    <!-- Contenedor más ancho para acomodar 2 columnas -->
    <div class="w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative">

      <!-- Decoración de fondo sutil -->
      <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand to-red-600"></div>

      <div class="p-6 lg:p-8">

        <!-- Header Compacto -->
        <div
          class="flex flex-col md:flex-row items-center md:items-start justify-between mb-6 gap-4 border-b border-gray-100 pb-4">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-brand/5 rounded-xl">
              <img src="@/assets/img/Logo.png" alt="KikiRutas" class="h-8 w-8 object-contain" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900 leading-tight">Crear nueva cuenta</h2>
              <p class="text-gray-500 text-xs">Únete al ecosistema <span class="text-brand font-bold">KikiRutas</span>.
              </p>
            </div>
          </div>
          <RouterLink :to="{ name: 'login' }"
            class="text-xs font-bold text-brand hover:underline bg-brand/5 px-3 py-1.5 rounded-lg border border-brand/10">
            ¿Ya tienes cuenta? Inicia sesión
          </RouterLink>
        </div>

        <!-- Mensaje Error -->
        <div v-if="formError"
          class="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-medium flex gap-2 items-center animate-pulse">
          <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd" />
          </svg>
          <div>{{ formError }}</div>
        </div>

        <form @submit.prevent="onSubmit">

          <div class="grid lg:grid-cols-2 gap-8">

            <!-- COLUMNA IZQUIERDA: Personales y Ubicación -->
            <div class="space-y-5">

              <!-- Datos Personales -->
              <section>
                <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-brand/40"></span> Datos Personales
                </h3>
                <div class="grid grid-cols-2 gap-3">
                  <div class="group">
                    <label class="block text-[10px] font-bold text-gray-600 uppercase mb-1 ml-1">Nombres</label>
                    <input v-model.trim="nombres" type="text" :class="inputClass(!nombres && tried)" class="form-input"
                      placeholder="Ej. Juan" autocomplete="given-name" />
                    <FormError :msg="serverErrs.nombres" />
                  </div>
                  <div class="group">
                    <label class="block text-[10px] font-bold text-gray-600 uppercase mb-1 ml-1">Apellidos</label>
                    <input v-model.trim="apellidos" type="text" :class="inputClass(!apellidos && tried)"
                      class="form-input" placeholder="Ej. Pérez" autocomplete="family-name" />
                    <FormError :msg="serverErrs.apellidos" />
                  </div>

                  <div class="group">
                    <label class="block text-[10px] font-bold text-gray-600 uppercase mb-1 ml-1">Sexo</label>
                    <select v-model="sexo" class="form-select">
                      <option value="" disabled>Selecciona...</option>
                      <option v-for="s in sexos" :key="s" :value="s">{{ s }}</option>
                    </select>
                  </div>
                  <div class="group">
                    <label class="block text-[10px] font-bold text-gray-600 uppercase mb-1 ml-1">Edad</label>
                    <input v-model.number="edad" type="number" min="18" max="100" class="form-input"
                      placeholder="Años" />
                  </div>
                </div>
              </section>

              <!-- Ubicación -->
              <section>
                <h3
                  class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2 pt-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-400/40"></span> Ubicación
                </h3>
                <div class="grid grid-cols-2 gap-3">
                  <div class="group">
                    <label class="block text-[10px] font-bold text-gray-600 uppercase mb-1 ml-1">Municipio</label>
                    <select v-model="municipio" class="form-select">
                      <option value="" disabled>Selecciona...</option>
                      <option v-for="mun in municipios" :key="mun" :value="mun">{{ mun }}</option>
                    </select>
                    <FormError :msg="serverErrs.municipio" />
                  </div>
                  <div class="group">
                    <label class="block text-[10px] font-bold text-gray-600 uppercase mb-1 ml-1">Comunidad</label>
                    <select v-model="comunidad" :disabled="!municipio"
                      class="form-select disabled:bg-gray-100 disabled:opacity-60">
                      <option value="" disabled>Selecciona...</option>
                      <option v-for="com in comunidadesFiltradas" :key="com" :value="com">{{ com }}</option>
                    </select>
                    <FormError :msg="serverErrs.comunidad" />
                  </div>
                </div>
              </section>

            </div>

            <!-- COLUMNA DERECHA: Contacto, Seguridad y Rol -->
            <div class="space-y-5">

              <!-- Contacto -->
              <section>
                <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400/40"></span> Contacto
                </h3>
                <div class="grid grid-cols-2 gap-3">
                  <div class="group">
                    <label class="block text-[10px] font-bold text-gray-600 uppercase mb-1 ml-1">Teléfono</label>
                    <input v-model.trim="telefono" type="tel" maxlength="10" class="form-input font-mono text-sm"
                      placeholder="10 dígitos" />
                    <FormError :msg="serverErrs.telefono" />
                  </div>
                  <div class="group">
                    <label class="block text-[10px] font-bold text-gray-600 uppercase mb-1 ml-1">Correo</label>
                    <input v-model.trim="email" type="email" class="form-input text-sm"
                      placeholder="correo@ejemplo.com" />
                    <FormError :msg="serverErrs.email" />
                  </div>
                </div>
              </section>

              <!-- Seguridad -->
              <section>
                <div class="grid grid-cols-2 gap-3">
                  <div class="group">
                    <label class="block text-[10px] font-bold text-gray-600 uppercase mb-1 ml-1">Contraseña</label>
                    <div class="relative">
                      <input v-model="password" :type="showPassword ? 'text' : 'password'" class="form-input pr-10"
                        placeholder="••••••••" />
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
                  <div class="group">
                    <label class="block text-[10px] font-bold text-gray-600 uppercase mb-1 ml-1">Confirmar</label>
                    <div class="relative">
                      <input v-model="confirm" :type="showConfirm ? 'text' : 'password'" class="form-input pr-10"
                        placeholder="••••••••" />
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
                </div>
                <!-- Mini helper de contraseña -->
                <p v-if="!!password && !passwordFuerte"
                  class="text-[10px] text-orange-500 mt-1.5 ml-1 font-medium flex items-center gap-1 bg-orange-50 p-1 rounded border border-orange-100 inline-block">
                  <span class="font-bold">Nota:</span> Mín. 8 caracteres, 1 mayúscula, 1 número.
                </p>
              </section>

              <!-- Rol y Submit -->
              <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div class="flex items-center gap-4 mb-4">
                  <span class="text-[10px] font-bold text-gray-500 uppercase">Rol:</span>
                  <div class="flex gap-2 flex-1">
                    <label v-for="opt in roleOptions" :key="opt.value" class="cursor-pointer relative flex-1">
                      <input type="radio" v-model="role" :value="opt.value" class="peer sr-only">
                      <div class="text-xs font-bold py-1.5 px-3 rounded-lg text-center border transition-all 
                          peer-checked:bg-white peer-checked:border-brand peer-checked:text-brand peer-checked:shadow-sm
                          bg-gray-200/50 border-transparent text-gray-500 hover:bg-gray-200">
                        {{ opt.label }}
                      </div>
                    </label>
                  </div>
                </div>

                <div class="flex items-center gap-2 mb-4">
                  <input id="terms" type="checkbox" v-model="accept"
                    class="w-4 h-4 text-brand rounded focus:ring-brand border-gray-300 cursor-pointer" />
                  <label for="terms" class="text-xs text-gray-500 cursor-pointer select-none">Acepto los <a href="#"
                      class="text-brand font-bold hover:underline">términos</a>.</label>
                </div>

                <button type="submit" :disabled="loading"
                  class="w-full py-3 px-4 rounded-xl bg-brand text-white font-bold text-sm shadow-md shadow-brand/20 hover:bg-red-800 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                  {{ loading ? 'Creando...' : 'Completar registro' }}
                </button>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch, defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getErrorMessage, getFieldErrors } from '@/api'

// Componente local simple para errores
const FormError = defineComponent({
  props: ['msg'],
  template: `<p v-if="msg" class="text-red-500 text-[10px] mt-1 ml-1 font-bold">{{ msg }}</p>`
})

type ExplicitRole = 'user' | 'operator'

/* State */
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
const showPassword = ref(false)
const showConfirm = ref(false)
const accept = ref(false)
const role = ref<ExplicitRole>('user')
const loading = ref(false)
const tried = ref(false)

/* Data */
const municipios = ['José María Morelos', 'Felipe Carrillo Puerto']
const comunidades: Record<string, string[]> = {
  'José María Morelos': ['José María Morelos', 'Candelaria', 'Dziuché', 'La Presumida', 'Santa Gertrudis', 'Kancabchén', 'Cafetalito', 'San Carlos', 'Chunhuhub', 'Polyuc', 'Puerto Arturo'],
  'Felipe Carrillo Puerto': ['Felipe Carrillo Puerto', 'Dzula', 'X-Yatil', 'El Señor', 'Tihosuco']
}
const sexos = ['Femenino', 'Masculino']
const roleOptions = [{ label: 'Usuaria', value: 'user' }, { label: 'Operador', value: 'operator' }]

const comunidadesFiltradas = computed(() => comunidades[municipio.value] ?? [])
watch(municipio, () => { comunidad.value = '' })

/* Validation */
const telefonoValido = computed(() => /^\d{10}$/.test(telefono.value))
const emailValido = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))
const passwordFuerte = computed(() => /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password.value))
const passwordsMatch = computed(() => password.value === confirm.value)
const edadValida = computed(() => !!edad.value && edad.value >= 18 && edad.value <= 100)

const isValid = computed(() =>
  nombres.value && apellidos.value && municipio.value && comunidad.value &&
  telefonoValido.value && emailValido.value && sexo.value && edadValida.value &&
  passwordFuerte.value && passwordsMatch.value && accept.value
)

const inputClass = (err: boolean) => err ? '!border-red-300 !bg-red-50' : ''

/* Errors */
const serverErrs = ref<Record<string, string>>({})
const formError = ref('')

/* API */
const auth = useAuthStore()
const router = useRouter()

async function onSubmit() {
  tried.value = true
  serverErrs.value = {}
  formError.value = ''

  if (!isValid.value) {
    formError.value = 'Completa los campos requeridos.'
    return
  }

  loading.value = true
  try {
    const fullName = `${nombres.value} ${apellidos.value}`.trim()
    const returnedRole = await auth.register({
      name: fullName,
      email: email.value,
      password: password.value,
      password_confirmation: confirm.value,
      role: role.value,
      telefono: telefono.value,
      sexo: sexo.value,
      edad: edad.value || undefined,
      comunidad: comunidad.value,
      municipio: municipio.value
    })
    const r = returnedRole === 'operator' ? 'operator' : 'user'
    router.push(r === 'operator' ? { name: 'op.hoy' } : { name: 'u.inicio' })
  } catch (e: any) {
    formError.value = getErrorMessage(e)
    const errs = getFieldErrors(e)
    if (errs) {
      Object.keys(errs).forEach(k => {
        const msg = Array.isArray(errs[k]) ? errs[k][0] : errs[k]
        serverErrs.value[k] = msg
      })
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-input,
.form-select {
  @apply w-full rounded-lg border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all outline-none;
}

/* Remove spinners */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type=number] {
  -moz-appearance: textfield;
}
</style>