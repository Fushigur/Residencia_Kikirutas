<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { usePedidosStore } from '@/stores/pedidos'
import { useRutasStore } from '@/stores/rutas'
import { useProductosStore } from '@/stores/productos'

const pedidos = usePedidosStore()
const rutas = useRutasStore()
const productos = useProductosStore()

onMounted(() => {
  pedidos.load()
  rutas.load()
  productos.load()
  productos.seedDefaults()
})

function todayISO() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}
function firstDayOfMonthISO(d = new Date()) {
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
const kpiEnRuta     = computed(() => pedidos.items.filter(p => p.estado === 'en_ruta').length)
const kpiEntMes     = computed(() =>
  pedidos.items.filter(p => p.estado === 'entregado' && p.fechaISO >= iniMes).length
)
const kpiMontoHoy   = computed(() =>
  pedidos.items
    .filter(p => p.fechaISO === hoy)
    .reduce((acc, p) => acc + precioDe(p.producto) * p.cantidad, 0)
)

/* Listas “operativas” */
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
  <section class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">Panel de administración</h1>
        <p class="text-white/60 text-sm">Resumen operativo y accesos rápidos</p>
      </div>

    </header>

    <!-- KPIs -->
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="rounded-xl bg-white/5 border border-white/10 p-4">
        <div class="text-xs text-white/60">Pedidos pendientes</div>
        <div class="text-2xl font-semibold mt-1">{{ kpiPendientes }}</div>
      </div>
      <div class="rounded-xl bg-white/5 border border-white/10 p-4">
        <div class="text-xs text-white/60">Pedidos en ruta</div>
        <div class="text-2xl font-semibold mt-1">{{ kpiEnRuta }}</div>
      </div>
      <div class="rounded-xl bg-white/5 border border-white/10 p-4">
        <div class="text-xs text-white/60">Entregados (mes)</div>
        <div class="text-2xl font-semibold mt-1">{{ kpiEntMes }}</div>
      </div>
      <div class="rounded-xl bg-white/5 border border-white/10 p-4">
        <div class="text-xs text-white/60">Monto estimado (hoy)</div>
        <div class="text-2xl font-semibold mt-1">${{ kpiMontoHoy.toFixed(2) }}</div>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-4">
      <!-- Pedidos pendientes -->
      <div class="rounded-xl bg-white/5 border border-white/10 p-4 overflow-x-auto">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-lg font-semibold">Pedidos pendientes</h2>
          <RouterLink class="text-sm text-emerald-300 hover:underline" :to="{ name:'a.pedidos' }">Ver todos</RouterLink>
        </div>
        <table class="w-full text-sm min-w-[800px]">
          <thead class="text-white/60">
            <tr>
              <th class="text-left py-2 px-2">Folio</th>
              <th class="text-left px-2">Producto</th>
              <th class="text-left px-2">Solicitante</th>
              <th class="text-left px-2">Comunidad</th>
              <th class="text-left px-2">Cant.</th>
              <th class="text-left px-2">Fecha</th>
              <th class="text-left px-2">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in pendientesTop" :key="p.id" class="border-t border-white/10">
              <td class="py-2 px-2 font-medium">{{ p.folio }}</td>
              <td class="px-2"><div class="truncate max-w-[200px]" :title="p.producto">{{ p.producto }}</div></td>
              <td class="px-2"><div class="truncate max-w-[180px]" :title="p.solicitanteNombre || '—'"> {{ p.solicitanteNombre || '—' }}</div></td>
              <td class="px-2"><div class="truncate max-w-[160px]" :title="p.solicitanteComunidad || '—'">{{ p.solicitanteComunidad || '—' }}</div></td>
              <td class="px-2">{{ p.cantidad }}</td>
              <td class="px-2 whitespace-nowrap">{{ p.fechaISO }}</td>
              <td class="px-2">
                <RouterLink
                  :to="{ name:'a.rutas', query:{ highlight: p.id } }"
                  class="inline-flex items-center rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500"
                >
                  Asignar ruta
                </RouterLink>
              </td>
            </tr>
            <tr v-if="!pendientesTop.length">
              <td colspan="7" class="py-8 text-center text-white/60">No hay pendientes.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Rutas de hoy -->
      <div class="rounded-xl bg-white/5 border border-white/10 p-4">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-lg font-semibold">Rutas de hoy</h2>
          <RouterLink class="text-sm text-emerald-300 hover:underline" :to="{ name:'a.rutas' }">Ver rutas</RouterLink>
        </div>
        <div v-if="rutasHoy.length" class="space-y-2">
          <article v-for="r in rutasHoy" :key="r.id" class="rounded border border-white/10 bg-white/5 p-3">
            <div class="flex items-center justify-between">
              <div class="font-medium">{{ r.nombre }}</div>
              <div class="text-xs text-white/60">{{ r.fechaISO }}</div>
            </div>
            <div class="text-sm mt-1">Pedidos: <b>{{ r.pedidos.length }}</b></div>
            <div class="text-xs text-white/60">Estado: {{ r.estado }}</div>
          </article>
        </div>
        <p v-else class="text-white/70 text-sm">No hay rutas programadas para hoy.</p>
      </div>
    </div>

    <!-- Resumen del mes por producto -->
    <div class="rounded-xl bg-white/5 border border-white/10 p-4 overflow-x-auto">
      <h2 class="text-lg font-semibold mb-2">Resumen del mes por producto</h2>
      <table class="w-full text-sm min-w-[700px]">
        <thead class="text-white/60">
          <tr>
            <th class="text-left py-2 px-2">Producto</th>
            <th class="text-left px-2">Sacos</th>
            <th class="text-left px-2">Precio</th>
            <th class="text-left px-2">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in mesPorProducto" :key="row.producto" class="border-t border-white/10">
            <td class="py-2 px-2">{{ row.producto }}</td>
            <td class="px-2">{{ row.sacos }}</td>
            <td class="px-2">${{ row.precio.toFixed(2) }}</td>
            <td class="px-2">${{ row.subtotal.toFixed(2) }}</td>
          </tr>
          <tr v-if="!mesPorProducto.length">
            <td colspan="4" class="py-8 text-center text-white/60">Sin datos del mes.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
