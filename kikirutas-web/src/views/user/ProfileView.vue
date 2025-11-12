<template>
  <div class="max-w-5xl">
    <div class="flex items-start justify-between mb-4">
      <h2 class="text-2xl font-semibold">Perfil</h2>

      <div class="flex gap-2">
        <button
          v-if="!editando"
          class="rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-500"
          @click="activarEdicion"
        >
          Editar
        </button>

        <template v-else>
          <button
            class="rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-500"
            @click="guardar"
            :disabled="!valido"
          >
            Guardar
          </button>
          <button
            class="rounded bg-white/10 border border-white/15 px-4 py-2 hover:bg-white/15"
            @click="cancelar"
          >
            Cancelar
          </button>
        </template>
      </div>
    </div>

    <div class="grid md:grid-cols-2 gap-4">
      <!-- Datos de la usuaria -->
      <section class="rounded-xl border border-white/10 bg-white/5 p-4">
        <h3 class="font-semibold mb-3">Datos de la usuaria</h3>

        <div class="flex items-center gap-4 mb-4">
          <div class="relative">
            <img
              :src="form.avatar || placeholder"
              class="h-20 w-20 rounded-full object-cover border border-white/10 bg-neutral-900"
              alt="Avatar"
            />
            <label
              v-if="editando"
              class="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs rounded bg-white/10 px-2 py-1 border border-white/15 cursor-pointer hover:bg-white/15"
            >
              Cambiar
              <input type="file" class="hidden" accept="image/*" @change="onAvatarChange" />
            </label>
          </div>

          <div class="text-sm text-white/70">
            <p class="font-medium text-white">{{ form.nombre || 'Sin nombre' }}</p>
            <p>Rol: {{ role || '—' }}</p>
          </div>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-sm mb-1">Nombre</label>
            <input
              v-model="form.nombre"
              :disabled="!editando"
              type="text"
              class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2"
            />
          </div>

          <div>
            <label class="block text-sm mb-1">Teléfono (WhatsApp)</label>
            <input
              v-model="form.telefono"
              :disabled="!editando"
              type="tel"
              inputmode="numeric"
              class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2"
              placeholder="10 dígitos"
            />
          </div>

          <div>
            <label class="block text-sm mb-1">Correo</label>
            <input
              v-model="form.email"
              :disabled="!editando"
              type="email"
              class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div class="flex flex-wrap gap-2 pt-1">
            <RouterLink :to="{ name: 'u.inventario' }" class="rounded bg-emerald-800/40 border border-emerald-600/40 px-3 py-2 text-sm hover:bg-emerald-700/50">
              Mi granja
            </RouterLink>
            <RouterLink :to="{ name: 'u.historial' }" class="rounded bg-white/10 border border-white/15 px-3 py-2 text-sm hover:bg-white/15">
              Mis pedidos
            </RouterLink>
            <a href="#" class="rounded bg-white/10 border border-white/15 px-3 py-2 text-sm hover:bg-white/15">
              Cambiar contraseña
            </a>
          </div>
        </div>
      </section>

      <!-- Ubicación y Asesor -->
      <section class="space-y-4">
        <div class="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 class="font-semibold mb-3">Ubicación registrada</h3>
          <p class="text-sm text-gray-300 mb-1">
            Comunidad: <span class="text-gray-100 font-medium">{{ perfil.comunidad || '—' }}</span>
          </p>
          <p class="text-sm text-gray-300">
            Municipio: <span class="text-gray-100 font-medium">{{ perfil.municipio || '—' }}</span>
          </p>

          <button
            class="mt-3 rounded bg-white/10 border border-white/15 px-3 py-2 text-sm hover:bg-white/15"
            @click="solicitarCambioUbicacion"
          >
            Solicitar cambio de ubicación
          </button>

          <p class="text-xs text-white/50 mt-2">
            Los cambios de comunidad/municipio requieren aprobación del equipo.
          </p>
        </div>

        <div class="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 class="font-semibold mb-3">Asesor asignado</h3>
          <p class="text-sm text-gray-300 mb-1">
            Nombre: <span class="text-gray-100 font-medium">{{ perfil.asesorNombre || '—' }}</span>
          </p>
          <p class="text-sm text-gray-300">
            Teléfono: <span class="text-gray-100 font-medium">{{ perfil.asesorTelefono || '—' }}</span>
          </p>

          <div class="flex gap-2 mt-3">
            <a
              :href="whatsUrl"
              target="_blank"
              rel="noopener"
              class="rounded bg-emerald-600 px-3 py-2 text-sm hover:bg-emerald-500"
            >
              Chatear por WhatsApp
            </a>
            <a
              :href="telUrl"
              class="rounded bg-white/10 border border-white/15 px-3 py-2 text-sm hover:bg-white/15"
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
import { reactive, ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'

import { useAuthStore } from '@/stores/auth'
import { usePerfilStore } from '@/stores/perfil'

const auth = useAuthStore()
const { role, displayName } = storeToRefs(auth)

const perfil = usePerfilStore()
perfil.load()

// estado local de edición
const editando = ref(false)

// form inicial (prefill con perfil o auth)
const form = reactive({
  avatar: perfil.avatar,
  nombre: perfil.nombre || displayName.value || '',
  telefono: perfil.telefono,
  email: perfil.email,
})

// placeholder si no hay avatar
const placeholder =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="80" fill="#0f1010"/><circle cx="80" cy="60" r="28" fill="#2b2f2d"/><rect x="35" y="98" width="90" height="40" rx="20" fill="#2b2f2d"/></svg>`
  )

// validación mínima
const valido = computed(() => {
  const telOk = !form.telefono || /^\d{10}$/.test(form.telefono)
  const mailOk = !form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  return !!form.nombre && telOk && mailOk
})

function activarEdicion() {
  editando.value = true
}

function cancelar() {
  // restaurar desde store
  form.avatar = perfil.avatar
  form.nombre = perfil.nombre || displayName.value || ''
  form.telefono = perfil.telefono
  form.email = perfil.email
  editando.value = false
}

function guardar() {
  if (!valido.value) return
  perfil.set({
    avatar: form.avatar,
    nombre: form.nombre,
    telefono: form.telefono,
    email: form.email,
  })
  // opcional: sincronizar nombre visible del auth
  if (form.nombre && form.nombre !== displayName.value) {
    auth.displayName = form.nombre
    auth.saveToStorage?.()
  }
  editando.value = false
}

// carga de avatar
function onAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { form.avatar = String(reader.result) }
  reader.readAsDataURL(file)
}

// helpers de contacto asesor
const digits = (s: string) => (s || '').replace(/\D+/g, '')
const whatsUrl = computed(() => {
  const phone = digits(perfil.asesorTelefono || '')
  const text = encodeURIComponent('Hola, necesito apoyo con mi pedido / registro.')
  return phone ? `https://wa.me/52${phone}?text=${text}` : '#'
})
const telUrl = computed(() => {
  const phone = digits(perfil.asesorTelefono || '')
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
  // Si tienes una acción real:
  // perfil.enviarSolicitudCambioUbicacion?.(nuevaComunidad, nuevoMunicipio)
}
</script>
