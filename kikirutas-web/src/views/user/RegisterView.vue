<!-- src/views/user/RegisterView.vue -->
<template>
  <section class="min-h-screen py-10 px-4 bg-gray-50 flex items-center justify-center">
    <div class="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10">
      
      <div class="mb-8 text-center md:text-left">
        <h2 class="text-3xl font-bold text-gray-900 mb-2">Crear cuenta</h2>
        <p class="text-gray-500 text-sm">
          Únete al ecosistema <span class="text-brand font-bold">KikiRutas</span>. Tu plataforma de gestión agrícola.
        </p>
      </div>

      <!-- Mensaje Global -->
      <div v-if="formError" class="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex gap-2 items-start">
        <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
        {{ formError }}
      </div>

      <form class="grid gap-6" @submit.prevent="onSubmit">
        <!-- Nombres y Apellidos -->
        <div class="grid md:grid-cols-2 gap-5">
          <label class="block">
            <span class="text-xs font-bold text-gray-700 uppercase tracking-wide">Nombres</span>
            <input
              v-model.trim="nombres"
              type="text"
              :class="inputClass(!nombres && tried)"
              class="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all"
              placeholder="Ej. Juan"
              autocomplete="given-name"
            />
            <p v-if="serverErrs.nombres" class="text-red-500 text-xs mt-1">{{ serverErrs.nombres }}</p>
          </label>

          <label class="block">
            <span class="text-xs font-bold text-gray-700 uppercase tracking-wide">Apellidos</span>
            <input
              v-model.trim="apellidos"
              type="text"
              :class="inputClass(!apellidos && tried)"
              class="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all"
              placeholder="Ej. Pérez"
              autocomplete="family-name"
            />
            <p v-if="serverErrs.apellidos" class="text-red-500 text-xs mt-1">{{ serverErrs.apellidos }}</p>
          </label>
        </div>

        <!-- Ubicación -->
        <div class="grid md:grid-cols-2 gap-5">
          <label class="block">
            <span class="text-xs font-bold text-gray-700 uppercase tracking-wide">Municipio</span>
            <div class="relative mt-1">
              <select v-model="municipio" class="w-full appearance-none rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all">
                <option value="" disabled>Selecciona...</option>
                <option v-for="mun in municipios" :key="mun" :value="mun">{{ mun }}</option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>
            <p v-if="serverErrs.municipio" class="text-red-500 text-xs mt-1">{{ serverErrs.municipio }}</p>
          </label>

          <label class="block">
            <span class="text-xs font-bold text-gray-700 uppercase tracking-wide">Comunidad</span>
            <div class="relative mt-1">
              <select v-model="comunidad" :disabled="!municipio" class="w-full appearance-none rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all disabled:opacity-50">
                <option value="" disabled>Selecciona...</option>
                <option v-for="com in comunidadesFiltradas" :key="com" :value="com">{{ com }}</option>
              </select>
               <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>
             <p v-if="serverErrs.comunidad" class="text-red-500 text-xs mt-1">{{ serverErrs.comunidad }}</p>
          </label>
        </div>

        <!-- Contacto -->
        <div class="grid md:grid-cols-2 gap-5">
           <label class="block">
            <span class="text-xs font-bold text-gray-700 uppercase tracking-wide">Teléfono</span>
            <input
              v-model.trim="telefono"
              type="tel"
              maxlength="10"
              class="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all"
              placeholder="10 dígitos"
            />
             <p v-if="serverErrs.telefono" class="text-red-500 text-xs mt-1">{{ serverErrs.telefono }}</p>
          </label>

           <label class="block">
            <span class="text-xs font-bold text-gray-700 uppercase tracking-wide">Correo</span>
            <input
              v-model.trim="email"
              type="email"
              class="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all"
              placeholder="ejemplo@kikirutas.com"
            />
             <p v-if="serverErrs.email" class="text-red-500 text-xs mt-1">{{ serverErrs.email }}</p>
          </label>
        </div>

        <!-- Detalles personales -->
        <div class="grid md:grid-cols-2 gap-5">
           <label class="block">
            <span class="text-xs font-bold text-gray-700 uppercase tracking-wide">Sexo</span>
             <div class="relative mt-1">
              <select v-model="sexo" class="w-full appearance-none rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all">
                <option value="" disabled>Selecciona...</option>
                <option v-for="s in sexos" :key="s" :value="s">{{ s }}</option>
              </select>
               <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </div>
             </div>
          </label>

          <label class="block">
            <span class="text-xs font-bold text-gray-700 uppercase tracking-wide">Edad</span>
            <input
              v-model.number="edad"
              type="number"
              min="18" max="100"
              class="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all"
              placeholder="Años"
            />
          </label>
        </div>

        <!-- Seguridad -->
         <div class="grid md:grid-cols-2 gap-5">
           <label class="block">
            <span class="text-xs font-bold text-gray-700 uppercase tracking-wide">Contraseña</span>
            <input
              v-model="password"
              type="password"
              class="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all"
              placeholder="••••••••"
            />
             <p v-if="!!password && !passwordFuerte" class="text-xs text-gray-500 mt-1">Mín. 8 caracteres, 1 mayúscula, 1 número.</p>
          </label>

          <label class="block">
            <span class="text-xs font-bold text-gray-700 uppercase tracking-wide">Confirmar</span>
            <input
              v-model="confirm"
              type="password"
              class="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all"
              placeholder="••••••••"
            />
          </label>
        </div>

         <div class="grid gap-2">
            <span class="text-xs font-bold text-gray-700 uppercase tracking-wide">Rol en la plataforma</span>
             <div class="flex gap-4">
               <label v-for="opt in roleOptions" :key="opt.value" 
                class="flex-1 cursor-pointer relative"
               >
                 <input type="radio" v-model="role" :value="opt.value" class="peer sr-only">
                 <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center transition-all peer-checked:border-brand peer-checked:bg-red-50 peer-checked:text-brand font-medium hover:bg-gray-100">
                    {{ opt.label }}
                 </div>
               </label>
             </div>
         </div>

        <!-- Submit -->
        <div class="flex items-center gap-2 mt-4">
           <input id="terms" type="checkbox" v-model="accept" class="w-5 h-5 text-brand rounded focus:ring-brand border-gray-300" />
           <label for="terms" class="text-sm text-gray-600">Acepto los <a href="#" class="text-brand hover:underline">términos y condiciones</a>.</label>
        </div>

        <div class="flex flex-col-reverse md:flex-row gap-4 pt-2">
           <RouterLink :to="{ name: 'login' }" class="flex-1 text-center py-3.5 px-6 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 hover:text-gray-900 transition-colors">
             Ya tengo cuenta
           </RouterLink>
           <button 
            type="submit" 
            :disabled="!isValid || loading"
            class="flex-[2] py-3.5 px-6 rounded-xl bg-brand text-white font-bold shadow-lg shadow-brand/20 hover:bg-red-900 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
           >
             {{ loading ? 'Creando cuenta...' : 'Completar registro' }}
           </button>
        </div>

      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getErrorMessage, getFieldErrors } from '@/api'

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
const accept = ref(false)
const role = ref<ExplicitRole>('user')
const loading = ref(false)
const tried = ref(false) // If user tried to submit

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

const inputClass = (err: boolean) => err ? 'border-red-300 ring-2 ring-red-100' : ''

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
    formError.value = 'Por favor completa todos los campos requeridos.'
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
    // Map Laravel errors
    const errs = getFieldErrors(e)
    if(errs) {
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