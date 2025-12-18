<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { usePedidosStore } from '@/stores/pedidos'
import { useRutasStore } from '@/stores/rutas'
import { useProductosStore } from '@/stores/productos'
import { formatFechaCorta, formatFechaLarga } from '@/utils/dateFormat'

const pedidos = usePedidosStore()
const rutas = useRutasStore()
const productos = useProductosStore()

onMounted(() => {
  pedidos.load()
  rutas.load()
  productos.load()
  productos.seedDefaults()
})

const todayISO = () => {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}
const firstDayOfMonthISO = () => {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-01`
}
const hoy = todayISO()
const iniMes = firstDayOfMonthISO()

function precioDe(nombre: string): number {
  return productos.items.find(x => x.nombre === nombre)?.precio ?? 0
}

/* KPIs */
const kpiPendientes = computed(() => pedidos.items.filter(p => p.estado === 'pendiente').length)
const kpiEnRuta = computed(() => pedidos.items.filter(p => p.estado === 'en_ruta').length)
const kpiEntMes = computed(() =>
  pedidos.items.filter(p => p.estado === 'entregado' && p.fechaISO >= iniMes).length
)
const kpiMontoHoy = computed(() =>
  pedidos.items
    .filter(p => p.fechaISO === hoy)
    .reduce((acc, p) => acc + precioDe(p.producto) * p.cantidad, 0)
)

/* Listas */
const pendientesTop = computed(() =>
  pedidos.items
    .filter(p => p.estado === 'pendiente')
    .sort((a, b) => b.fechaISO.localeCompare(a.fechaISO))
    .slice(0, 8)
)

const rutasHoy = computed(() =>
  rutas.ordenadas.filter(r => r.fechaISO === hoy)
)

/* Resumen del mes por producto */
const mesPorProducto = computed(() => {
  const map = new Map<string, { producto: string; sacos: number; precio: number; subtotal: number }>()
  for (const p of pedidos.items) {
    if (p.fechaISO < iniMes) continue
    const precio = precioDe(p.producto)
    const prev = map.get(p.producto) ?? { producto: p.producto, sacos: 0, precio, subtotal: 0 }
    prev.sacos += p.cantidad
    prev.subtotal = prev.sacos * precio
    map.set(p.producto, prev)
  }
  return Array.from(map.values()).sort((a, b) => a.producto.localeCompare(b.producto))
})
</script>

<template>
  <section class="space-y-8">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Panel de administración</h1>
        <p class="text-gray-500 text-sm mt-1">Resumen operativo y accesos rápidos</p>
      </div>
    </header>

    <!-- KPIs -->
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
        <div class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pedidos pendientes</div>
        <div class="text-3xl font-extrabold text-gray-900">{{ kpiPendientes }}</div>
      </div>
      <div
        class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
        <div class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pedidos en ruta</div>
        <div class="text-3xl font-extrabold text-blue-600">{{ kpiEnRuta }}</div>
      </div>
      <div
        class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
        <div class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Entregados (mes)</div>
        <div class="text-3xl font-extrabold text-emerald-600">{{ kpiEntMes }}</div>
      </div>
      <div
        class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
        <div class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Monto estimado (hoy)</div>
        <div class="text-3xl font-extrabold text-gray-900">${{ kpiMontoHoy.toFixed(2) }}</div>
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">

      <!-- Pedidos pendientes (toma 2 columnas) -->
      <div class="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div class="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 class="font-bold text-gray-900">Pedidos pendientes</h2>
          <RouterLink class="text-sm font-semibold text-brand hover:text-red-800 transition-colors"
            :to="{ name: 'a.pedidos' }">
            Ver todos &rarr;
          </RouterLink>
        </div>

        <div class="overflow-x-auto flex-1 p-0">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th class="text-left py-3 px-4 font-semibold">Producto</th>
                <th class="text-left py-3 px-4 font-semibold">Solicitante</th>
                <th class="text-left py-3 px-4 font-semibold">Lugar</th>
                <th class="text-center py-3 px-4 font-semibold">Cant.</th>
                <th class="text-right py-3 px-4 font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="p in pendientesTop" :key="p.id" class="hover:bg-gray-50 transition-colors">
                <td class="py-3 px-4 text-gray-900 font-medium max-w-[140px] truncate" :title="p.producto">{{ p.producto
                  }}</td>
                <td class="px-4 text-gray-600 max-w-[120px] truncate">{{ p.solicitanteNombre || '—' }}</td>
                <td class="px-4 text-gray-500 max-w-[120px] truncate">{{ p.solicitanteComunidad || '—' }}</td>
                <td class="px-4 text-center font-semibold text-gray-900">{{ p.cantidad }}</td>
                <td class="px-4 text-right">
                  <RouterLink :to="{ name: 'a.rutas', query: { highlight: p.id } }"
                    class="inline-flex items-center justify-center rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors">
                    Asignar
                  </RouterLink>
                </td>
              </tr>
              <tr v-if="!pendientesTop.length">
                <td colspan="5" class="py-10 text-center text-gray-400 font-medium bg-gray-50/30">
                  <p>¡Todo al día! No hay pedidos pendientes.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Rutas de hoy (toma 1 columna) -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
        <div class="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 class="font-bold text-gray-900">Rutas de hoy</h2>
          <RouterLink class="text-sm font-semibold text-brand hover:text-red-800 transition-colors"
            :to="{ name: 'a.rutas' }">
            Gestionar &rarr;
          </RouterLink>
        </div>

        <div class="p-4 overflow-y-auto space-y-3">
          <div v-if="rutasHoy.length" v-for="r in rutasHoy" :key="r.id"
            class="group relative rounded-xl border border-gray-200 bg-white p-4 hover:border-brand/30 hover:shadow-sm transition-all">
            <div class="flex items-center justify-between mb-2">
              <span class="font-bold text-gray-900">{{ r.nombre }}</span>
              <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide"
                :class="r.estado === 'en_ruta' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'">
                {{ r.estado }}
              </span>
            </div>
            <p class="text-gray-500 text-xs flex gap-2">
              <span>{{ r.pedidos.length }} pedidos</span> •
              <span>{{ formatFechaCorta(r.fechaISO) }}</span>
            </p>
          </div>
          <div v-else class="h-full flex flex-col items-center justify-center text-center py-10 text-gray-400">
            <div class="bg-gray-50 p-3 rounded-full mb-3">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-1.447-.894L15 7m0 13V7m0 0L9 4" />
              </svg>
            </div>
            <p class="text-sm font-medium">No hay rutas hoy</p>
          </div>
        </div>
      </div>

    </div>

    <!-- Resumen del mes -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="p-5 border-b border-gray-100">
        <h2 class="font-bold text-gray-900">Resumen mensual por producto</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
            <tr>
              <th class="text-left py-3 px-5">Producto</th>
              <th class="text-left py-3 px-5">Sacos Vendidos</th>
              <th class="text-left py-3 px-5">Precio Unitario</th>
              <th class="text-right py-3 px-5">Subtotal Generado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="row in mesPorProducto" :key="row.producto">
              <td class="py-3 px-5 font-medium text-gray-900">{{ row.producto }}</td>
              <td class="py-3 px-5 text-gray-600">{{ row.sacos }}</td>
              <td class="py-3 px-5 text-gray-600">${{ row.precio.toFixed(2) }}</td>
              <td class="py-3 px-5 text-right font-bold text-gray-900">${{ row.subtotal.toFixed(2) }}</td>
            </tr>
            <tr v-if="!mesPorProducto.length">
              <td colspan="4" class="py-10 text-center text-gray-400">Sin movimientos este mes.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
