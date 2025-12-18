<template>
  <div class="relative overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-xl max-w-4xl mx-auto">

    <div class="p-6 md:p-10">

      <header class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
        <div>
          <h2 class="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <div class="p-2 bg-brand/10 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            Nuevo Pedido
          </h2>
          <p class="text-gray-500 text-sm mt-2 font-medium">Completa los detalles para registrar tu solicitud.</p>
        </div>

        <transition enter-active-class="animate-fade-in-down">
          <div v-if="sugerencia > 0"
            class="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 shadow-sm">
            <div class="text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd" />
              </svg>
            </div>
            <div class="text-sm">
              <span class="text-blue-700 block text-xs font-bold uppercase tracking-wider mb-0.5">Sugerencia
                Inteligente</span>
              <span class="text-gray-700">Te recomendamos pedir <b class="text-gray-900">{{ sugerencia }}</b>
                sacos</span>
            </div>
            <button type="button"
              class="ml-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors shadow-md shadow-blue-200"
              @click="aplicarSugerencia">
              Aplicar
            </button>
          </div>
        </transition>
      </header>

      <form class="space-y-8" @submit.prevent="onSubmit">

        <div class="grid md:grid-cols-12 gap-8">

          <div class="md:col-span-7 space-y-6">

            <div class="group">
              <label class="block text-xs font-bold text-gray-500 mb-2 ml-1 uppercase tracking-wide">Producto</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400 group-focus-within:text-brand transition-colors" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>

                <select v-model="producto"
                  class="w-full rounded-xl bg-gray-50 border border-gray-200 pl-10 pr-4 py-3.5 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none appearance-none truncate font-medium cursor-pointer shadow-sm">
                  <option disabled value="">Selecciona un producto...</option>

                  <optgroup v-for="grupo in productosAgrupados" :key="grupo.categoria" :label="grupo.categoria"
                    class="font-bold text-gray-900 pt-2">
                    <option v-for="p in grupo.productos" :key="p.nombre" :value="p.nombre"
                      class="text-gray-700 font-normal py-1">
                      {{ p.nombre }}
                    </option>
                  </optgroup>
                </select>

                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
              <p v-if="errors.producto" class="text-rose-500 text-xs mt-1.5 ml-1 flex items-center gap-1 font-medium">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ errors.producto }}
              </p>
            </div>

            <div class="group">
              <label class="block text-xs font-bold text-gray-500 mb-2 ml-1 uppercase tracking-wide">Cantidad
                (Sacos)</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400 group-focus-within:text-brand transition-colors" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                </div>
                <input v-model.number="cantidad" type="number" min="1" placeholder="0"
                  class="w-full rounded-xl bg-gray-50 border border-gray-200 pl-10 pr-4 py-3.5 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none font-medium shadow-sm" />
              </div>
              <p v-if="errors.cantidad" class="text-rose-500 text-xs mt-1.5 ml-1 flex items-center gap-1 font-medium">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ errors.cantidad }}
              </p>
            </div>

            <div class="group">
              <label
                class="block text-xs font-bold text-gray-500 mb-2 ml-1 uppercase tracking-wide">Observaciones</label>
              <textarea v-model="observaciones" rows="3"
                class="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none resize-none font-medium shadow-sm"
                placeholder="¿Alguna instrucción especial para la entrega?"></textarea>
            </div>
          </div>

          <div class="md:col-span-5">
            <div
              class="h-full bg-gray-50 border border-gray-100 rounded-2xl p-6 flex flex-col justify-between shadow-inner">
              <div>
                <h3 class="text-gray-900 font-bold mb-5 border-b border-gray-200 pb-3 text-lg">Resumen</h3>

                <div class="flex justify-between items-center mb-4 text-sm">
                  <span class="text-gray-500 font-medium">Precio Unitario</span>
                  <span class="text-gray-900 font-bold font-mono text-base">${{ precioSeleccionado.toFixed(2) }}</span>
                </div>

                <div class="flex justify-between items-center mb-4 text-sm">
                  <span class="text-gray-500 font-medium">Cantidad</span>
                  <span class="text-gray-900 font-bold font-mono text-base">x {{ cantidad || 0 }}</span>
                </div>
              </div>

              <div class="mt-6 pt-6 border-t border-gray-200 border-dashed">
                <div class="flex justify-between items-end">
                  <span class="text-brand font-bold text-sm uppercase tracking-wide mb-1">Total Estimado</span>
                  <span class="text-4xl font-black text-gray-900 tracking-tight">${{ total.toFixed(2) }}</span>
                </div>
                <p class="text-xs text-gray-400 text-right mt-2 font-medium">*Impuestos incluidos si aplica</p>
              </div>
            </div>
          </div>

        </div>

        <div class="pt-6 flex flex-col md:flex-row items-center gap-4">
          <button
            class="w-full md:w-auto flex-1 rounded-xl bg-brand px-8 py-4 text-white font-bold hover:bg-red-800 active:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand/20 flex justify-center items-center gap-3 text-lg hover:-translate-y-0.5"
            type="submit" :disabled="isSaving">
            <span v-if="isSaving"
              class="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></span>
            {{ isSaving ? 'Procesando...' : 'Confirmar y Guardar Pedido' }}
          </button>

          <transition enter-active-class="animate-fade-in">
            <p v-if="formMsg" class="text-sm font-bold bg-white px-4 py-2 rounded-lg border shadow-sm"
              :class="formMsg.includes('No se pudo') ? 'text-rose-600 border-rose-100' : 'text-emerald-600 border-emerald-100'">
              {{ formMsg }}
            </p>
          </transition>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useInventarioStore } from '@/stores/inventario'
import { useAlertasStore } from '@/stores/alertas'
import { usePedidosStore } from '@/stores/pedidos'
import { useProductosStore } from '@/stores/productos'
import api from '@/api'

// Stores
const auth = useAuthStore()
const inv = useInventarioStore(); inv.load()
const alertas = useAlertasStore()
const pedidos = usePedidosStore(); pedidos.load({ mine: true })
const productosStore = useProductosStore(); productosStore.load(); productosStore.seedDefaults()

// --- LÓGICA DE AGRUPACIÓN AUTOMÁTICA ---
const productosAgrupados = computed(() => {
  const grupos: Record<string, any[]> = {
    'PAVOS': [],
    'POLLOS ENGORDA': [],
    'POSTURA': [],
    'CERDOS': [],
    'MATERIA PRIMA': [],
    'OTROS PRODUCTOS': []
  }

  productosStore.activos.forEach(p => {
    const nombreUpper = p.nombre.toUpperCase()

    if (nombreUpper.includes('PAVO')) {
      grupos['PAVOS'].push(p)
    }
    else if (nombreUpper.includes('CERDO')) {
      grupos['CERDOS'].push(p)
    }
    else if (
      nombreUpper.includes('POLLITA') ||
      nombreUpper.includes('POLLA') ||
      nombreUpper.includes('POSTURA')
    ) {
      grupos['POSTURA'].push(p)
    }
    // ---------------------------
    else if (nombreUpper.includes('POLLO') || nombreUpper.includes('TRASPATIO')) {
      grupos['POLLOS ENGORDA'].push(p)
    }
    else if (
      nombreUpper.includes('MAÍZ') ||
      nombreUpper.includes('MAIZ') ||
      nombreUpper.includes('SOYA') ||
      nombreUpper.includes('SALVADILLO')
    ) {
      grupos['MATERIA PRIMA'].push(p)
    }
    else {
      grupos['OTROS PRODUCTOS'].push(p)
    }
  })

  return Object.keys(grupos)
    .filter(cat => grupos[cat].length > 0)
    .map(cat => ({
      categoria: cat,
      productos: grupos[cat]
    }))
})
// ---------------------------------------

// Form state
const producto = ref<string>('')
const cantidad = ref<number | null>(null)
const observaciones = ref<string>('')
const isSaving = ref(false)
const formMsg = ref<string>('')
const errors = ref<{ producto?: string; cantidad?: string }>({})

// Validación
function validate(): boolean {
  errors.value = {}
  if (!producto.value) errors.value.producto = 'Selecciona un producto'
  if (!cantidad.value || cantidad.value < 1) errors.value.cantidad = 'Ingresa una cantidad válida (mínimo 1)'
  return Object.keys(errors.value).length === 0
}

// Sugerencia
const sugerencia = computed(() => inv.sugerirSacos ?? 0)
function aplicarSugerencia() {
  if (sugerencia.value > 0) cantidad.value = sugerencia.value
}

// Precio y total
const precioSeleccionado = computed<number>(() => {
  const p = productosStore.items.find(i => i.nombre === producto.value)
  return p ? p.precio : 0
})
const total = computed<number>(() => (precioSeleccionado.value || 0) * (cantidad.value || 0))

// Snapshot solicitante
function getSolicitante() {
  const a: any = auth
  const user: any = a.user || a.me || a.perfil || {}
  const partesNombre = [user.nombre, user.apellido_paterno, user.apellido_materno].filter(Boolean)
  let nombre: string | null = partesNombre.length ? partesNombre.join(' ') : null
  if (!nombre && user.name) nombre = String(user.name)
  const comunidad: string | null = user.comunidad ?? user.municipio ?? a.comunidad ?? null
  return { nombre, comunidad }
}

async function onSubmit() {
  if (!validate()) return
  isSaving.value = true
  formMsg.value = ''

  try {
    const solicitante = getSolicitante()
    const body = {
      producto: producto.value,
      cantidad: cantidad.value ?? 1,
      fecha: new Date().toISOString().slice(0, 10),
      solicitante_nombre: solicitante.nombre ?? undefined,
      solicitante_comunidad: solicitante.comunidad ?? undefined,
      notas: (observaciones.value || '').trim(),
    }

    await api.post('/pedidos', body)
    await pedidos.load({ mine: true })

    producto.value = ''
    cantidad.value = null
    observaciones.value = ''

    // alertas.addLocal(...) eliminada, ahora viene del backend

    formMsg.value = 'Pedido registrado. Puedes revisarlo en Historial.'
  } catch (e) {
    console.error(e)
    formMsg.value = 'No se pudo registrar el pedido. Inténtalo de nuevo.'
  } finally {
    isSaving.value = false
  }
}
</script>