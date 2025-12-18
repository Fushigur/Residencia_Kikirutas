<template>
  <div class="max-w-5xl">
    <div class="flex items-start justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Perfil</h2>

      <div class="flex gap-3">
        <button
          v-if="!editando"
          class="rounded-xl bg-brand px-5 py-2.5 text-white font-bold hover:bg-red-800 transition-colors shadow-sm shadow-brand/20"
          @click="activarEdicion"
        >
          Editar
        </button>

        <template v-else>
          <button
            class="rounded-xl bg-brand px-5 py-2.5 text-white font-bold hover:bg-red-800 transition-colors shadow-sm shadow-brand/20 disabled:opacity-50"
            @click="guardar"
            :disabled="!valido"
          >
            Guardar
          </button>
          <button
            class="rounded-xl bg-white border border-gray-200 px-5 py-2.5 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
            @click="cancelar"
          >
            Cancelar
          </button>
        </template>
      </div>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <!-- Datos de la usuaria -->
      <section class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 class="font-bold text-gray-900 mb-6 border-b border-gray-100 pb-2">Datos de la usuaria</h3>

        <div class="flex items-center gap-5 mb-6">
          <div class="relative group">
            <img
              :src="form.avatar || placeholder"
              class="h-24 w-24 rounded-full object-cover border-4 border-gray-50 bg-gray-100 shadow-sm"
              alt="Avatar"
            />
            <label
              v-if="editando"
              class="absolute bottom-0 right-0 bg-white p-1.5 rounded-full border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition-all"
              title="Cambiar foto"
            >
              <svg class="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input type="file" class="hidden" accept="image/*" @change="onAvatarChange" />
            </label>
          </div>

          <div class="text-sm">
             <p class="font-bold text-gray-900 text-lg">{{ form.nombre || 'Sin nombre' }}</p>
             <p class="text-gray-500 font-medium">Rol: {{ role || 'Usuario' }}</p>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nombre</label>
            
            <input
              v-model="form.nombre"
              :disabled="!editando"
              type="text"
              class="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-gray-900 focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Teléfono (WhatsApp)</label>
            <input
              v-model="form.telefono"
              :disabled="!editando"
              type="tel"
              inputmode="numeric"
              class="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-gray-900 focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all outline-none"
              placeholder="10 dígitos"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Correo</label>
            <input
              v-model="form.email"
              :disabled="!editando"
              type="email"
              class="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-gray-900 focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all outline-none"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div class="flex flex-wrap gap-3 pt-4 border-t border-gray-100 mt-4">
            <RouterLink :to="{ name: 'u.inventario' }" class="rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 px-4 py-2 text-sm font-bold hover:bg-emerald-100 transition-colors">
              Mi granja
            </RouterLink>
            <RouterLink :to="{ name: 'u.historial' }" class="rounded-xl bg-blue-50 text-blue-700 border border-blue-100 px-4 py-2 text-sm font-bold hover:bg-blue-100 transition-colors">
              Mis pedidos
            </RouterLink>
          </div>

          <div>
            <div class="flex justify-between items-center mb-1.5">
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide">Dirección de casa</label>
              <button v-if="editando" type="button" @click="showMap = true"
                class="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clip-rule="evenodd" />
                </svg>
                {{ form.lat ? 'PIN Seleccionado' : 'Marcar PIN exacto' }}
              </button>
            </div>
            <input
              v-model="form.direccion"
              :disabled="!editando"
              type="text"
              class="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-gray-900 focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all outline-none"
              placeholder="Calle, número, referencias..."
            />
          </div>

          <!-- Modal de Mapa -->
          <MapPicker v-if="showMap" v-model="location" @close="showMap = false" />
        </div>
      </section>

      <!-- Ubicación y Asesor -->
      <section class="space-y-6">
        <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 class="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Ubicación registrada</h3>
          <p class="text-sm text-gray-500 mb-2">
            Comunidad: <span class="text-gray-900 font-bold ml-1 text-base">{{ perfil.comunidad || '—' }}</span>
          </p>
          <p class="text-sm text-gray-500">
            Municipio: <span class="text-gray-900 font-bold ml-1 text-base">{{ perfil.municipio || '—' }}</span>
          </p>

          <button
            class="mt-6 w-full rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            @click="solicitarCambioUbicacion"
          >
            Solicitar cambio de ubicación
          </button>

          <p class="text-xs text-gray-400 mt-3 font-medium text-center">
            Los cambios de comunidad/municipio requieren aprobación del equipo.
          </p>
        </div>

        <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 class="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Asesor asignado</h3>
          <p class="text-sm text-gray-500 mb-2">
            Nombre: <span class="text-gray-900 font-bold ml-1">{{ perfil.asesorNombre || '—' }}</span>
          </p>
          <p class="text-sm text-gray-500">
            Teléfono: <span class="text-gray-900 font-bold ml-1">{{ perfil.asesorTelefono || '—' }}</span>
          </p>

          <div class="flex gap-3 mt-6">
            <a
              :href="whatsUrl"
              target="_blank"
              rel="noopener"
              class="flex-1 text-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-colors"
            >
              WhatsApp
            </a>
            <a
              :href="telUrl"
              class="flex-1 text-center rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Llamar
            </a>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import { usePerfilStore } from '@/stores/perfil'
import { useAlertasStore } from '@/stores/alertas'
import { useRouter } from 'vue-router'
import MapPicker from '@/components/MapPicker.vue'

const auth = useAuthStore()
const perfil = usePerfilStore()
const alertas = useAlertasStore()

// Rol para mostrar "Rol: Usuaria / Operador / Admin"
const role = computed(() => auth.role)

// Nombre que viene del backend (login / auth.me)
const displayNameFromAuth = computed(() => {
  const u: any = auth.user
  if (!u) return ''
  return String(u.name ?? u.nombre ?? '').trim()
})

// Al montar: cargar perfil guardado y rellenar con datos del auth si faltan
onMounted(() => {
  perfil.load()

  const u: any = auth.user
  if (!u) return

  perfil.nombre = u.name ?? u.nombre ?? perfil.nombre
  perfil.email = u.email ?? perfil.email
  perfil.telefono = u.telefono ?? perfil.telefono
  perfil.sexo = u.sexo ?? perfil.sexo
  perfil.edad = u.edad != null ? String(u.edad) : perfil.edad

  perfil.comunidad = u.comunidad ?? perfil.comunidad
  perfil.municipio = u.municipio ?? perfil.municipio
  perfil.direccion = u.direccion ?? perfil.direccion
  perfil.lat = u.lat ?? perfil.lat
  perfil.lng = u.lng ?? perfil.lng

  if (u.avatar) {
    perfil.avatar = u.avatar
  }
})


// Estado local de edición
const editando = ref(false)
const showMap = ref(false)

// Form inicial (perfil + datos del auth si existen)
const u = computed(() => auth.user as any || {})

const form = reactive({
  avatar: perfil.avatar ?? u.value.avatar ?? null,
  nombre: perfil.nombre || u.value.name || '',
  telefono: perfil.telefono || u.value.telefono || '',
  email: perfil.email || u.value.email || '',
  sexo: perfil.sexo || u.value.sexo || '',
  edad: perfil.edad || (u.value.edad != null ? String(u.value.edad) : ''),
  direccion: perfil.direccion || u.value.direccion || '',
  lat: perfil.lat || u.value.lat || null,
  lng: perfil.lng || u.value.lng || null,
})

const location = computed({
  get: () => (form.lat && form.lng) ? { lat: Number(form.lat), lng: Number(form.lng) } : null,
  set: (val) => {
    form.lat = val?.lat || null
    form.lng = val?.lng || null
  }
})



// Placeholder si no hay avatar (LIGHT MODE)
const placeholder =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="80" fill="#F3F4F6"/><circle cx="80" cy="60" r="32" fill="#9CA3AF"/><rect x="35" y="98" width="90" height="40" rx="20" fill="#D1D5DB"/></svg>`,
  )

// Validación mínima
const valido = computed(() => {
  const telOk = !form.telefono || /^\d{10}$/.test(form.telefono)
  const mailOk = !form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  return !!form.nombre && telOk && mailOk
})

function activarEdicion() {
  // Refrescamos el form por si el perfil cambió
  form.avatar = perfil.avatar
  form.nombre = perfil.nombre || displayNameFromAuth.value || ''
  form.telefono = perfil.telefono || ((auth.user as any)?.telefono ?? '')
  form.email = perfil.email || ((auth.user as any)?.email ?? '')
  form.direccion = perfil.direccion
  form.lat = perfil.lat ?? ((auth.user as any)?.lat ?? null)
  form.lng = perfil.lng ?? ((auth.user as any)?.lng ?? null)
  editando.value = true
}

function cancelar() {
  form.avatar = perfil.avatar
  form.nombre = perfil.nombre
  form.telefono = perfil.telefono
  form.email = perfil.email
  form.sexo = perfil.sexo
  form.edad = perfil.edad
  form.direccion = perfil.direccion
  form.lat = perfil.lat
  form.lng = perfil.lng
  editando.value = false
}



  async function guardar() {
    if (!valido.value) return

  try {
    // Sincronizar con el backend vía auth store
    await auth.updateProfile({
      name: form.nombre.trim(),
      telefono: form.telefono.trim(),
      sexo: form.sexo,
      edad: form.edad ? Number(form.edad) : null,
      direccion: form.direccion.trim(),
      lat: form.lat,
      lng: form.lng
    })

    // Actualizar store local de perfil
    perfil.set({
      avatar: form.avatar,
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim(),
      email: form.email.trim(),
      sexo: form.sexo,
      edad: form.edad.trim(),
      direccion: form.direccion.trim(),
      lat: form.lat,
      lng: form.lng
    })

    alertas.pushToast('¡Perfil actualizado con éxito!', 'success')
    editando.value = false
  } catch (e) {
    alertas.pushToast('Error al actualizar el perfil', 'error')
  }
}

// Carga de avatar
function onAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    form.avatar = String(reader.result)
  }
  reader.readAsDataURL(file)
}

// Helpers de contacto del asesor
const digits = (s: string | null | undefined) => (s || '').replace(/\D+/g, '')

const whatsUrl = computed(() => {
  const phone = digits(perfil.asesorTelefono)
  const text = encodeURIComponent('Hola, necesito apoyo con mi pedido / registro.')
  return phone ? `https://wa.me/52${phone}?text=${text}` : '#'
})

const telUrl = computed(() => {
  const phone = digits(perfil.asesorTelefono)
  return phone ? `tel:+52${phone}` : '#'
})

// === Función llamada por el botón "Solicitar cambio de ubicación"
function solicitarCambioUbicacion() {
  const nuevaComunidad = prompt('Nueva comunidad:', perfil.comunidad || '')
  if (!nuevaComunidad) return

  const nuevoMunicipio = prompt('Nuevo municipio:', perfil.municipio || '')
  if (!nuevoMunicipio) return

  ;(perfil as any).solicitudUbicacionPendiente = {
    comunidad: nuevaComunidad,
    municipio: nuevoMunicipio,
    fecha: new Date().toISOString(),
  }

  alert('Solicitud enviada. El equipo revisará el cambio.')
  // Si después agregas un endpoint real:
  // perfil.enviarSolicitudCambioUbicacion?.(nuevaComunidad, nuevoMunicipio)
}
</script>
