<template>
  <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 border border-white/10 shadow-2xl max-w-4xl mx-auto">

    <div class="p-6 md:p-8">

      <header class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 class="text-2xl font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Nuevo Pedido
          </h2>
          <p class="text-white/50 text-sm mt-1">Completa los detalles para registrar tu solicitud.</p>
        </div>

        <transition enter-active-class="animate-fade-in-down">
          <div v-if="sugerencia > 0" class="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-2">
            <div class="text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="text-sm">
              <span class="text-emerald-200 block text-xs font-semibold uppercase tracking-wider">Sugerencia Inteligente</span>
              <span class="text-white">Te recomendamos pedir <b>{{ sugerencia }}</b> sacos</span>
            </div>
            <button
              type="button"
              class="ml-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded transition-colors shadow-lg shadow-emerald-900/50"
              @click="aplicarSugerencia"
            >
              Aplicar
            </button>
          </div>
        </transition>
      </header>

      <form class="space-y-6" @submit.prevent="onSubmit">

        <div class="grid md:grid-cols-12 gap-6">

          <div class="md:col-span-7 space-y-5">

            <div class="group">
              <label class="block text-xs font-medium text-white/60 mb-1.5 ml-1 uppercase tracking-wide">Producto</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-white/40 group-focus-within:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                
                <select
                  v-model="producto"
                  class="w-full rounded-lg bg-neutral-950/50 border border-white/10 pl-10 pr-4 py-3 text-white placeholder-white/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none appearance-none truncate"
                >
                  <option disabled value="">Selecciona un producto...</option>
                  
                  <optgroup
                    v-for="grupo in productosAgrupados"
                    :key="grupo.categoria"
                    :label="grupo.categoria"
                    class="bg-neutral-900 text-emerald-400 font-bold pt-2"
                  >
                    <option
                      v-for="p in grupo.productos"
                      :key="p.nombre"
                      :value="p.nombre"
                      class="bg-neutral-900 text-white font-normal py-1"
                    >
                      {{ p.nombre }}
                    </option>
                  </optgroup>
                </select>

                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-white/40">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              <p v-if="errors.producto" class="text-rose-400 text-xs mt-1 ml-1 flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {{ errors.producto }}
              </p>
            </div>

            <div class="group">
              <label class="block text-xs font-medium text-white/60 mb-1.5 ml-1 uppercase tracking-wide">Cantidad (Sacos)</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-white/40 group-focus-within:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                </div>
                <input
                  v-model.number="cantidad"
                  type="number"
                  min="1"
                  placeholder="0"
                  class="w-full rounded-lg bg-neutral-950/50 border border-white/10 pl-10 pr-4 py-3 text-white placeholder-white/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                />
              </div>
              <p v-if="errors.cantidad" class="text-rose-400 text-xs mt-1 ml-1 flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {{ errors.cantidad }}
              </p>
            </div>

            <div class="group">
              <label class="block text-xs font-medium text-white/60 mb-1.5 ml-1 uppercase tracking-wide">Observaciones</label>
              <textarea
                v-model="observaciones"
                rows="3"
                class="w-full rounded-lg bg-neutral-950/50 border border-white/10 px-4 py-3 text-white placeholder-white/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none resize-none"
                placeholder="¿Alguna instrucción especial para la entrega?"
              ></textarea>
            </div>
          </div>

          <div class="md:col-span-5">
            <div class="h-full bg-white/5 border border-white/5 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h3 class="text-white/80 font-semibold mb-4 border-b border-white/10 pb-2">Resumen</h3>
                
                <div class="flex justify-between items-center mb-3 text-sm">
                  <span class="text-white/50">Precio Unitario</span>
                  <span class="text-white font-mono">${{ precioSeleccionado.toFixed(2) }}</span>
                </div>
                
                <div class="flex justify-between items-center mb-3 text-sm">
                  <span class="text-white/50">Cantidad</span>
                  <span class="text-white font-mono">x {{ cantidad || 0 }}</span>
                </div>
              </div>

              <div class="mt-4 pt-4 border-t border-white/10">
                <div class="flex justify-between items-end">
                  <span class="text-emerald-400 font-medium">Total Estimado</span>
                  <span class="text-3xl font-bold text-white tracking-tight">${{ total.toFixed(2) }}</span>
                </div>
                <p class="text-xs text-white/30 text-right mt-1">*Impuestos incluidos si aplica</p>
              </div>
            </div>
          </div>

        </div>

        <div class="pt-4 flex flex-col md:flex-row items-center gap-4">
          <button
            class="w-full md:w-auto flex-1 rounded-lg bg-emerald-600 px-6 py-3.5 text-white font-medium hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-900/20 flex justify-center items-center gap-2"
            type="submit"
            :disabled="isSaving"
          >
            <span v-if="isSaving" class="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></span>
            {{ isSaving ? 'Procesando...' : 'Confirmar y Guardar Pedido' }}
          </button>
          
          <transition enter-active-class="animate-fade-in">
            <p v-if="formMsg" class="text-sm font-medium" :class="formMsg.includes('No se pudo') ? 'text-rose-400' : 'text-emerald-400'">
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

    alertas.add({
      titulo: 'Pedido creado',
      mensaje: `Tu pedido de ${body.cantidad} saco(s) fue registrado.`,
      tipo: 'pedido',
      severidad: 'info',
      ctaPrimaria: { label: 'Ver historial', routeName: 'u.historial' },
    })

    formMsg.value = 'Pedido registrado. Puedes revisarlo en Historial.'
  } catch (e) {
    console.error(e)
    formMsg.value = 'No se pudo registrar el pedido. Inténtalo de nuevo.'
  } finally {
    isSaving.value = false
  }
}
</script>