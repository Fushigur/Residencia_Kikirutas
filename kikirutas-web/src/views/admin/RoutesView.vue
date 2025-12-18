<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import { useRutasStore } from '@/stores/rutas'
import { usePedidosStore, type Pedido } from '@/stores/pedidos'
import { useProductosStore } from '@/stores/productos'
import { useAlertasStore } from '@/stores/alertas'
import ConfirmationModal from '@/components/ConfirmationModal.vue'
import { formatFechaLarga, formatFechaCorta } from '@/utils/dateFormat'
import logoUrl from '@/assets/img/Logo.png'

type OperadorOption = {
  id: number
  name: string
  comunidad?: string | null
  municipio?: string | null
  estado?: string | null
}

const operadores = ref<OperadorOption[]>([])
const plantillaId = ref<string>('') // Legacy support if needed
const rutas = useRutasStore()
const pedidos = usePedidosStore()
const productos = useProductosStore()
const alertas = useAlertasStore()
const route = useRoute()
const router = useRouter()
const toAssign = ref<string[]>([])

/* ---------- Carga ---------- */
async function loadOperadores() {
  try {
    const res = await api.get('/auth/operators')
    const data = Array.isArray(res.data) ? res.data : (res.data.data ?? [])
    operadores.value = data.map((o: any) => ({
      id: Number(o.id),
      name: String(o.name ?? o.nombre ?? ''),
      comunidad: o.comunidad ?? null,
      municipio: o.municipio ?? null,
      estado: o.estado ?? null,
    }))
  } catch (err) {
    console.error('No se pudieron cargar los operadores', err)
    operadores.value = []
  }
}

onMounted(async () => {
  await Promise.all([
    rutas.load(),
    pedidos.load(),
    productos.load(),
    loadOperadores(),
  ])
  productos.seedDefaults()

  const pre = String(route.query.preselect || '')
  if (pre) toAssign.value = [pre]

  const qPedido = getQueryString('pedido') || getQueryString('pre') || getQueryString('preselectOrder')
  const qRuta = getQueryString('ruta') || getQueryString('routeId') || getQueryString('preselectRoute')

  if (qPedido) {
    seleccion.value.add(qPedido)
    await nextTick()
    pendientesRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  if (qRuta) rutaDestinoId.value = qRuta

  if (qPedido || qRuta) router.replace({ query: {} })
})

function getQueryString(key: string): string | null {
  const v = route.query[key]
  if (Array.isArray(v)) return v[0] ?? null
  return typeof v === 'string' ? v : null
}

/* ---------- Estado UI ---------- */
const selectedRutaId = ref<string | null>(null)
const rutaSel = computed(() => (selectedRutaId.value ? rutas.byId(selectedRutaId.value) : null))

const nuevaRuta = ref<{ nombre: string; fechaISO: string; choferId: number | null }>({
  nombre: '',
  fechaISO: new Date().toISOString().slice(0, 10),
  choferId: null,
})

const seleccion = ref<Set<string>>(new Set())
const rutaDestinoId = ref<string>('')
const pendientesRef = ref<HTMLElement | null>(null)

/* ---------- Listas / cálculos ---------- */
const listaRutas = computed(() => {
  const list = rutas.ordenadas || []
  return [...list].sort((a, b) => (a.fechaISO || '').localeCompare(b.fechaISO || ''))
})
const pendientes = computed(() => pedidos.pendientes)

const pedidosRuta = computed(() => {
  if (!rutaSel.value) return [] as Pedido[]
  return rutaSel.value.pedidos
    .map(id => pedidos.byId(id))
    .filter((p): p is NonNullable<ReturnType<typeof pedidos.byId>> => Boolean(p))
})

const totalPedidos = computed(() => pedidosRuta.value.length)
const totalSacos = computed(() => pedidosRuta.value.reduce((acc, p) => acc + (p.cantidad || 0), 0))

function precioDe(nombre: string): number {
  const pr = productos.items.find(x => x.nombre === nombre)
  return pr?.precio ?? 0
}
const totalEstimado = computed(() =>
  pedidosRuta.value.reduce((acc, p) => acc + precioDe(p.producto) * p.cantidad, 0)
)

const porProducto = computed(() => {
  const map = new Map<string, { producto: string; sacos: number; precio: number; subtotal: number }>()
  for (const p of pedidosRuta.value) {
    const precio = precioDe(p.producto)
    const prev = map.get(p.producto) ?? { producto: p.producto, sacos: 0, precio, subtotal: 0 }
    prev.sacos += p.cantidad
    prev.subtotal = prev.sacos * precio
    map.set(p.producto, prev)
  }
  return Array.from(map.values()).sort((a, b) => a.producto.localeCompare(b.producto))
})

const hayEnRuta = computed(() => pedidosRuta.value.some(p => p.estado === 'en_ruta'))

/* ---------- Acciones ---------- */
async function crearRuta() {
  const id = await rutas.create({
    nombre: (nuevaRuta.value.nombre || 'Ruta sin nombre').trim(),
    fechaISO: nuevaRuta.value.fechaISO,
    choferId: nuevaRuta.value.choferId ?? null,
  })

  if (id) {
    selectedRutaId.value = id
    nuevaRuta.value.nombre = ''
  }
}

function toggleSeleccion(id: string, checked: boolean) {
  if (checked) seleccion.value.add(id)
  else seleccion.value.delete(id)
}

function clearSeleccion() {
  seleccion.value.clear()
}

async function asignarSeleccion() {
  if (!rutaDestinoId.value || seleccion.value.size === 0) return

  let successCount = 0
  let failCount = 0

  for (const pid of seleccion.value) {
    const ok = await rutas.assignPedido(rutaDestinoId.value, pid)
    if (ok) successCount++
    else failCount++
  }

  if (failCount > 0) {
    alertas.addLocal({
      titulo: 'Atención',
      mensaje: `Se asignaron ${successCount} pedidos. Hubo problemas con ${failCount}.`,
      tipo: 'pedido',
      severidad: 'warning'
    })
  } else {
    alertas.addLocal({
      titulo: 'Éxito',
      mensaje: `Se asignaron ${successCount} pedidos correctamente.`,
      tipo: 'pedido',
      severidad: 'info'
    })
  }
  clearSeleccion()
}

function quitarPedido(pid: string) {
  if (!rutaSel.value) return
  rutas.removePedido(rutaSel.value.id, pid)
}

function marcarTodosEntregados() {
  if (!rutaSel.value) return
  for (const pid of rutaSel.value.pedidos) {
    const p = pedidos.byId(pid)
    if (p && p.estado !== 'entregado') pedidos.setEstado(pid, 'entregado')
  }
}

/* ---------- Confirmaciones ---------- */
const showConfirm = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmAction = ref<(() => void) | null>(null)
const confirmDanger = ref(false)
const confirmTextButton = ref('Confirmar')

function openConfirm(title: string, msg: string, action: () => void, danger = false, btnText = 'Confirmar') {
  confirmTitle.value = title
  confirmMessage.value = msg
  confirmAction.value = action
  confirmDanger.value = danger
  confirmTextButton.value = btnText
  showConfirm.value = true
}

function handleConfirm() {
  if (confirmAction.value) confirmAction.value()
  showConfirm.value = false
}

/* ---------- Export ---------- */
function exportCsv() {
  if (!rutaSel.value) return
  const header = ['Folio', 'Producto', 'Cantidad', 'Precio unitario', 'Subtotal', 'Fecha', 'Estado', 'Solicitante', 'Comunidad', 'Municipio']
  const rows = pedidosRuta.value.map(p => {
    const precio = precioDe(p.producto)
    const subtotal = precio * p.cantidad
    return [
      p.folio,
      p.producto,
      String(p.cantidad),
      precio.toFixed(2),
      subtotal.toFixed(2),
      formatFechaCorta(p.fechaISO),
      p.estado,
      p.solicitanteNombre || '',
      p.solicitanteComunidad || '',
      p.solicitanteMunicipio || ''
    ]
  })
  const lines = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  const csv = '\uFEFF' + lines.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `manifiesto_${rutaSel.value.nombre.replace(/\s+/g, '_')}_${rutaSel.value.fechaISO}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function printManifest() {
  if (!rutaSel.value) return
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
      .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
      .card { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; }
      .card-label { font-size: 11px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
      .card-value { font-size: 24px; font-weight: 700; color: #111; }
      .card-value small { font-size: 14px; color: #9CA3AF; font-weight: 500; }

      /* Table */
      table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 12px; }
      th { background-color: #F3F4F6; color: #374151; font-weight: 600; text-align: left; padding: 10px 12px; border-top: 1px solid #E5E7EB; border-bottom: 1px solid #E5E7EB; white-space: nowrap; }
      th:first-child { border-top-left-radius: 8px; border-bottom-left-radius: 8px; border-left: 1px solid #E5E7EB; }
      th:last-child { border-top-right-radius: 8px; border-bottom-right-radius: 8px; border-right: 1px solid #E5E7EB; }
      
      td { padding: 12px; border-bottom: 1px solid #F3F4F6; color: #4B5563; vertical-align: top; }
      tr:last-child td { border-bottom: none; }
      
      .product { font-weight: 600; color: #111; }
      .folio { font-family: monospace; font-weight: 600; color: #6B7280; background: #F3F4F6; padding: 2px 6px; border-radius: 4px; }
      .status { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 700; text-transform: uppercase; border: 1px solid transparent; }
      .status-pendiente { background: #FFFBEB; color: #B45309; border-color: #FDE68A; }
      .status-en_ruta { background: #EFF6FF; color: #1D4ED8; border-color: #BFDBFE; }
      .status-entregado { background: #ECFDF5; color: #047857; border-color: #A7F3D0; }

      .user-info div { margin-bottom: 2px; }
      .user-name { font-weight: 600; color: #111; }
      .location { font-size: 11px; }

      /* Footer */
      .footer { margin-top: 40px; pt-4; border-top: 2px solid #f3f4f6; display: flex; justify-content: space-between; font-size: 10px; color: #9CA3AF; }
    </style>
  `

  const rows = pedidosRuta.value.map(p => {
    const precio = precioDe(p.producto)
    const subtotal = precio * p.cantidad
    return `<tr>
      <td><span class="folio">${p.folio}</span></td>
      <td>
        <div class="product">${p.producto}</div>
        <div style="font-size: 10px; color: #9CA3AF">${formatFechaCorta(p.fechaISO)}</div>
      </td>
      <td style="text-align: right; font-weight: 600;">${p.cantidad}</td>
      <td style="text-align: right;">$${precio.toFixed(2)}</td>
      <td style="text-align: right; font-weight: 700; color: #111;">$${subtotal.toFixed(2)}</td>
      <td>
        <div class="user-info">
            <div class="user-name">${p.solicitanteNombre || '—'}</div>
            <div class="location">📍 ${p.solicitanteComunidad || '—'}</div>
            <div class="location" style="color: #9CA3AF">${p.solicitanteMunicipio || ''}</div>
        </div>
      </td>
      <td style="text-align: center;">
         <span class="status status-${p.estado}">${p.estado}</span>
      </td>
    </tr>`
  }).join('')

  const body = `
    <div class="header">
        <div class="brand">
            <img src="${window.location.origin}${logoUrl}" />
            <div class="brand-text">
                <h1>KikiRutas</h1>
                <p>Logística y Entregas</p>
            </div>
        </div>
        <div class="meta">
            <h2>${rutaSel.value!.nombre}</h2>
            <p>${formatFechaLarga(rutaSel.value!.fechaISO)}</p>
        </div>
    </div>

    <div class="summary">
        <div class="card">
            <div class="card-label">Total Pedidos</div>
            <div class="card-value">${totalPedidos.value} <small>unidades</small></div>
        </div>
        <div class="card">
            <div class="card-label">Carga Total</div>
            <div class="card-value">${totalSacos.value} <small>sacos</small></div>
        </div>
        <div class="card">
            <div class="card-label">Valor Estimado</div>
            <div class="card-value">$${totalEstimado.value.toFixed(2)} <small>MXN</small></div>
        </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Folio</th>
          <th>Producto / Fecha</th>
          <th style="text-align: right;">Cant</th>
          <th style="text-align: right;">Unitario</th>
          <th style="text-align: right;">Subtotal</th>
          <th>Destinatario</th>
          <th style="text-align: center;">Estado</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
        <div>Generado el: ${new Date().toLocaleString()}</div>
        <div>Manifiesto de Carga - Uso Interno</div>
    </div>
  `

  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(`<html><head><title>Manifiesto ${rutaSel.value.nombre}</title>${head}</head><body>${body}</body></html>`)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 500)
}

/* ---------- Eliminación ---------- */
const canDeleteRuta = computed(() => !!rutaSel.value && rutaSel.value.pedidos.length === 0)

async function eliminarRuta() {
  if (!rutaSel.value) return
  if (!canDeleteRuta.value) return

  openConfirm(
    '¿Eliminar ruta?',
    'Se eliminará esta ruta vacía permanentemente. Esta acción no se puede deshacer.',
    async () => {
      const ok = await rutas.remove(rutaSel.value!.id)
      if (ok) selectedRutaId.value = null
    },
    true,
    'Eliminar'
  )
}

async function eliminarRutaForzada() {
  if (!rutaSel.value) return
  if (rutaSel.value.pedidos.length === 0) return eliminarRuta()

  openConfirm(
    '¿Eliminar ruta forzosamente?',
    'La ruta tiene pedidos asignados. Se regresarán a "pendiente" y se eliminará la ruta. ¿Continuar?',
    async () => {
      const ok = await rutas.removeAndUnassign(rutaSel.value!.id)
      if (ok) selectedRutaId.value = null
    },
    true,
    'Eliminar y desasignar'
  )
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 pb-20">
    <div class="max-w-screen-2xl mx-auto px-4 py-8">

      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Gestión de Rutas</h1>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

        <!-- COLUMNA IZQUIERDA: Crear ruta + Lista Transportistas -->
        <div class="space-y-6">

          <!-- Crear Ruta -->
          <div class="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
            <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Crear Nueva Ruta
            </h3>

            <div class="space-y-3">
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Operador</label>
                <select v-model.number="nuevaRuta.choferId"
                  class="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all">
                  <option :value="null">Selecciona un operador</option>
                  <option v-for="op in operadores" :key="op.id" :value="op.id">
                    {{ op.name }} <template v-if="op.comunidad">({{ op.comunidad }})</template>
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Nombre
                  (Opcional)</label>
                <input v-model="nuevaRuta.nombre" placeholder="Ej. Ruta Sur - Candelaria"
                  class="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all" />
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Fecha de
                  Entrega</label>
                <input v-model="nuevaRuta.fechaISO" type="date"
                  class="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all" />
              </div>

              <button
                class="w-full rounded-xl bg-brand/90 hover:bg-brand text-white font-bold py-2.5 shadow-lg shadow-brand/20 transition-all mt-2"
                @click="crearRuta">
                Crear Ruta
              </button>
            </div>
          </div>

          <!-- Lista Transportistas (Rutas Activas) -->
          <div class="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 flex flex-col h-[600px]">
            <h3 class="font-bold text-gray-900 mb-4">Rutas Activas</h3>

            <div class="flex-1 overflow-y-auto space-y-2 pr-2">
              <div v-for="r in listaRutas" :key="r.id"
                class="rounded-xl border p-3 cursor-pointer transition-all hover:shadow-md" :class="selectedRutaId === r.id
                  ? 'bg-brand/5 border-brand ring-1 ring-brand'
                  : 'bg-white border-gray-100 hover:border-gray-300'" @click="selectedRutaId = r.id">

                <div class="flex items-center justify-between mb-1">
                  <h4 class="font-bold text-sm text-gray-900 truncate pr-2" :title="r.nombre">{{ r.nombre }}</h4>
                  <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide"
                    :class="r.estado === 'planificada' ? 'bg-amber-100 text-amber-700' : (r.estado === 'en_ruta' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700')">
                    {{ r.estado === 'planificada' ? 'Plan' : (r.estado === 'en_ruta' ? 'Ruta' : 'Fin') }}
                  </span>
                </div>

                <div class="flex justify-between items-end text-xs text-gray-500">
                  <span>{{ formatFechaLarga(r.fechaISO) }}</span>
                  <span class="font-medium bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{{ r.pedidos.length }}
                    pedidos</span>
                </div>
              </div>

              <div v-if="listaRutas.length === 0" class="text-center py-10 text-gray-400 text-sm">
                No hay rutas registradas.
              </div>
            </div>

            <div v-if="rutaSel" class="pt-4 mt-2 border-t border-gray-100 grid grid-cols-2 gap-2">
              <button
                class="rounded-lg bg-gray-100 text-gray-600 text-xs font-bold py-2 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                :disabled="!canDeleteRuta" @click="eliminarRuta">
                Eliminar (Vacía)
              </button>
              <button
                class="rounded-lg bg-gray-100 text-gray-600 text-xs font-bold py-2 hover:bg-red-50 hover:text-red-700 transition-colors"
                @click="eliminarRutaForzada">
                Eliminar (Forzar)
              </button>
            </div>
          </div>

        </div>

        <!-- COLUMNA CENTRAL + DERECHA (2 columnas wide) -->
        <div class="xl:col-span-2 space-y-6">

          <!-- LISTA DE PENDIENTES (Asignación) -->
          <div ref="pendientesRef"
            class="rounded-2xl bg-white border border-gray-100 shadow-sm p-0 overflow-hidden flex flex-col max-h-[500px]">
            <div
              class="p-5 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 class="font-bold text-gray-900">Pedidos Pendientes</h3>
                <p class="text-xs text-gray-500">Selecciona pedidos para asignarlos a una ruta.</p>
              </div>

              <div class="flex items-center gap-2 w-full sm:w-auto">
                <select v-model="rutaDestinoId"
                  class="flex-1 sm:flex-none w-full sm:w-64 rounded-xl border-gray-200 bg-white text-sm px-3 py-2 focus:border-brand focus:ring-2 focus:ring-brand/10">
                  <option disabled value="">Selecciona ruta destino...</option>
                  <option v-for="r in rutas.ordenadas" :key="r.id" :value="r.id">
                    {{ r.nombre }}
                  </option>
                </select>
                <button
                  class="whitespace-nowrap rounded-xl bg-blue-600 text-white text-sm font-bold px-4 py-2 hover:bg-blue-500 shadow-md shadow-blue-200 disabled:opacity-50 disabled:shadow-none"
                  :disabled="!rutaDestinoId || seleccion.size === 0" @click="asignarSeleccion">
                  Asignar ({{ seleccion.size }})
                </button>
              </div>
            </div>

            <div class="overflow-x-auto flex-1">
              <table class="w-full text-sm text-left">
                <thead class="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100 sticky top-0 z-10">
                  <tr>
                    <th class="w-12 px-4 py-3 text-center">
                      <input type="checkbox" class="rounded border-gray-300 text-brand focus:ring-brand"
                        :checked="seleccion.size === pendientes.length && pendientes.length > 0"
                        @change="(e: any) => { if (e.target.checked) pendientes.forEach(p => seleccion.add(p.id)); else seleccion.clear(); }">
                    </th>
                    <th class="px-4">Folio</th>
                    <th class="px-4">Producto</th>
                    <th class="px-4 text-right">Cant</th>
                    <th class="px-4">Solicitante</th>
                    <th class="px-4">Lugar</th>
                    <th class="px-4">Fecha</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="p in pendientes" :key="p.id" class="hover:bg-blue-50/30 transition-colors cursor-pointer"
                    @click="(e) => { if ((e.target as HTMLElement).tagName !== 'INPUT') toggleSeleccion(p.id, !seleccion.has(p.id)) }">
                    <td class="px-4 py-3 text-center">
                      <input type="checkbox" :checked="seleccion.has(p.id)"
                        class="rounded border-gray-300 text-brand focus:ring-brand cursor-pointer" @click.stop
                        @change="toggleSeleccion(p.id, ($event.target as HTMLInputElement).checked)" />
                    </td>
                    <td class="px-4 font-bold text-gray-900">{{ p.folio }}</td>
                    <td class="px-4 text-gray-700 truncate max-w-[150px]" :title="p.producto">{{ p.producto }}</td>
                    <td class="px-4 text-right font-medium">{{ p.cantidad }}</td>
                    <td class="px-4 text-gray-600 truncate max-w-[150px]">{{ p.solicitanteNombre }}</td>
                    <td class="px-4 text-gray-500 truncate max-w-[150px]">{{ p.solicitanteComunidad }}</td>
                    <td class="px-4 text-gray-400 text-xs">{{ formatFechaCorta(p.fechaISO) }}</td>
                  </tr>
                  <tr v-if="pendientes.length === 0">
                    <td colspan="7" class="py-12 text-center text-gray-400">¡Excelente! No hay pedidos pendientes.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- DETALLE DE RUTA SELECCIONADA -->
          <div v-if="rutaSel"
            class="rounded-2xl bg-white border border-gray-100 shadow-sm p-0 overflow-hidden flex flex-col">
            <div
              class="p-5 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 class="font-bold text-gray-900 text-lg flex items-center gap-2">
                  {{ rutaSel.nombre }}
                  <span
                    class="text-xs font-normal text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{{
                      formatFechaLarga(rutaSel.fechaISO) }}</span>
                </h3>
                <div class="mt-1 flex gap-3 text-sm text-gray-600">
                  <span><b>{{ totalPedidos }}</b> Pedidos</span>
                  <span class="text-gray-300">|</span>
                  <span><b>{{ totalSacos }}</b> Sacos</span>
                  <span class="text-gray-300">|</span>
                  <span><b>${{ totalEstimado.toFixed(2) }}</b> Tot. Estimado</span>
                </div>
              </div>

              <div class="flex gap-2">
                <button @click="printManifest"
                  class="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimir
                </button>
                <button @click="exportCsv"
                  class="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  CSV
                </button>
                <button :disabled="!hayEnRuta" @click="marcarTodosEntregados"
                  class="ml-2 inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 rounded-lg text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-200 disabled:opacity-50 disabled:shadow-none">
                  Marcar Entregados
                </button>
              </div>
            </div>

            <!-- Lista pedidos ruta -->
            <div class="overflow-x-auto max-h-[400px]">
              <table class="w-full text-sm text-left">
                <thead class="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100 sticky top-0">
                  <tr>
                    <th class="px-4 py-2">Folio</th>
                    <th class="px-4">Producto</th>
                    <th class="px-4 text-right">Cant</th>
                    <th class="px-4">Lugar</th>
                    <th class="px-4 text-center">Estado</th>
                    <th class="px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="p in pedidosRuta" :key="p.id" class="hover:bg-gray-50">
                    <td class="px-4 py-2 font-medium text-gray-900">{{ p.folio }}</td>
                    <td class="px-4 text-gray-600 truncate max-w-[180px]">{{ p.producto }}</td>
                    <td class="px-4 text-right font-medium">{{ p.cantidad }}</td>
                    <td class="px-4 text-gray-500 truncate max-w-[150px]">{{ p.solicitanteComunidad }}</td>
                    <td class="px-4 text-center">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase" :class="{
                        'bg-amber-50 text-amber-700 border-amber-200': p.estado === 'pendiente',
                        'bg-blue-50 text-blue-700 border-blue-200': p.estado === 'en_ruta',
                        'bg-emerald-50 text-emerald-700 border-emerald-200': p.estado === 'entregado',
                        'bg-red-50 text-red-700 border-red-200': p.estado === 'cancelado'
                      }">
                        {{ p.estado }}
                      </span>
                    </td>
                    <td class="px-4 text-right">
                      <button class="text-xs text-red-600 font-bold hover:underline"
                        @click="quitarPedido(p.id)">Quitar</button>
                    </td>
                  </tr>
                  <tr v-if="pedidosRuta.length === 0">
                    <td colspan="6" class="py-8 text-center text-gray-400">Esta ruta está vacía. Añade pedidos desde la
                      lista de
                      pendientes.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Resumen carga -->
            <div class="border-t border-gray-100 bg-gray-50 p-4">
              <h4 class="text-xs font-bold text-gray-500 uppercase mb-2">Resumen de carga</h4>
              <div class="flex flex-wrap gap-2">
                <div v-for="r in porProducto" :key="r.producto"
                  class="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs shadow-sm">
                  <span class="font-bold text-gray-800">{{ r.sacos }}</span> <span class="text-gray-500">x</span> <span
                    class="text-gray-700">{{ r.producto }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else
            class="rounded-2xl border-2 border-dashed border-gray-200 p-10 flex flex-col items-center justify-center text-gray-400">
            <svg class="w-12 h-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-1.447-.894L15 7m0 13V7m0 0L9 4" />
            </svg>
            <p>Selecciona una ruta del panel izquierdo para ver sus detalles y gestionar su carga.</p>
          </div>

        </div>

      </div>

    </div>

    <!-- Modal de confirmación -->
    <ConfirmationModal :show="showConfirm" :title="confirmTitle" :message="confirmMessage" :danger="confirmDanger"
      :confirm-text="confirmTextButton" @close="showConfirm = false" @confirm="handleConfirm" />
  </div>
</template>

<style scoped>
/* Scrollbar bonita para las tablas */
div::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

div::-webkit-scrollbar-track {
  background: transparent;
}

div::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 999px;
}

div::-webkit-scrollbar-thumb:hover {
  background-color: #d1d5db;
}
</style>