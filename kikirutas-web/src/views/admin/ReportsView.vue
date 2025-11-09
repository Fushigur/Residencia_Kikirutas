<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { usePedidosStore } from '@/stores/pedidos';
import { useProductosStore } from '@/stores/productos';

const pedidos = usePedidosStore();
const productos = useProductosStore();

onMounted(() => {
  pedidos.load();
  productos.load();
  productos.seedDefaults();
});

// KPIs
const totalPendientes  = computed(() => pedidos.items.filter(p => p.estado === 'pendiente').length);
const totalEnRuta      = computed(() => pedidos.items.filter(p => p.estado === 'en_ruta').length);
const totalEntregados  = computed(() => pedidos.items.filter(p => p.estado === 'entregado').length);
const totalCancelados  = computed(() => pedidos.items.filter(p => p.estado === 'cancelado').length);

// Ingreso estimado (solo entregados) = sum(cantidad * precio producto)
const ingresoEstimado = computed(() => {
  let sum = 0;
  for (const p of pedidos.items) {
    if (p.estado !== 'entregado') continue;
    const prod = productos.items.find(x => x.nombre === p.producto);
    const precio = prod?.precio ?? 0;
    sum += (precio * p.cantidad);
  }
  return sum;
});

// Tabla "últimos pedidos"
const ultimos = computed(() => [...pedidos.items].slice(0, 8));

function etiquetaEstado(e: string) {
  return e === 'pendiente' ? 'Pendiente'
    : e === 'en_ruta' ? 'En ruta'
    : e === 'entregado' ? 'Entregado'
    : 'Cancelado';
}
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-semibold">Resumen</h1>

    <!-- KPIs -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div class="kpi">
        <div class="lbl">Pendientes</div>
        <div class="val">{{ totalPendientes }}</div>
      </div>
      <div class="kpi">
        <div class="lbl">En ruta</div>
        <div class="val">{{ totalEnRuta }}</div>
      </div>
      <div class="kpi">
        <div class="lbl">Entregados</div>
        <div class="val">{{ totalEntregados }}</div>
      </div>
      <div class="kpi">
        <div class="lbl">Cancelados</div>
        <div class="val">{{ totalCancelados }}</div>
      </div>
      <div class="kpi">
        <div class="lbl">Ingreso estimado</div>
        <div class="val">${{ ingresoEstimado.toFixed(2) }}</div>
      </div>
    </div>

    <!-- Últimos pedidos -->
    <div class="rounded-xl bg-white/5 border border-white/10 p-4 overflow-x-auto">
      <h3 class="font-semibold mb-3">Últimos pedidos</h3>

      <table class="w-full text-sm" v-if="ultimos.length">
        <thead>
          <tr class="text-white/60">
            <th class="text-left py-2">Folio</th>
            <th class="text-left">Producto</th>
            <th class="text-left">Cantidad</th>
            <th class="text-left">Fecha</th>
            <th class="text-left">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in ultimos" :key="p.id" class="border-t border-white/10">
            <td class="py-2">{{ p.folio }}</td>
            <td>{{ p.producto }}</td>
            <td>{{ p.cantidad }}</td>
            <td>{{ p.fechaISO }}</td>
            <td>
              <span
                class="px-2 py-1 rounded text-xs font-medium"
                :class="{
                  'bg-amber-500/15 text-amber-300 border border-amber-500/30': p.estado === 'pendiente',
                  'bg-blue-500/15 text-blue-300 border border-blue-500/30': p.estado === 'en_ruta',
                  'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30': p.estado === 'entregado',
                  'bg-rose-500/15 text-rose-300 border border-rose-500/30': p.estado === 'cancelado',
                }"
              >
                {{ etiquetaEstado(p.estado) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-else class="text-white/70 text-sm mt-3">Sin pedidos.</p>
    </div>
  </section>
</template>

<style scoped>
.kpi{
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 1rem;
  padding: .9rem;
}
.kpi .lbl{ font-size: .8rem; color: rgba(255,255,255,.75); }
.kpi .val{ font-size: 1.3rem; font-weight: 700; }
</style>
