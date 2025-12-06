<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import { useRutasStore } from '@/stores/rutas'
import { usePedidosStore, type Pedido } from '@/stores/pedidos'
import { useProductosStore } from '@/stores/productos'
import { templates } from '@/stores/rutas';
import { formatFechaLarga } from '@/utils/dateFormat'
import { formatFechaCorta } from '@/utils/dateFormat'

type OperadorOption = {
  id: number
  name: string
  comunidad?: string | null
  municipio?: string | null
  estado?: string | null
}

const operadores = ref<OperadorOption[]>([])

const plantillaId = ref<string>('')

async function crearDesdePlantilla() {
  if (!plantillaId.value) return

  const operador = (nuevaRuta.value.nombre || 'Operador').trim()

  const id = await rutas.createFromTemplate(
    plantillaId.value,
    operador,
    nuevaRuta.value.fechaISO,
    nuevaRuta.value.choferId ?? null,
  )

  if (id) selectedRutaId.value = id
}

/* ---------- Stores ---------- */
const rutas = useRutasStore()
const pedidos = usePedidosStore()
const productos = useProductosStore()

/* ---------- Router (para preselección desde OrdersBoard) ---------- */
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
const listaRutas = computed(() => rutas.ordenadas)
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
    if (ok) {
      successCount++
    } else {
      failCount++
    }
  }

  if (failCount > 0) {
    alert(`Se asignaron ${successCount} pedidos. Hubo problemas con ${failCount}. Revisa la consola o intenta de nuevo.`)
  }

  clearSeleccion()
}


function quitarPedido(pid: string) {
  if (!rutaSel.value) return
  rutas.removePedido(rutaSel.value.id, pid)
}

function marcarEnRuta(pid: string) {
  pedidos.setEstado(pid, 'en_ruta')
}

function marcarEntregado(pid: string) {
  pedidos.setEstado(pid, 'entregado')
}

function marcarTodosEntregados() {
  if (!rutaSel.value) return
  for (const pid of rutaSel.value.pedidos) {
    const p = pedidos.byId(pid)
    if (p && p.estado !== 'entregado') pedidos.setEstado(pid, 'entregado')
  }
}

/* ---------- Export / Print ---------- */
function exportCsv() {
  if (!rutaSel.value) return
  const header = ['Folio', 'Producto', 'Cantidad', 'Precio unitario', 'Subtotal', 'Fecha', 'Estado']
  const rows = pedidosRuta.value.map(p => {
    const precio = precioDe(p.producto)
    const subtotal = precio * p.cantidad
    return [p.folio, p.producto, String(p.cantidad), precio.toFixed(2), subtotal.toFixed(2), p.fechaISO, p.estado]
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
    <style>
      body { font-family: Arial, sans-serif; padding: 16px; }
      h1, h2 { margin: 0 0 8px 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border: 1px solid #999; padding: 6px 8px; font-size: 12px; text-align: left; }
      th { background: #eee; }
    </style>
  `
  const rows = pedidosRuta.value.map(p => {
    const precio = precioDe(p.producto)
    const subtotal = precio * p.cantidad
    return `<tr>
      <td>${p.folio}</td>
      <td>${p.producto}</td>
      <td>${p.cantidad}</td>
      <td>$${precio.toFixed(2)}</td>
      <td>$${subtotal.toFixed(2)}</td>
      <td>${p.fechaISO}</td>
      <td>${p.estado}</td>
    </tr>`
  }).join('')

  const body = `
    <h1>Manifiesto de Ruta</h1>
    <h2>${rutaSel.value!.nombre} — ${rutaSel.value!.fechaISO}</h2>
    <div>Pedidos: ${totalPedidos.value} · Sacos: ${totalSacos.value} · Estimado: $${totalEstimado.value.toFixed(2)}</div>
    <table>
      <thead>
        <tr>
          <th>Folio</th><th>Producto</th><th>Cantidad</th>
          <th>Precio unitario</th><th>Subtotal</th><th>Fecha</th><th>Estado</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(`<html><head><title>Manifiesto</title>${head}</head><body>${body}</body></html>`)
  w.document.close()
  w.focus()
  w.print()
  w.close()
}

/* ---------- Eliminación de rutas ---------- */
const canDeleteRuta = computed(() => !!rutaSel.value && rutaSel.value.pedidos.length === 0)

async function eliminarRuta() {
  if (!rutaSel.value) return
  if (!canDeleteRuta.value) return
  if (confirm('¿Eliminar esta ruta? Esta acción no se puede deshacer.')) {
    const ok = await rutas.remove(rutaSel.value.id)
    if (ok) selectedRutaId.value = null
  }
}

async function eliminarRutaForzada() {
  if (!rutaSel.value) return
  if (rutaSel.value.pedidos.length === 0) return eliminarRuta()
  if (confirm('La ruta tiene pedidos. Se regresarán a "pendiente" y se eliminará la ruta. ¿Continuar?')) {
    const ok = await rutas.removeAndUnassign(rutaSel.value.id)
    if (ok) selectedRutaId.value = null
  }
}

</script>

<template>
  <!-- Marco igual al de AdminLayout -->
  <div class="min-h-screen overflow-x-hidden bg-neutral-950 text-gray-100">
    <div class="max-w-7xl mx-auto px-4 py-6 md:py-8 pb-24 md:pb-10">

      <section class="space-y-4">
        <h1 class="text-2xl font-semibold"> Rutas </h1>

        <!--Grid: nueva ruta + pendientes-->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!--Nueva ruta-->
          <div class="rounded-xl bg-white/5 border border-white/10 p-4">
            <h3 class="font-semibold mb-3"> Ingrese la nueva ruta </h3>

            <label class="block text-sm mb-1"> Operador </label>
            <select v-model.number="nuevaRuta.choferId"
              class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2 text-sm">
              <option :value="null"> Selecciona un operado </option>
              <option v-for="op in operadores" :key="op.id" :value="op.id">
                {{ op.name }}
                <span v-if="op.comunidad"> – {{ op.comunidad }} </span>
                <span v-else-if="op.municipio"> – {{ op.municipio }} </span>
              </option>
            </select>

            <!--Nombre de la ruta-->
            <label class="block text-sm mt-3 mb-1"> Nombre de la ruta(opcional) </label>
            <input v-model="nuevaRuta.nombre" placeholder="Ej. Luis - Candelaria"
              class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2" />

            <label class="block text-sm mt-3 mb-1"> Fecha de entrega </label>
            <input v-model="nuevaRuta.fechaISO" type="date"
              class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2" />

            <!-- <div class="mt-3 space-y-2">
    <button
                class="rounded bg-blue-600 px-3 py-2 hover:bg-blue-500 disabled:opacity-60"
@click="crearDesdePlantilla"
  >
  Crear desde plantilla
    </button>
    </div> -->

            <button class="mt-3 rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-500" @click="crearRuta">
              Crear ruta
            </button>
          </div>

          <!--Pendientes -->
          <div ref="pendientesRef" class="lg:col-span-2 rounded-xl bg-white/5 border border-white/10 p-4">
            <!--Header responsive-->
            <header class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
              <h3 class="font-semibold"> Pedidos pendientes </h3>

              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                <select v-model="rutaDestinoId"
                  class="w-full sm:w-auto rounded bg-neutral-900 border border-white/10 px-3 py-2 text-sm">
                  <option disabled value=""> Selecciona Transportista </option>
                  <option v-for="r in rutas.ordenadas" :key="r.id" :value="r.id">
                    {{ r.nombre }} — {{ formatFechaLarga(r.fechaISO) }}
                  </option>
                </select>

                <button class="w-full sm:w-auto rounded bg-emerald-600 px-3 py-2 text-sm hover:bg-emerald-500"
                  :disabled="!rutaDestinoId || seleccion.size === 0" @click="asignarSeleccion">
                  Asignar a ruta seleccionada
                </button>
              </div>
            </header>

            <!--Tabla: pendientes(scroll interno)-->
            <div class="table-wrap overflow-hidden">
              <div class="table-scroll overflow-x-auto" role="region" aria-label="Pedidos pendientes" tabindex="0">
                <table class="data-table min-w-[920px] md:min-w-[1050px]">
                  <thead>
                    <tr>
                      <th class="w-10"> </th>
                      <th class="w-24 text-left"> Folio </th>
                      <th class="w-56 text-left"> Producto </th>
                      <th class="w-24 text-right"> Cantidad </th>
                      <th class="w-48 text-left"> Solicitante </th>
                      <th class="w-48 text-left"> Comunidad </th>
                      <th class="w-48 text-left"> Municipio </th>
                      <th class="w-36 text-left"> Fecha </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="p in pendientes" :key="p.id">
                      <td>
                        <input type="checkbox" :checked="seleccion.has(p.id)"
                          @change="toggleSeleccion(p.id, ($event.target as HTMLInputElement).checked)" />
                      </td>
                      <td class="font-medium whitespace-nowrap"> {{ p.folio }}</td>
                      <td class="truncate"> {{ p.producto }}</td>
                      <td class="text-right"> {{ p.cantidad }}</td>
                      <td class="truncate"> {{ p.solicitanteNombre || '—' }}</td>
                      <td class="truncate"> {{ p.solicitanteComunidad || '—' }}</td>
                      <td class="truncate"> {{ p.solicitanteMunicipio || '—' }}</td>
                      <td class="whitespace-nowrap"> {{ formatFechaCorta(p.fechaISO) }}</td>
                    </tr>
                    <tr v-if="pendientes.length === 0">
                      <td class="py-6 text-center text-white/60" colspan="7"> Sin pedidos pendientes.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!--Grid: lista de rutas + detalle-->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!--Lista de rutas-->
          <div class="rounded-xl bg-white/5 border border-white/10 p-4">
            <h3 class="font-semibold mb-3"> Transportista </h3>

            <div v-for="r in listaRutas" :key="r.id"
              class="mb-2 rounded-lg border border-white/10 bg-white/5 p-3 cursor-pointer hover:bg-white/10"
              :class="{ 'ring-2 ring-emerald-500': selectedRutaId === r.id }" @click="selectedRutaId = r.id">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium truncate max-w-[15rem]"> {{ r.nombre }}</div>
                  <div class="text-xs text-white/60"> {{ formatFechaLarga(r.fechaISO) }}</div>
                </div>
                <span class="px-2 py-1 rounded text-xs border border-white/15 bg-white/10 whitespace-nowrap">
                  {{ r.estado === 'planificada' ? 'Planificada' : r.estado === 'en_ruta' ? 'En ruta' : 'Finalizada' }}
                </span>
              </div>
              <div class="text-xs text-white/60 mt-1"> Pedidos: {{ r.pedidos.length }} </div>
            </div>

            <div v-if="rutaSel" class="mt-4 space-y-2">
              <button class="w-full rounded bg-rose-700 px-3 py-2 hover:bg-rose-600 disabled:opacity-50"
                :disabled="!canDeleteRuta" @click="eliminarRuta">
                Eliminar ruta(vacía)
              </button>
              <button class="w-full rounded bg-rose-800 px-3 py-2 hover:bg-rose-700" @click="eliminarRutaForzada">
                Eliminar ruta(forzado)
              </button>
            </div>
          </div>

          <!--Detalle de ruta-->
          <div class="lg:col-span-2 rounded-xl bg-white/5 border border-white/10 p-4">
            <template v-if="rutaSel">
              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                <div>
                  <h3 class="font-semibold"> Pedidos en {{ rutaSel.nombre }} </h3>
                  <div class="text-sm text-white/70">
                    Pedidos: {{ totalPedidos }} · Sacos: {{ totalSacos }} · Estimado: ${{ totalEstimado.toFixed(2) }}
                  </div>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button @click="exportCsv"
                    class="inline-flex items-center rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400">
                    Exportar CSV
                  </button>

                  <button @click="printManifest"
                    class="inline-flex items-center rounded bg-gray-600 px-3 py-2 text-sm font-medium text-white hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400">
                    Imprimir
                  </button>
                  <button class="rounded bg-emerald-600 px-3 py-2 hover:bg-emerald-500 text-sm" :disabled="!hayEnRuta"
                    @click="marcarTodosEntregados">
                    Marcar todos entregados
                  </button>
                </div>
              </div>

              <!--Tabla: pedidos de la ruta(scroll interno)-->
              <div class="table-wrap">
                <div class="table-scroll" role="region" aria-label="Pedidos de la ruta" tabindex="0">
                  <table class="data-table min-w-[980px] md:min-w-[1100px]">
                    <thead>
                      <tr>
                        <th class="w-24 text-left"> Folio </th>
                        <th class="w-56 text-left"> Producto </th>
                        <th class="w-24 text-right"> Cantidad </th>
                        <th class="w-48 text-left"> Solicitante </th>
                        <th class="w-48 text-left"> Comunidad </th>
                        <th class="w-48 text-left"> Municipio </th>
                        <th class="w-40 text-left"> Estado </th>
                        <th class="w-64 text-left"> Acciones </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="p in pedidosRuta" :key="p.id">
                        <td class="font-medium whitespace-nowrap"> {{ p.folio }}</td>
                        <td class="truncate"> {{ p.producto }}</td>
                        <td class="text-right"> {{ p.cantidad }}</td>
                        <td class="truncate"> {{ p.solicitanteNombre || '—' }}</td>
                        <td class="truncate"> {{ p.solicitanteComunidad || '—' }}</td>
                        <td class="truncate"> {{ p.solicitanteMunicipio || '—' }}</td>
                        <td>
                          <span class="px-2 py-1 rounded text-xs font-medium" :class="{
                            'bg-amber-500/15 text-amber-300 border border-amber-500/30': p.estado === 'pendiente',
                            'bg-blue-500/15 text-blue-300 border border-blue-500/30': p.estado === 'en_ruta',
                            'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30': p.estado === 'entregado',
                            'bg-rose-500/15 text-rose-300 border border-rose-500/30': p.estado === 'cancelado'
                          }">
                            {{ p.estado }}
                          </span>
                        </td>
                        <td class="space-x-2 whitespace-nowrap">
                          <button
                            class="inline-flex items-center rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                            @click="quitarPedido(p.id)">
                            Quitar
                          </button>
                        </td>
                      </tr>
                      <tr v-if="pedidosRuta.length === 0">
                        <td colspan="7" class="py-6 text-center text-white/60"> La ruta aún no tiene pedidos.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!--Desglose -->
              <div class="mt-6">
                <h4 class="font-semibold mb-2"> Desglose por producto </h4>
                <div class="table-wrap">
                  <div class="table-scroll max-h-[260px]" role="region" aria-label="Desglose por producto" tabindex="0">
                    <table class="data-table min-w-[680px] md:min-w-[700px]">
                      <thead>
                        <tr>
                          <th class="text-left w-2/5"> Producto </th>
                          <th class="text-right w-1/5"> Sacos </th>
                          <th class="text-right w-1/5"> Precio </th>
                          <th class="text-right w-1/5"> Subtotal </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="r in porProducto" :key="r.producto">
                          <td class="truncate"> {{ r.producto }}</td>
                          <td class="text-right"> {{ r.sacos }}</td>
                          <td class="text-right"> ${{ r.precio.toFixed(2) }} </td>
                          <td class="text-right"> ${{ r.subtotal.toFixed(2) }} </td>
                        </tr>
                        <tr v-if="porProducto.length === 0">
                          <td colspan="4" class="py-4 text-center text-white/60"> Sin datos.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </template>

            <template v-else>
              <p class="text-white/70"> Selecciona una ruta para ver el detalle.</p>
            </template>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
/* Mantén la tabla contenida dentro del card */
.table-wrap {
  max-width: 100%;
  border-radius: 0.75rem;
  /* combina bonito con tu card */
}

/* Scroll horizontal interno al card (no al body) */
.table-scroll {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  /* scroll suave en iOS */
  overscroll-behavior-x: contain;
  /* evita que arrastre el layout */
  scrollbar-gutter: stable both-edges;
}

/* Estilito al scrollbar (opcional) */
.table-scroll::-webkit-scrollbar {
  height: 10px;
}

.table-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, .06);
  border-radius: 999px;
}

.table-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, .18);
  border-radius: 999px;
}

.table-scroll:hover::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, .28);
}

/* En pantallas muy angostas, ligeramente menos padding del card
    para que el scroll no parezca “cortado” */
@media(max-width: 480px) {
  .table-scroll {
    padding-bottom: 2px;
  }
}


/* Botones discretos del tema oscuro */
.btn-ghost {
  background: rgba(255, 255, 255, .06);
  border: 1px solid rgba(255, 255, 255, .15);
  padding: .5rem .75rem;
  border-radius: .6rem;
  font-size: .85rem;
}

/* --- Tabla compacta, con respiro y scrollers --- */
.table-wrap {
  @supports(overflow: clip) {
    overflow: clip;
  }

  border: 1px solid rgba(255, 255, 255, .10);
  border-radius: .75rem;
  background: rgba(255, 255, 255, .03);
}

.table-scroll {
  max-height: 360px;
  /* hace la tabla verticalmente desplazable */
  overflow: auto;
  scrollbar-gutter: stable;
}

/* Base */
.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  /* permite truncar textos y respetar widths */
}

/* Encabezado sticky */
.data-table thead th {
  position: sticky;
  top: 0;
  z-index: 5;
  background: rgba(9, 9, 11, .9);
  /* near neutral-950 */
  backdrop-filter: saturate(1.2) blur(4px);
  color: rgba(255, 255, 255, .75);
  text-align: left;
  padding: .75rem .75rem;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, .12);
}

/* Celdas */
.data-table tbody td {
  padding: .65rem .75rem;
  border-bottom: 1px solid rgba(255, 255, 255, .06);
  vertical-align: middle;
  color: rgba(255, 255, 255, .92);
}

/* Zebra + hover */
.data-table tbody tr:nth-child(even) {
  background: rgba(255, 255, 255, .025);
}

.data-table tbody tr:hover {
  background: rgba(255, 255, 255, .06);
}

/* Utilidades locales */
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>