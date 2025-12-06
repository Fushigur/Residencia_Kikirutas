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
      <h1 class="text-2xl font-semibold">Ruta</h1>

      <!-- Ir al mapa de esta ruta -->
      <router-link
        v-if="rutaSel"
        :to="{ name:'op.ruta.mapa', params:{ id: rutaSel.id } }"
        class="rounded bg-white/10 px-3 py-2 hover:bg-white/20 text-sm"
      >
        Ver mapa
      </router-link>
    </div>

    <!-- Encabezado de ruta -->
    <div v-if="rutaSel"
         class="rounded-xl border border-white/10 shadow p-4
                bg-neutral-900">
      <!-- ^^^ COLOR DE FONDO DEL PANEL DE ENCABEZADO (oscuro y sólido) -->

      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="text-sm text-white/70">Operador</div>
          <div class="font-medium">{{ rutaSel.nombre }}</div>
          <div class="text-sm text-white/70 mt-1">Fecha: {{ rutaSel.fechaISO }}</div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="px-2 py-1 rounded text-xs bg-white/10 border border-white/10">
            Total: <b>{{ total }}</b>
          </span>
          <span class="px-2 py-1 rounded text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Pend.: <b>{{ pendientes }}</b>
          </span>
          <span class="px-2 py-1 rounded text-xs bg-blue-500/15 text-blue-300 border border-blue-500/30">
            En ruta: <b>{{ enRuta }}</b>
          </span>
          <span class="px-2 py-1 rounded text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Entreg.: <b>{{ entregados }}</b>
          </span>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <button
          class="rounded bg-blue-600 px-3 py-2 hover:bg-blue-500 disabled:opacity-60"
          :disabled="pendientes === 0"
          @click="iniciarRecorrido"
        >
          Iniciar recorrido
        </button>

        <button
          class="rounded bg-rose-700 px-3 py-2 hover:bg-rose-600 disabled:opacity-60"
          :disabled="total === 0 || entregados !== total"
          @click="finalizarRecorrido"
        >
          Finalizar ruta
        </button>
      </div>
    </div>

    <div v-else class="text-white/70 text-sm">Ruta no encontrada.</div>

    <!-- Lista de paradas / pedidos -->
    <div class="rounded-xl border border-white/10 shadow p-4
                bg-neutral-900">
      <!-- ^^^ COLOR DE FONDO DEL PANEL DE LA LISTA (oscuro y sólido) -->

      <h2 class="font-semibold mb-3">Paradas / Pedidos</h2>

      <div v-if="!pedidosRuta.length" class="text-white/70 text-sm">
        No hay pedidos en esta ruta.
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="p in pedidosRuta" :key="p.id"
          class="rounded border border-white/10 p-3
                 bg-neutral-950"
        >
          <!-- ^^^ COLOR DE FONDO DE CADA ÍTEM / TARJETA (más oscuro y sólido) -->

          <div class="flex flex-wrap items-center gap-2 justify-between">
            <div>
              <div class="font-medium">
                {{ p.solicitanteNombre || '—' }}
              </div>
              <div class="text-sm text-white/70">
                Localidad: <b>{{ p.solicitanteComunidad || '—' }}</b>
              </div>
              <div class="text-sm">
                Producto: <b>{{ p.producto }}</b> · Cant: <b>{{ p.cantidad }}</b>
              </div>
              <div class="text-xs text-white/60">Fecha: {{ p.fechaISO }}</div>
            </div>

            <div class="flex items-center gap-2">
              <span
                class="px-2 py-1 rounded text-xs"
                :class="{
                  'bg-amber-500/15 text-amber-300 border border-amber-500/30' : p.estado === 'pendiente',
                  'bg-blue-500/15 text-blue-300 border border-blue-500/30'   : p.estado === 'en_ruta',
                  'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : p.estado === 'entregado',
                  'bg-rose-500/15 text-rose-300 border border-rose-500/30'   : p.estado === 'cancelado',
                }"
              >
                {{ p.estado[0].toUpperCase() + p.estado.slice(1).replace('_',' ') }}
              </span>

              <button
                v-if="p.estado === 'pendiente'"
                class="rounded bg-blue-600 px-3 py-1 hover:bg-blue-500"
                @click="marcarEnRuta(p.id)"
              >
                Poner en ruta
              </button>
            </div>
          </div>

          <div v-if="p.observaciones" class="text-xs text-white/60 mt-1">
            {{ p.observaciones }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
