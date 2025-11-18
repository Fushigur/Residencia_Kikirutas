<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { usePedidosStore } from '@/stores/pedidos';
import { useProductosStore } from '@/stores/productos';
import { useRutasStore } from '@/stores/rutas';
import { formatFechaLarga } from '@/utils/dateFormat'


const pedidos = usePedidosStore();
const productos = useProductosStore();
const rutas = useRutasStore();

onMounted(() => {
  pedidos.load();
  productos.load();
  productos.seedDefaults();
  rutas.load();
});

/* -----------------------
   Filtros por fecha
------------------------*/
function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function firstDayOfMonthISO(d = new Date()) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-01`;
}
const fechaIni = ref(firstDayOfMonthISO());
const fechaFin = ref(todayISO());

function toDate(iso: string) {
  // Normaliza a medianoche local para comparar por fechas (no horas)
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
function inRange(iso: string, ini: string, fin: string) {
  const x = toDate(iso).getTime();
  return x >= toDate(ini).getTime() && x <= toDate(fin).getTime();
}

/* -----------------------
   Pedidos filtrados
------------------------*/
const pedidosFiltrados = computed(() =>
  pedidos.ordenados.filter(p => inRange(p.fechaISO, fechaIni.value, fechaFin.value))
);

/* -----------------------
   KPIs
------------------------*/
const totalPedidos = computed(() => pedidosFiltrados.value.length);
const totalSacos = computed(() =>
  pedidosFiltrados.value.reduce((acc, p) => acc + (p.cantidad || 0), 0)
);

// precio por nombre
function precio(nombre: string): number {
  return productos.items.find(x => x.nombre === nombre)?.precio ?? 0;
}

// ingresos estimados (por estado o total)
const ingresosTotales = computed(() =>
  pedidosFiltrados.value.reduce((acc, p) => acc + precio(p.producto) * p.cantidad, 0)
);
const ingresosEntregados = computed(() =>
  pedidosFiltrados.value
    .filter(p => p.estado === 'entregado')
    .reduce((acc, p) => acc + precio(p.producto) * p.cantidad, 0)
);

// Conteo por estado
const estadoCount = computed(() => {
  const map = new Map<string, number>();
  for (const p of pedidosFiltrados.value) {
    map.set(p.estado, (map.get(p.estado) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([estado, count]) => ({ estado, count }))
    .sort((a, b) => a.estado.localeCompare(b.estado));
});

// Desglose por producto
const porProducto = computed(() => {
  const map = new Map<string, { producto: string; sacos: number; precio: number; subtotal: number }>();
  for (const p of pedidosFiltrados.value) {
    const prc = precio(p.producto);
    const prev = map.get(p.producto) ?? { producto: p.producto, sacos: 0, precio: prc, subtotal: 0 };
    prev.sacos += p.cantidad;
    prev.subtotal = prev.sacos * prc;
    map.set(p.producto, prev);
  }
  return Array.from(map.values()).sort((a, b) => a.producto.localeCompare(b.producto));
});

// Rutas en rango
const rutasEnRango = computed(() =>
  rutas.ordenadas.filter(r => inRange(r.fechaISO, fechaIni.value, fechaFin.value))
);

/* -----------------------
   Exportar/Imprimir
------------------------*/
function exportCsv() {
  const header = ['Folio','Producto','Cantidad','Precio','Subtotal','Fecha','Estado','Ruta'];
  const rows = pedidosFiltrados.value.map(p => {
    const prc = precio(p.producto);
    const sub = prc * p.cantidad;
    const ruta = p.routeId ? (rutas.byId(p.routeId)?.nombre ?? '') : '';
    return [p.folio, p.producto, String(p.cantidad), prc.toFixed(2), sub.toFixed(2), p.fechaISO, p.estado, ruta];
  });

  const csv = '\uFEFF' + [header, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte_${fechaIni.value}_${fechaFin.value}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function printReport() {
  const head = `
    <style>
      body { font-family: Arial, sans-serif; padding: 16px; }
      h1,h2 { margin: 0 0 10px 0; }
      .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 8px 0 16px; }
      .card { border: 1px solid #999; padding: 8px; border-radius: 6px; font-size: 13px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border: 1px solid #999; padding: 6px 8px; text-align: left; font-size: 12px; }
      th { background: #eee; }
    </style>
  `;
  const kpi = `
    <div class="kpis">
      <div class="card"><b>Pedidos:</b> ${totalPedidos.value}</div>
      <div class="card"><b>Sacos:</b> ${totalSacos.value}</div>
      <div class="card"><b>Ingresos estimados:</b> $${ingresosTotales.value.toFixed(2)}</div>
      <div class="card"><b>Ingresos entregados:</b> $${ingresosEntregados.value.toFixed(2)}</div>
    </div>
  `;

  const rows = pedidosFiltrados.value.map(p => {
    const prc = precio(p.producto);
    const sub = prc * p.cantidad;
    const ruta = p.routeId ? (rutas.byId(p.routeId)?.nombre ?? '') : '';
    return `<tr>
      <td>${p.folio}</td>
      <td>${p.producto}</td>
      <td>${p.cantidad}</td>
      <td>$${prc.toFixed(2)}</td>
      <td>$${sub.toFixed(2)}</td>
      <td>${p.fechaISO}</td>
      <td>${p.estado}</td>
      <td>${ruta}</td>
    </tr>`;
  }).join('');

  const body = `
    <h1>Reporte ${fechaIni.value} a ${fechaFin.value}</h1>
    ${kpi}
    <h2>Detalle de pedidos</h2>
    <table>
      <thead>
        <tr>
          <th>Folio</th><th>Producto</th><th>Cantidad</th>
          <th>Precio</th><th>Subtotal</th><th>Fecha</th><th>Estado</th><th>Ruta</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<html><head><title>Reporte</title>${head}</head><body>${body}</body></html>`);
  w.document.close();
  w.focus();
  w.print();
  w.close();
}

/* -----------------------
   Helpers UI
------------------------*/
function estadoEtiqueta(e: string) {
  return e === 'pendiente' ? 'Pendiente'
    : e === 'en_ruta' ? 'En ruta'
    : e === 'entregado' ? 'Entregado'
    : 'Cancelado';
}
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-semibold">Reportes</h1>

    <!-- Filtros -->
    <div class="rounded-xl bg-white/5 border border-white/10 p-4">
      <div class="flex flex-wrap items-end gap-3">
        <div>
          <label class="block text-sm mb-1">Fecha inicio</label>
          <input v-model="fechaIni" type="date" class="rounded bg-neutral-900 border border-white/10 px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm mb-1">Fecha fin</label>
          <input v-model="fechaFin" type="date" class="rounded bg-neutral-900 border border-white/10 px-3 py-2" />
        </div>

        <div class="ml-auto flex gap-2">
          <button class="rounded bg-white/10 px-3 py-2 hover:bg-white/20" @click="printReport">Imprimir</button>
          <button class="rounded bg-emerald-600 px-3 py-2 hover:bg-emerald-500" @click="exportCsv">Exportar CSV</button>
        </div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid md:grid-cols-4 gap-3">
      <div class="rounded-xl bg-white/5 border border-white/10 p-4">
        <div class="text-sm text-white/70">Pedidos</div>
        <div class="text-2xl font-semibold">{{ totalPedidos }}</div>
      </div>
      <div class="rounded-xl bg-white/5 border border-white/10 p-4">
        <div class="text-sm text-white/70">Sacos</div>
        <div class="text-2xl font-semibold">{{ totalSacos }}</div>
      </div>
      <div class="rounded-xl bg-white/5 border border-white/10 p-4">
        <div class="text-sm text-white/70">Ingresos estimados</div>
        <div class="text-2xl font-semibold">${{ ingresosTotales.toFixed(2) }}</div>
      </div>
      <div class="rounded-xl bg-white/5 border border-white/10 p-4">
        <div class="text-sm text-white/70">Ingresos (entregados)</div>
        <div class="text-2xl font-semibold">${{ ingresosEntregados.toFixed(2) }}</div>
      </div>
    </div>

    <!-- Desglose por estado -->
    <div class="rounded-xl bg-white/5 border border-white/10 p-4">
      <h3 class="font-semibold mb-2">Pedidos por estado</h3>
      <div v-if="estadoCount.length" class="flex flex-wrap gap-2">
        <span
          v-for="e in estadoCount" :key="e.estado"
          class="px-3 py-1 rounded border text-sm"
          :class="{
            'bg-amber-500/15 text-amber-300 border-amber-500/30': e.estado === 'pendiente',
            'bg-blue-500/15 text-blue-300 border-blue-500/30': e.estado === 'en_ruta',
            'bg-emerald-500/15 text-emerald-300 border-emerald-500/30': e.estado === 'entregado',
            'bg-rose-500/15 text-rose-300 border-rose-500/30': e.estado === 'cancelado'
          }"
        >
          {{ estadoEtiqueta(e.estado) }}: <b>{{ e.count }}</b>
        </span>
      </div>
      <p v-else class="text-white/70 text-sm">Sin datos en el rango seleccionado.</p>
    </div>

    <!-- Desglose por producto -->
    <div class="rounded-xl bg-white/5 border border-white/10 p-4">
      <h3 class="font-semibold mb-2">Desglose por producto</h3>
      <div v-if="porProducto.length" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-white/60">
              <th class="text-left py-2">Producto</th>
              <th class="text-left">Sacos</th>
              <th class="text-left">Precio</th>
              <th class="text-left">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in porProducto" :key="row.producto" class="border-t border-white/10">
              <td class="py-2">{{ row.producto }}</td>
              <td>{{ row.sacos }}</td>
              <td>${{ row.precio.toFixed(2) }}</td>
              <td>${{ row.subtotal.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="text-white/70 text-sm">Sin datos en el rango seleccionado.</p>
    </div>

    <!-- Tabla de pedidos -->
    <div class="rounded-xl bg-white/5 border border-white/10 p-4">
      <h3 class="font-semibold mb-2">Pedidos ({{ pedidosFiltrados.length }})</h3>
      <div v-if="pedidosFiltrados.length" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-white/60">
              <th class="text-left py-2">Folio</th>
              <th class="text-left">Producto</th>
              <!-- NUEVO -->
              <th class="text-left">Solicitante</th>
              <th class="text-left">Comunidad</th>
              <!-- /NUEVO -->
              <th class="text-left">Cantidad</th>
              <th class="text-left">Precio</th>
              <th class="text-left">Subtotal</th>
              <th class="text-left">Fecha</th>
              <th class="text-left">Estado</th>
              <th class="text-left">Ruta</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in pedidosFiltrados" :key="p.id" class="border-t border-white/10">
              <td class="py-2">{{ p.folio }}</td>
              <td>{{ p.producto }}</td>
              <!-- NUEVO -->
              <td>{{ p.solicitanteNombre || '—' }}</td>
              <td>{{ p.solicitanteComunidad || '—' }}</td>
              <!-- /NUEVO -->
              <td>{{ p.cantidad }}</td>
              <td>${{ precio(p.producto).toFixed(2) }}</td>
              <td>${{ (precio(p.producto) * p.cantidad).toFixed(2) }}</td>
              <td>{{ p.fechaISO }}</td>
              <td>{{ estadoEtiqueta(p.estado) }}</td>
              <td>{{ p.routeId ? (rutas.byId(p.routeId)?.nombre ?? '') : '' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="text-white/70 text-sm">Sin pedidos en el rango.</p>
    </div>

    <!-- Rutas en rango -->
    <div class="rounded-xl bg-white/5 border border-white/10 p-4">
      <h3 class="font-semibold mb-2">Rutas en el periodo ({{ rutasEnRango.length }})</h3>
      <div v-if="rutasEnRango.length" class="grid md:grid-cols-3 gap-3">
        <div v-for="r in rutasEnRango" :key="r.id" class="rounded border border-white/10 bg-white/5 p-3">
          <div class="font-medium">{{ r.nombre }}</div>
          <div class="text-sm text-white/70">{{ formatFechaLarga(r.fechaISO) }}</div>
          <div class="text-sm mt-1">Pedidos: <b>{{ r.pedidos.length }}</b></div>
          <div class="text-xs text-white/60">Estado: {{ r.estado }}</div>
        </div>
      </div>
      <p v-else class="text-white/70 text-sm">No hay rutas en el rango.</p>
    </div>
  </section>
</template>
