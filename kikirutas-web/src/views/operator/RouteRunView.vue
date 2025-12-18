<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useRutasStore } from '@/stores/rutas'
import { usePedidosStore } from '@/stores/pedidos'

const route = useRoute()
const rutas = useRutasStore()
const pedidos = usePedidosStore()

onMounted(() => { rutas.load(); pedidos.load() })

// Ruta seleccionada
const rutaSel = computed(() => rutas.byId(String(route.params.id)) || null)

// Pedidos en el orden guardado en la ruta
const pedidosRuta = computed(() => {
  if (!rutaSel.value) return []
  return rutaSel.value.pedidos
    .map(id => pedidos.byId(id))
    .filter((p): p is NonNullable<ReturnType<typeof pedidos.byId>> => Boolean(p))
})

// KPIs
const total       = computed(() => pedidosRuta.value.length)
const pendientes  = computed(() => pedidosRuta.value.filter(p => p.estado === 'pendiente').length)
const enRuta      = computed(() => pedidosRuta.value.filter(p => p.estado === 'en_ruta').length)
const entregados  = computed(() => pedidosRuta.value.filter(p => p.estado === 'entregado').length)

// Acciones
function iniciarRecorrido() {
  for (const p of pedidosRuta.value) if (p.estado === 'pendiente') pedidos.setEstado(p.id, 'en_ruta')
  if (rutaSel.value) (rutas as any).startRun?.(rutaSel.value.id)
}
function finalizarRecorrido() {
  if (!rutaSel.value) return
  if (entregados.value !== total.value) return
  (rutas as any).finishRun?.(rutaSel.value.id)
}
function marcarEnRuta(pid: string)     { pedidos.setEstado(pid, 'en_ruta') }
function marcarEntregado(pid: string)  { pedidos.setEstado(pid, 'entregado') }
</script>

<template>
  <!-- El OperatorLayout ya provee un panel principal sólido -->
  <section class="space-y-5">
    <!-- Título -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Ruta</h1>

      <!-- Ir al mapa de esta ruta -->
      <router-link
        v-if="rutaSel"
        :to="{ name:'op.ruta.mapa', params:{ id: rutaSel.id } }"
        class="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Ver mapa
      </router-link>
    </div>

    <!-- Encabezado de ruta -->
    <div v-if="rutaSel"
         class="rounded-2xl border border-gray-100 shadow-sm p-5 bg-white">
      
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div class="text-xs font-bold text-gray-500 uppercase tracking-wide">Operador</div>
          <div class="font-bold text-gray-900 text-lg">{{ rutaSel.nombre }}</div>
          <div class="text-sm text-gray-500 mt-1">Fecha: <span class="font-medium text-gray-700">{{ rutaSel.fechaISO }}</span></div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-gray-200 text-gray-700">
            Total: {{ total }}
          </span>
          <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Pend.: {{ pendientes }}
          </span>
          <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            En ruta: {{ enRuta }}
          </span>
          <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Entreg.: {{ entregados }}
          </span>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap gap-2 pt-4 border-t border-gray-100">
        <button
          class="rounded-xl bg-blue-600 font-bold text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-sm shadow-blue-200"
          :disabled="pendientes === 0"
          @click="iniciarRecorrido"
        >
          Iniciar recorrido
        </button>

        <button
          class="rounded-xl bg-red-600 font-bold text-white px-4 py-2 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 transition-colors shadow-sm shadow-red-200"
          :disabled="total === 0 || entregados !== total"
          @click="finalizarRecorrido"
        >
          Finalizar ruta
        </button>
      </div>
    </div>

    <div v-else class="text-gray-500 text-sm">Ruta no encontrada.</div>

    <!-- Lista de paradas / pedidos -->
    <div class="rounded-2xl border border-gray-100 shadow-sm p-5 bg-white">
      
      <h2 class="font-bold text-gray-900 mb-4">Paradas / Pedidos</h2>

      <div v-if="!pedidosRuta.length" class="text-gray-500 text-sm">
        No hay pedidos en esta ruta.
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="p in pedidosRuta" :key="p.id"
          class="rounded-xl border border-gray-100 p-4 bg-gray-50 hover:bg-white hover:shadow-sm transition-all"
        >
          
          <div class="flex flex-wrap items-center gap-3 justify-between">
            <div>
              <div class="font-bold text-gray-900">
                {{ p.solicitanteNombre || '—' }}
              </div>
              <div class="text-sm text-gray-600 mt-0.5">
                Localidad: <span class="font-medium text-gray-800">{{ p.solicitanteComunidad || '—' }}</span>
              </div>
              <div class="text-sm text-gray-600 mt-0.5">
                Producto: <span class="font-medium text-gray-800">{{ p.producto }}</span> · Cant: <span class="font-medium text-gray-800">{{ p.cantidad }}</span>
              </div>
              <div class="text-xs text-gray-400 mt-1 font-medium">Fecha: {{ p.fechaISO }}</div>
            </div>

            <div class="flex items-center gap-3">
              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border"
                :class="{
                  'bg-amber-50 text-amber-700 border-amber-200' : p.estado === 'pendiente',
                  'bg-blue-50 text-blue-700 border-blue-200'   : p.estado === 'en_ruta',
                  'bg-emerald-50 text-emerald-700 border-emerald-200' : p.estado === 'entregado',
                  'bg-red-50 text-red-700 border-red-200'   : p.estado === 'cancelado',
                }"
              >
                {{ p.estado[0].toUpperCase() + p.estado.slice(1).replace('_',' ') }}
              </span>

              <button
                v-if="p.estado === 'pendiente'"
                class="rounded-lg bg-blue-600 text-white font-bold px-3 py-1.5 text-xs hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                @click="marcarEnRuta(p.id)"
              >
                Poner en ruta
              </button>
            </div>
          </div>

          <div v-if="p.observaciones" class="text-xs text-gray-500 mt-2 bg-white p-2 rounded border border-gray-100 italic">
            "{{ p.observaciones }}"
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
