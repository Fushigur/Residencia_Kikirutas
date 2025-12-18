<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router';
import { usePedidosStore, type Pedido } from '@/stores/pedidos'
import { useRutasStore } from '@/stores/rutas'
import { useProductosStore } from '@/stores/productos'
import { formatFechaCorta } from '@/utils/dateFormat'
import CancellationModal from '@/components/CancellationModal.vue'

/* Stores */
const pedidos = usePedidosStore()
const rutas = useRutasStore()
const productos = useProductosStore()
const router = useRouter()
const route = useRoute();

onMounted(() => {
  pedidos.load()
  rutas.load()
  productos.load()
  productos.seedDefaults()

  /*   const pre = String(route.query.select || '');
    if (pre && pedidos.byId(pre) && !toAssign.value.includes(pre)) {
      toAssign.value.push(pre);
    } */
})

/* --------- Filtros --------- */
type EstadoFiltro = 'todos' | 'pendiente' | 'en_ruta' | 'entregado' | 'cancelado'
const q = ref('')
const estado = ref<EstadoFiltro>('todos')
const fechaIni = ref<string>('')   // yyyy-mm-dd
const fechaFin = ref<string>('')   // yyyy-mm-dd

function toDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}
function inRange(iso: string, ini?: string, fin?: string) {
  if (!ini && !fin) return true
  const t = toDate(iso).getTime()
  if (ini && t < toDate(ini).getTime()) return false
  if (fin && t > toDate(fin).getTime()) return false
  return true
}

/* Búsqueda + filtros + orden */
const list = computed<Pedido[]>(() => {
  const term = q.value.trim().toLowerCase()
  return pedidos.ordenados.filter(p => {
    if (estado.value !== 'todos' && p.estado !== estado.value) return false
    if (!inRange(p.fechaISO, fechaIni.value || undefined, fechaFin.value || undefined)) return false
    if (!term) return true
    const rutaNombre = p.routeId ? (rutas.byId(p.routeId)?.nombre ?? '') : ''
    return (
      p.folio.toLowerCase().includes(term) ||
      p.producto.toLowerCase().includes(term) ||
      (p.solicitanteNombre ?? '').toLowerCase().includes(term) ||
      (p.solicitanteComunidad ?? '').toLowerCase().includes(term) ||
      rutaNombre.toLowerCase().includes(term)
    )
  })
})

/* Precios */
function precio(nombre: string) {
  return productos.items.find(x => x.nombre === nombre)?.precio ?? 0
}

/* --------- Acciones --------- */
function goAsignarEnRutas(p: Pedido) {
  // Navega a la vista de Rutas y preselecciona el pedido
  router.push({ name: 'a.rutas', query: { pedido: p.id } })
}
function goVerRuta(p: Pedido) {
  if (!p.routeId) return
  router.push({ name: 'a.rutas', query: { ruta: p.routeId } })
}

function marcarEntregado(id: string) {
  pedidos.setEstado(id, 'entregado')
}

/* Modal cancelación */
const showCancelModal = ref(false)
const selectedOrderForCancel = ref<string | null>(null)

function cancelarPedido(id: string) {
  selectedOrderForCancel.value = id
  showCancelModal.value = true
}

function confirmCancel(reason: string) {
  const id = selectedOrderForCancel.value
  if (!id) return

  const p = pedidos.byId(id)
  if (p) {
    // Si hay motivo, lo agregamos a observaciones
    if (reason) {
      const tag = `Cancelado: ${reason}`
      p.observaciones = p.observaciones ? `${p.observaciones} | ${tag}` : tag
      pedidos.persist()
    }
    // Cambiar estado
    pedidos.setEstado(id, 'cancelado')
  }

  showCancelModal.value = false
  selectedOrderForCancel.value = null
}

// Borrado seguro: solo si está PENDIENTE y sin ruta
function borrarPedido(id: string, folio: string) {
  const p = pedidos.byId(id)
  if (!p) return
  if (p.estado !== 'pendiente' || p.routeId) return
  const ok = confirm(`¿Borrar pedido ${folio}? (solo pendiente y sin ruta)`)
  if (!ok) return
  const idx = pedidos.items.findIndex(x => x.id === id)
  if (idx !== -1) {
    pedidos.items.splice(idx, 1)
    pedidos.persist()
  }
}

/* Helpers UI */
function estadoChipClasses(e: Pedido['estado']) {
  return {
    'px-2.5 py-0.5 rounded-full text-xs font-bold border': true,
    'bg-amber-50 text-amber-700 border-amber-200': e === 'pendiente',
    'bg-blue-50 text-blue-700 border-blue-200': e === 'en_ruta',
    'bg-emerald-50 text-emerald-700 border-emerald-200': e === 'entregado',
    'bg-red-50 text-red-700 border-red-200': e === 'cancelado',
  }
}
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p class="text-gray-500 text-sm mt-1">Gestión y seguimiento de solicitudes</p>
      </div>
    </div>

    <!-- Filtros -->
    <div class="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
      <div class="grid md:grid-cols-5 gap-4">
        <div class="md:col-span-2">
          <label class="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Buscar</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </span>
            <input v-model="q" type="text" class="w-full rounded-xl border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all"
            placeholder="Folio, producto, solicitante..." />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Estado</label>
          <select v-model="estado" class="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all">
            <option value="todos">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_ruta">En ruta</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div>
           <label class="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Desde</label>
          <input v-model="fechaIni" type="date"
            class="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all" />
        </div>

        <div>
           <label class="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Hasta</label>
          <input v-model="fechaFin" type="date"
            class="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all" />
        </div>
      </div>
    </div>

    <!-- Tabla -->
    <div class="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[1150px] text-sm text-left">
          <thead class="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
            <tr>
              <th class="py-3 px-4 w-[90px]">Folio</th>
              <th class="px-4 w-[220px]">Producto</th>
              <th class="px-4 w-[180px]">Solicitante</th>
              <th class="px-4 w-[160px]">Comunidad</th>
              <th class="text-right px-4 w-[80px]">Cant.</th>
              <th class="text-right px-4 w-[110px]">Precio</th>
              <th class="text-right px-4 w-[120px]">Subtotal</th>
              <th class="px-4 w-[120px]">Fecha</th>
              <th class="px-4 w-[120px]">Estado</th>
              <th class="px-4 w-[150px]">Ruta</th>
              <th class="px-4 w-[260px]">Acciones</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100">
            <tr v-for="p in list" :key="p.id" class="hover:bg-gray-50 transition-colors group">
              <!-- Folio -->
              <td class="py-3 px-4 font-bold text-gray-900">{{ p.folio }}</td>

              <!-- Producto -->
              <td class="px-4 text-gray-700">
                <div class="truncate max-w-[210px]" :title="p.producto">{{ p.producto }}</div>
              </td>

              <!-- Solicitante / Comunidad -->
              <td class="px-4 text-gray-600">
                <div class="truncate max-w-[170px]" :title="p.solicitanteNombre || '—'">
                  {{ p.solicitanteNombre || '—' }}
                </div>
              </td>
              <td class="px-4 text-gray-500">
                <div class="truncate max-w-[150px]" :title="p.solicitanteComunidad || '—'">
                  {{ p.solicitanteComunidad || '—' }}
                </div>
              </td>

              <!-- Cantidad / Precio / Subtotal -->
              <td class="px-4 text-right tabular-nums font-medium text-gray-900">{{ p.cantidad }}</td>
              <td class="px-4 text-right tabular-nums text-gray-500">${{ precio(p.producto).toFixed(2) }}</td>
              <td class="px-4 text-right tabular-nums font-bold text-gray-900">${{ (precio(p.producto) * p.cantidad).toFixed(2) }}</td>

              <!-- Fecha -->
              <td class="px-4 whitespace-nowrap text-gray-500">{{ formatFechaCorta(p.fechaISO) }}</td>

              <!-- Estado -->
              <td class="px-4">
                <span :class="estadoChipClasses(p.estado)">{{ p.estado }}</span>
                <div v-if="p.observaciones" class="text-[10px] text-gray-400 mt-1 max-w-[180px] truncate" :title="p.observaciones">
                  {{ p.observaciones }}
                </div>
              </td>

              <!-- Ruta -->
              <td class="px-4">
                <button v-if="p.routeId" class="text-brand font-medium hover:underline decoration-2 underline-offset-2"
                  @click="goVerRuta(p)">
                  {{ rutas.byId(p.routeId)?.nombre ?? 'Ver Ruta' }}
                </button>
                <span v-else class="text-gray-300">—</span>
              </td>

              <!-- Acciones -->
              <td class="px-4">
                <div class="flex flex-wrap gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                   <!-- Pendiente: Asignar -->
                  <button v-if="!p.routeId && p.estado === 'pendiente'" 
                    class="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                    @click="$router.push({ name: 'a.rutas', query: { select: p.id } })">
                    Asignar
                  </button>

                  <!-- En ruta: marcar entregado -->
                  <button v-if="p.estado === 'en_ruta'" 
                    class="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                    @click="marcarEntregado(p.id)">
                    Entregar
                  </button>

                  <!-- Cancelar -->
                  <button v-if="p.estado !== 'entregado' && p.estado !== 'cancelado'"
                    class="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors"
                    @click="cancelarPedido(p.id)">
                    Cancelar
                  </button>
                  
                  <!-- Borrar -->
                  <button v-if="p.estado === 'pendiente' && !p.routeId"
                    class="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-bold text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                    @click="borrarPedido(p.id, p.folio)">
                    Borrar
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="list.length === 0">
              <td colspan="11" class="py-12 text-center text-gray-400">
                <div class="flex flex-col items-center justify-center">
                   <svg class="h-10 w-10 text-gray-200 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                   No se encontraron pedidos con estos filtros.
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <CancellationModal :show="showCancelModal" title="Cancelar pedido"
      message="¿Estás segura? El pedido pasará a estado 'cancelado'. Por favor indica el motivo para el registro."
      @close="showCancelModal = false" @confirm="confirmCancel" />
  </section>
</template>

<style scoped>
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style>