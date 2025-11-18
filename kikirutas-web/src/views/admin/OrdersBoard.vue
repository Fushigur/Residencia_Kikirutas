<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router';
import { usePedidosStore, type Pedido } from '@/stores/pedidos'
import { useRutasStore } from '@/stores/rutas'
import { useProductosStore } from '@/stores/productos'
import { formatFechaCorta } from '@/utils/dateFormat' 

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

function cancelarPedido(id: string) {
  const reason = prompt('Motivo de cancelación (opcional):') || ''
  const p = pedidos.byId(id)
  if (p && reason) {
    const tag = `Cancelado: ${reason}`
    p.observaciones = p.observaciones ? `${p.observaciones} | ${tag}` : tag
    pedidos.persist()
  }
  pedidos.setEstado(id, 'cancelado')
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
    'px-2 py-1 rounded text-xs font-medium border': true,
    'bg-amber-500/15 text-amber-300 border-amber-500/30': e === 'pendiente',
    'bg-blue-500/15 text-blue-300 border-blue-500/30': e === 'en_ruta',
    'bg-emerald-500/15 text-emerald-300 border-emerald-500/30': e === 'entregado',
    'bg-rose-500/15 text-rose-300 border-rose-500/30': e === 'cancelado',
  }
}
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-semibold">Pedidos</h1>

    <!-- Filtros -->
    <div class="rounded-xl bg-white/5 border border-white/10 p-4">
      <div class="grid md:grid-cols-5 gap-3">
        <div class="md:col-span-2">
          <label class="block text-sm mb-1">Buscar</label>
          <input
            v-model="q"
            type="text"
            class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2"
            placeholder="Folio, producto, solicitante, comunidad o ruta…"
          />
        </div>

        <div>
          <label class="block text-sm mb-1">Estado</label>
          <select v-model="estado" class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2">
            <option value="todos">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_ruta">En ruta</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div>
          <label class="block text-sm mb-1">Desde</label>
          <input v-model="fechaIni" type="date" class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2" />
        </div>

        <div>
          <label class="block text-sm mb-1">Hasta</label>
          <input v-model="fechaFin" type="date" class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2" />
        </div>
      </div>
    </div>

    <!-- Tabla -->
    <div class="rounded-xl bg-white/5 border border-white/10 p-0 overflow-x-auto">
      <!-- ancho mínimo para que no se achoche -->
      <table class="w-full min-w-[1150px] table-fixed text-sm">
        <thead
          class="sticky top-0 z-10 bg-neutral-950/80 backdrop-blur border-b border-white/10 text-white/60">
          <tr>
            <th class="text-left py-3 px-3 w-[90px]">Folio</th>
            <th class="text-left px-3 w-[220px]">Producto</th>
            <th class="text-left px-3 w-[180px]">Solicitante</th>
            <th class="text-left px-3 w-[160px]">Comunidad</th>
            <th class="text-right px-3 w-[80px]">Cant.</th>
            <th class="text-right px-3 w-[110px]">Precio</th>
            <th class="text-right px-3 w-[120px]">Subtotal</th>
            <th class="text-left px-3 w-[120px]">Fecha</th>
            <th class="text-left px-3 w-[110px]">Estado</th>
            <th class="text-left px-3 w-[150px]">Ruta</th>
            <th class="text-left px-3 w-[260px]">Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="p in list"
            :key="p.id"
            class="border-b border-white/10 hover:bg-white/5 transition-colors">
            <!-- Folio -->
            <td class="py-3 px-3 font-medium">{{ p.folio }}</td>

            <!-- Producto (truncate) -->
            <td class="px-3">
              <div class="truncate max-w-[210px]" :title="p.producto">{{ p.producto }}</div>
            </td>

            <!-- Solicitante / Comunidad -->
            <td class="px-3">
              <div class="truncate max-w-[170px]" :title="p.solicitanteNombre || '—'">
                {{ p.solicitanteNombre || '—' }}
              </div>
            </td>
            <td class="px-3">
              <div class="truncate max-w-[150px]" :title="p.solicitanteComunidad || '—'">
                {{ p.solicitanteComunidad || '—' }}
              </div>
            </td>

            <!-- Cantidad / Precio / Subtotal -->
            <td class="px-3 text-right tabular-nums">{{ p.cantidad }}</td>
            <td class="px-3 text-right tabular-nums">${{ precio(p.producto).toFixed(2) }}</td>
            <td class="px-3 text-right tabular-nums">${{ (precio(p.producto) * p.cantidad).toFixed(2) }}</td>

            <!-- Fecha -->
            <td class="px-3 whitespace-nowrap">{{ formatFechaCorta(p.fechaISO) }}</td>

            <!-- Estado -->
            <td class="px-3">
              <span :class="estadoChipClasses(p.estado)">{{ p.estado }}</span>
              <div v-if="p.observaciones" class="text-[11px] text-white/60 mt-1 max-w-[180px] truncate" :title="p.observaciones">
                {{ p.observaciones }}
              </div>
            </td>

            <!-- Ruta (click para ver) -->
            <td class="px-3">
              <button
                v-if="p.routeId"
                class="text-emerald-300 hover:text-emerald-200 underline underline-offset-4"
                @click="goVerRuta(p)">
                {{ rutas.byId(p.routeId)?.nombre ?? 'Ruta' }}
              </button>
              <span v-else>—</span>
            </td>

            <!-- Acciones (mínimas y contextuales) -->
            <td class="px-3">
              <div class="flex flex-wrap gap-2">
                <!-- Pendiente: Asignar (navega a /admin/rutas) -->
                <!-- antes abría el panel inline; ahora navega a Rutas con query -->
                <button
                  class="btn-ghost mt-2 hover:bg-blue-500/20 rounded bg-blue-600 px-3 py-1 text-white"
                  @click="$router.push({ name:'a.rutas', query:{ select: p.id } })">
                  Asignar ruta
                </button>

                <!-- En ruta: marcar entregado -->
                <button
                  v-if="p.estado === 'en_ruta'"
                  class="rounded bg-emerald-600 px-3 py-1 hover:bg-emerald-500">
                  <span @click="marcarEntregado(p.id)">Marcar entregado</span>
                </button>

                <!-- Cancelar si no está entregado -->
                <button
                  v-if="p.estado !== 'entregado' && p.estado !== 'cancelado'"
                  class="inline-flex items-center rounded bg-amber-500 px-3 py-4 text-xs font-medium text-gray-900 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  @click="cancelarPedido(p.id)"
                >
                  Cancelar
                </button>
                <!-- Borrar: solo pendiente y sin ruta -->
                <button
                  v-if="p.estado === 'pendiente' && !p.routeId"
                  class="rounded bg-rose-700 px-3 py-1 hover:bg-rose-600"
                  @click="borrarPedido(p.id, p.folio)">
                  Borrar
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="list.length === 0">
            <td colspan="11" class="py-8 text-center text-white/60">No hay pedidos con esos filtros.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
/* Para números alineados bonitos */
.tabular-nums { font-variant-numeric: tabular-nums; }
</style>