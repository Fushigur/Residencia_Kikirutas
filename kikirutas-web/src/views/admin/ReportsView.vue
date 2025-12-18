<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { usePedidosStore } from '@/stores/pedidos';
import { useProductosStore } from '@/stores/productos';
import { useRutasStore } from '@/stores/rutas';
import { formatFechaLarga, formatFechaCorta } from '@/utils/dateFormat'
import logoUrl from '@/assets/img/Logo.png'


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
/* -----------------------
   Exportar/Imprimir
------------------------*/
function exportCsv() {
  const header = ['Folio', 'Producto', 'Cantidad', 'Precio', 'Subtotal', 'Fecha', 'Estado', 'Ruta', 'Solicitante', 'Comunidad', 'Municipio'];
  const rows = pedidosFiltrados.value.map(p => {
    const prc = precio(p.producto);
    const sub = prc * p.cantidad;
    const ruta = p.routeId ? (rutas.byId(p.routeId)?.nombre ?? '') : '';
    return [
      p.folio,
      p.producto,
      String(p.cantidad),
      prc.toFixed(2),
      sub.toFixed(2),
      formatFechaCorta(p.fechaISO),
      p.estado,
      ruta,
      p.solicitanteNombre || '',
      p.solicitanteComunidad || '',
      p.solicitanteMunicipio || ''
    ];
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
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Inter', sans-serif; padding: 40px; color: #1f2937; -webkit-print-color-adjust: exact; }
      
      /* Header */
      .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; }
      .brand { display: flex; align-items: center; gap: 12px; }
      .brand img { height: 48px; width: auto; }
      .brand-text h1 { font-size: 24px; font-weight: 800; color: #7F1D1D; margin: 0; line-height: 1.2; }
      .brand-text p { font-size: 12px; font-weight: 600; color: #9CA3AF; letter-spacing: 0.05em; text-transform: uppercase; margin: 0; }
      
      .meta { text-align: right; }
      .meta h2 { font-size: 20px; font-weight: 700; margin: 0 0 4px; color: #111; }
      .meta p { font-size: 14px; color: #6B7280; margin: 0; }

      /* Summary Cards */
      .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
      .card { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; }
      .card-label { font-size: 11px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
      .card-value { font-size: 20px; font-weight: 700; color: #111; }
      .card-value small { font-size: 12px; color: #9CA3AF; font-weight: 500; }

      /* Table */
      h3 { font-size: 16px; font-weight: 700; color: #111; margin-bottom: 16px; margin-top: 0; }
      table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 11px; }
      th { background-color: #F3F4F6; color: #374151; font-weight: 600; text-align: left; padding: 10px 12px; border-top: 1px solid #E5E7EB; border-bottom: 1px solid #E5E7EB; white-space: nowrap; }
      th:first-child { border-top-left-radius: 8px; border-bottom-left-radius: 8px; border-left: 1px solid #E5E7EB; }
      th:last-child { border-top-right-radius: 8px; border-bottom-right-radius: 8px; border-right: 1px solid #E5E7EB; }
      
      td { padding: 10px 12px; border-bottom: 1px solid #F3F4F6; color: #4B5563; vertical-align: top; }
      tr:last-child td { border-bottom: none; }
      
      .product { font-weight: 600; color: #111; }
      .folio { font-family: monospace; font-weight: 600; color: #6B7280; background: #F3F4F6; padding: 2px 6px; border-radius: 4px; }
      .status { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 700; text-transform: uppercase; border: 1px solid transparent; }
      .status-pendiente { background: #FFFBEB; color: #B45309; border-color: #FDE68A; }
      .status-en_ruta { background: #EFF6FF; color: #1D4ED8; border-color: #BFDBFE; }
      .status-entregado { background: #ECFDF5; color: #047857; border-color: #A7F3D0; }

      .user-info div { margin-bottom: 2px; }
      .user-name { font-weight: 600; color: #111; }
      .location { font-size: 10px; }
      
      .text-right { text-align: right; }
      .text-center { text-align: center; }

      /* Footer */
      .footer { margin-top: 40px; pt-4; border-top: 2px solid #f3f4f6; display: flex; justify-content: space-between; font-size: 10px; color: #9CA3AF; }
    </style>
  `;

  const rows = pedidosFiltrados.value.map(p => {
    const prc = precio(p.producto);
    const sub = prc * p.cantidad;
    const ruta = p.routeId ? (rutas.byId(p.routeId)?.nombre ?? '') : '';
    return `<tr>
      <td><span class="folio">${p.folio}</span></td>
      <td>
        <div class="product">${p.producto}</div>
      </td>
      <td class="text-right" style="font-weight: 600;">${p.cantidad}</td>
      <td class="text-right">$${prc.toFixed(2)}</td>
      <td class="text-right" style="font-weight: 700; color: #111;">$${sub.toFixed(2)}</td>
      <td>${formatFechaCorta(p.fechaISO)}</td>
      <td class="text-center">
         <span class="status status-${p.estado}">${p.estado}</span>
      </td>
      <td>${ruta}</td>
      <td>
        <div class="user-info">
            <div class="user-name">${p.solicitanteNombre || '—'}</div>
            <div class="location">📍 ${p.solicitanteComunidad || '—'}</div>
            <div class="location" style="color: #9CA3AF">${p.solicitanteMunicipio || ''}</div>
        </div>
      </td>
    </tr>`;
  }).join('');

  const body = `
    <div class="header">
        <div class="brand">
            <img src="${window.location.origin}${logoUrl}" />
            <div class="brand-text">
                <h1>KikiRutas</h1>
                <p>Reporte Financiero</p>
            </div>
        </div>
        <div class="meta">
            <h2>Resumen General</h2>
            <p>${formatFechaLarga(fechaIni.value)} — ${formatFechaLarga(fechaFin.value)}</p>
        </div>
    </div>

    <div class="summary">
        <div class="card">
            <div class="card-label">Pedidos</div>
            <div class="card-value">${totalPedidos.value}</div>
        </div>
        <div class="card">
            <div class="card-label">Total Sacos</div>
            <div class="card-value">${totalSacos.value}</div>
        </div>
        <div class="card">
            <div class="card-label">Ingresos Est.</div>
            <div class="card-value">$${ingresosTotales.value.toFixed(2)}</div>
        </div>
        <div class="card">
            <div class="card-label">Ingresos Reales</div>
            <div class="card-value" style="color: #059669;">$${ingresosEntregados.value.toFixed(2)}</div>
        </div>
    </div>

    <h3>Detalle de Pedidos</h3>
    <table>
      <thead>
        <tr>
          <th>Folio</th><th>Producto</th><th class="text-right">Cant</th>
          <th class="text-right">Precio</th><th class="text-right">Subtotal</th><th>Fecha</th><th class="text-center">Estado</th><th>Ruta</th>
          <th>Destinatario</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
        <div>Generado el: ${new Date().toLocaleString()}</div>
        <div>Reporte Administrativo - Uso Interno</div>
    </div>
  `;

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<html><head><title>Reporte Financiero</title>${head}</head><body>${body}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 500);
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
  <section class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Reportes Financieros</h1>
        <p class="text-gray-500 text-sm mt-1">Análisis de ventas, inventario y rendimiento.</p>
      </div>
    </div>

    <!-- Filtros -->
    <div class="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
      <div class="flex flex-col md:flex-row md:items-end gap-4">
        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Fecha inicio</label>
          <input v-model="fechaIni" type="date" @click="($event.target as HTMLInputElement).showPicker()"
            class="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all cursor-pointer" />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Fecha fin</label>
          <input v-model="fechaFin" type="date" @click="($event.target as HTMLInputElement).showPicker()"
            class="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all cursor-pointer" />
        </div>

        <div class="md:ml-auto flex gap-3">
          <button
            class="inline-flex items-center gap-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 transition-colors"
            @click="printReport">
            <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir
          </button>
          <button
            class="inline-flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2.5 shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5"
            @click="exportCsv">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar CSV
          </button>
        </div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
        <dt class="text-sm font-medium text-gray-500 mb-1">Pedidos Totales</dt>
        <dd class="text-3xl font-bold text-gray-900">{{ totalPedidos }}</dd>
      </div>
      <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
        <dt class="text-sm font-medium text-gray-500 mb-1">Sacos Vendidos</dt>
        <dd class="text-3xl font-bold text-blue-600">{{ totalSacos }}</dd>
      </div>
      <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
        <dt class="text-sm font-medium text-gray-500 mb-1">Ingresos Estimados</dt>
        <dd class="text-3xl font-bold text-gray-900">${{ ingresosTotales.toFixed(2) }}</dd>
      </div>
      <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
        <dt class="text-sm font-medium text-gray-500 mb-1">Ingresos Reales (Entregados)</dt>
        <dd class="text-3xl font-bold text-emerald-600">${{ ingresosEntregados.toFixed(2) }}</dd>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Desglose por estado -->
      <div class="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 h-full">
        <h3 class="font-bold text-gray-900 mb-4">Pedidos por estado</h3>
        <div v-if="estadoCount.length" class="space-y-3">
          <div v-for="e in estadoCount" :key="e.estado"
            class="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div class="flex items-center gap-3">
              <span class="w-3 h-3 rounded-full" :class="{
                'bg-amber-400': e.estado === 'pendiente',
                'bg-blue-500': e.estado === 'en_ruta',
                'bg-emerald-500': e.estado === 'entregado',
                'bg-red-500': e.estado === 'cancelado'
              }"></span>
              <span class="font-medium text-gray-700 capitalize">{{ estadoEtiqueta(e.estado) }}</span>
            </div>
            <span class="font-bold text-gray-900 text-lg">{{ e.count }}</span>
          </div>
        </div>
        <p v-else class="text-center py-10 text-gray-400 text-sm">Sin datos en el rango seleccionado.</p>
      </div>

      <!-- Desglose por producto -->
      <div class="rounded-2xl bg-white border border-gray-100 shadow-sm p-0 overflow-hidden h-full flex flex-col">
        <div class="p-5 border-b border-gray-100">
          <h3 class="font-bold text-gray-900">Ventas por Producto</h3>
        </div>
        <div v-if="porProducto.length" class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
              <tr>
                <th class="pl-5 py-3 text-left">Producto</th>
                <th class="px-4 text-right">Sacos</th>
                <th class="px-4 text-right">Precio</th>
                <th class="pr-5 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="row in porProducto" :key="row.producto" class="hover:bg-gray-50">
                <td class="pl-5 py-3 font-medium text-gray-900">{{ row.producto }}</td>
                <td class="px-4 text-right text-gray-600">{{ row.sacos }}</td>
                <td class="px-4 text-right text-gray-600">${{ row.precio.toFixed(2) }}</td>
                <td class="pr-5 py-3 text-right font-bold text-gray-900">${{ row.subtotal.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-center py-10 text-gray-400 text-sm">Sin datos en el rango seleccionado.</p>
      </div>
    </div>

    <!-- Tabla de pedidos confirmados -->
    <div class="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      <div class="p-5 border-b border-gray-100 flex items-center justify-between">
        <h3 class="font-bold text-gray-900">
          Detalle de Pedidos <span class="text-gray-400 text-sm font-normal ml-1">({{ pedidosFiltrados.length }})</span>
        </h3>
      </div>

      <div v-if="pedidosFiltrados.length" class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
            <tr>
              <th class="pl-5 py-3 text-left">Folio</th>
              <th class="px-4">Producto</th>
              <th class="px-4">Solicitante</th>
              <th class="px-4">Ubicación</th>
              <th class="px-4 text-right">Cant</th>
              <th class="px-4 text-right">Subtotal</th>
              <th class="px-4">Fecha</th>
              <th class="px-4 text-center">Estado</th>
              <th class="pr-5 py-3 text-left">Ruta</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="p in pedidosFiltrados" :key="p.id" class="hover:bg-gray-50">
              <td class="pl-5 py-3 font-bold text-gray-900 text-xs">{{ p.folio }}</td>
              <td class="px-4 text-gray-600 truncate max-w-[150px]" :title="p.producto">{{ p.producto }}</td>
              <td class="px-4">
                <div class="text-gray-900 font-medium text-xs">{{ p.solicitanteNombre || '—' }}</div>
              </td>
              <td class="px-4">
                <div class="text-gray-700 text-xs">{{ p.solicitanteComunidad || '—' }}</div>
                <div class="text-gray-400 text-[10px]">{{ p.solicitanteMunicipio || '—' }}</div>
              </td>
              <td class="px-4 text-right font-medium text-gray-700">{{ p.cantidad }}</td>
              <td class="px-4 text-right text-gray-600 font-medium text-xs">${{ (precio(p.producto) *
                p.cantidad).toFixed(2) }}</td>
              <td class="px-4 text-gray-500 text-xs">{{ p.fechaISO }}</td>
              <td class="px-4 text-center">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase" :class="{
                  'bg-amber-50 text-amber-700 border-amber-200': p.estado === 'pendiente',
                  'bg-blue-50 text-blue-700 border-blue-200': p.estado === 'en_ruta',
                  'bg-emerald-50 text-emerald-700 border-emerald-200': p.estado === 'entregado',
                  'bg-red-50 text-red-700 border-red-200': p.estado === 'cancelado'
                }">
                  {{ estadoEtiqueta(p.estado) }}
                </span>
              </td>
              <td class="pr-5 py-3 text-gray-500 text-xs truncate max-w-[120px]">
                {{ p.routeId ? (rutas.byId(p.routeId)?.nombre ?? 'Ruta #' + p.routeId) : '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="text-center py-12 text-gray-400">Sin pedidos en el rango.</p>
    </div>

    <!-- Rutas en rango -->
    <div class="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
      <h3 class="font-bold text-gray-900 mb-4">Rutas en el periodo ({{ rutasEnRango.length }})</h3>
      <div v-if="rutasEnRango.length" class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div v-for="r in rutasEnRango" :key="r.id"
          class="rounded-xl border border-gray-100 bg-gray-50 p-4 hover:shadow-md transition-shadow">
          <div class="font-bold text-gray-900 mb-1 truncate" :title="r.nombre">{{ r.nombre }}</div>
          <div class="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {{ formatFechaLarga(r.fechaISO) }}
          </div>
          <div class="flex items-center justify-between mt-3">
            <span class="text-xs font-medium bg-white border border-gray-200 px-2 py-1 rounded text-gray-600">{{
              r.pedidos.length }} pedidos</span>
            <span class="text-[10px] font-bold uppercase tracking-wide"
              :class="r.estado === 'planificada' ? 'text-amber-600' : (r.estado === 'en_ruta' ? 'text-blue-600' : 'text-emerald-600')">
              {{ r.estado }}
            </span>
          </div>
        </div>
      </div>
      <p v-else class="text-gray-400 text-sm italic">No hay rutas registradas en este rango de fechas.</p>
    </div>
  </section>
</template>
