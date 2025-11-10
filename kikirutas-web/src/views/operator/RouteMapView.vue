<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRutasStore } from '@/stores/rutas'
import { usePedidosStore } from '@/stores/pedidos'

declare global { interface Window { google?: any } }

/* ===================== Tipos ===================== */
type PedidoEstado = 'pendiente'|'en_ruta'|'entregado'|'cancelado'
type Pedido = {
  id: string
  producto: string
  cantidad: number
  fechaISO: string
  estado: PedidoEstado
  solicitanteNombre?: string
  solicitanteComunidad?: string
}
type LatLng = { lat:number, lng:number }

/* ===================== Stores ===================== */
const route  = useRoute()
const router = useRouter()
const rutas   = useRutasStore()
const pedidos = usePedidosStore()

onMounted(() => { rutas.load?.(); pedidos.load?.() })

const rutaSel = computed(() => rutas.byId?.(String(route.params.id)) ?? null)

/* ------------------ Pedidos asignados a la ruta ------------------ */
const pedidosRuta = computed<Pedido[]>(() => {
  const ids = (rutaSel.value?.pedidos ?? []) as string[]
  if (!ids.length) return []
  const get = (pedidos as any).byId as ((id:string)=>Pedido|undefined) | undefined
  return get ? ids.map(id => get(id)).filter(Boolean) as Pedido[] : []
})
const hasAssigned = computed(()=> pedidosRuta.value.length > 0)

/* ===================== UI de planificador ===================== */
/** bases para origen */
const originOptions = ['José María Morelos, Quintana Roo', 'Felipe Carrillo Puerto, Quintana Roo']

/** catálogo base de localidades (como el diseño anterior) */
const presetCommunities = [
  'Candelaria','Dziuché','La Presumida','Santa Gertrudis','Kancabchén',
  'Cafetalito','Cafetal Grande','Benito Juárez','Pozo Pirata','San Carlos',
  'Chunhuhub','Polyuc','Dos Aguadas','El Naranjal','Othón P. Blanco',
  'Puerto Arturo','Dzulá','X-Yatil','El Señor','Tihosuco'
].map(c=>`${c}, Quintana Roo`)

/** util para limpiar comunidades inválidas (—, --- , vacíos) */
const cleanCommunity = (s?: string) => {
  const t = (s ?? '').replace(/\s+/g,' ').trim()
  return t && !/^[-—]+$/.test(t) ? t : ''
}

/** comunidades detectadas desde pedidos + catálogo base */
const allPedidosArray = computed<Pedido[]>(() => {
  const items = (pedidos as any).items as Pedido[] | undefined
  const ord   = (pedidos as any).ordenados as Pedido[] | undefined
  return (Array.isArray(items) && items.length ? items : (Array.isArray(ord) ? ord : []))
})

const communitySet = computed(() => {
  const set = new Set<string>(presetCommunities)
  ;[...allPedidosArray.value, ...pedidosRuta.value].forEach(p=>{
    const c = cleanCommunity(p.solicitanteComunidad)
    if (c) set.add(`${c}, Quintana Roo`)
  })
  return Array.from(set).sort((a,b)=> a.localeCompare(b,'es'))
})

/** selects */
const uiOrigin  = ref(originOptions[0])
const uiDest    = ref(communitySet.value[0] || originOptions[0])
const uiStops   = ref<string[]>([]) // paradas seleccionadas manualmente

watch(communitySet, (list)=>{
  if (!list.length) return
  if (!uiDest.value) uiDest.value = list[0]
}, { immediate:true })

function toggleStop(val:string){
  const i = uiStops.value.indexOf(val)
  if (i>=0) uiStops.value.splice(i,1)
  else uiStops.value.push(val)
}
function selectAllStops(){ uiStops.value = communitySet.value.slice(0, 50) }
function clearStops(){ uiStops.value = [] }

/* ===================== Detección de paradas automáticas ===================== */
const autoDetectedStops = ref<string[]>([])
const ONROUTE_THRESHOLD_M = 1000 // 1 km alrededor del trazo
const METERS_PER_DEGREE = 111320 // metros por grado

/** Calcula distancia mínima desde un punto a los vértices del camino */
function minDistanceToPath(pointLL: any, pathLLs: any[]) {
  let best = Infinity, bestIdx = -1
  for (let i = 0; i < pathLLs.length; i++) {
    const d = window.google.maps.geometry.spherical.computeDistanceBetween(pointLL, pathLLs[i])
    if (d < best) { best = d; bestIdx = i }
  }
  return { dist: best, idx: bestIdx }
}

/** Detecta comunidades que están cerca del camino */
async function detectStopsAlongPath(origin: string, destination: string, candidates: string[]) {
  if (!window.google?.maps?.geometry) return []
  
  const originPt = await geocodeOSM(origin)
  const destPt = await geocodeOSM(destination)
  if (!originPt || !destPt) return []

  // Obtener ruta base entre origen y destino
  const route = await new Promise<any>((resolve) => {
    const dirService = new window.google.maps.DirectionsService()
    dirService.route({
      origin: origin,
      destination: destination,
      travelMode: window.google.maps.TravelMode.DRIVING,
      region: 'MX'
    }, (res, status) => {
      if (status === 'OK' && res?.routes?.[0]) {
        resolve(res.routes[0])
      } else {
        resolve(null)
      }
    })
  })

  if (!route) return []

  const pathLLs = route.overview_path
  const poly = new window.google.maps.Polyline({ path: pathLLs })
  const tolDeg = ONROUTE_THRESHOLD_M / METERS_PER_DEGREE

  const picked: {community: string, idx: number, dist: number}[] = []

  for (const candidate of candidates) {
    if (candidate === origin || candidate === destination) continue
    
    const candidatePt = await geocodeOSM(candidate)
    if (!candidatePt) continue

    const pLL = new window.google.maps.LatLng(candidatePt.lat, candidatePt.lng)
    const md = minDistanceToPath(pLL, pathLLs)
    
    // Verificar si está cerca del camino
    let isOnRoute = false
    if (window.google.maps.geometry.poly.isLocationOnEdge) {
      isOnRoute = window.google.maps.geometry.poly.isLocationOnEdge(pLL, poly, tolDeg)
    } else {
      // Fallback: usar distancia a vértices
      isOnRoute = md.dist <= ONROUTE_THRESHOLD_M
    }

    if (md.idx >= 0 && isOnRoute) {
      picked.push({ community: candidate, idx: md.idx, dist: md.dist })
    }
  }

  // Ordenar por posición en el camino
  picked.sort((a, b) => a.idx - b.idx)
  return picked.map(p => p.community)
}

/** Marca automáticamente las paradas detectadas en la UI */
function markAutoStopsInUI(stops: string[]) {
  stops.forEach(stop => {
    if (!uiStops.value.includes(stop)) {
      uiStops.value.push(stop)
    }
  })
  autoDetectedStops.value = stops
}

/* ===================== Direcciones (texto) ===================== */
const originText      = ref('')
const destinationText = ref('')
const waypointsText   = ref('')

/** Por defecto levanta desde pedidos asignados */
function fillFromAssigned(){
  const addresses = pedidosRuta.value.map(p => {
    const c = cleanCommunity(p.solicitanteComunidad)
    return c ? `${c}, Quintana Roo` : 'José María Morelos, Quintana Roo'
  })
  const first = addresses[0] || originOptions[0]
  const last  = addresses.length>1 ? addresses[addresses.length-1] : first
  originText.value      = first
  destinationText.value = last
  waypointsText.value   = addresses.length>2 ? addresses.slice(1, addresses.length-1).join('|') : ''
}

/** Desde UI manual CON detección automática */
async function fillFromUI(reverse=false){
  const o = uiOrigin.value
  const d = uiDest.value || o
  
  // Detectar paradas automáticas
  const candidates = communitySet.value.filter(c => c !== o && c !== d)
  const autoStops = await detectStopsAlongPath(o, d, candidates)
  
  // Combinar paradas manuales + automáticas (sin duplicados)
  const allStops = [
    ...uiStops.value,
    ...autoStops.filter(a => !uiStops.value.includes(a))
  ]

  // Marcar automáticas en UI
  markAutoStopsInUI(autoStops)

  originText.value      = reverse ? d : o
  destinationText.value = reverse ? o : d
  waypointsText.value   = allStops.join('|')
  
  return autoStops.length
}

/* ===================== Google Maps ===================== */
const mapEl = ref<HTMLElement|null>(null)
let map:any=null, dirSrv:any=null, dirRnd:any=null, lastSig=''

const legs = ref<{from:string,to:string,km:number,min:number}[]>([])
const totalKm  = computed(()=> legs.value.reduce((s,l)=>s+l.km,0))
const totalMin = computed(()=> legs.value.reduce((s,l)=>s+l.min,0))

function waitForGoogle():Promise<void>{
  return new Promise(res=>{
    if (window.google?.maps) return res()
    const iv = setInterval(()=>{ if (window.google?.maps){ clearInterval(iv); res() } }, 80)
  })
}
function initMap(){
  if (map || !mapEl.value) return
  map = new window.google.maps.Map(mapEl.value, {
    center:{lat:19.576, lng:-88.05}, zoom:9,
    mapTypeControl:false, fullscreenControl:true, streetViewControl:true
  })
  dirSrv = new window.google.maps.DirectionsService()
  dirRnd = new window.google.maps.DirectionsRenderer({ map })
}
function km(m:number){ return m/1000 }
function min(s:number){ return s/60 }

let drawTimer:any=null
function drawRouteDebounced(){ clearTimeout(drawTimer); drawTimer=setTimeout(drawRoute, 300) }

/* ---- marcadores por defecto (Morelos y Carrillo) usando OSM (gratis) ---- */
let defaultMarkers: any[] = []
function clearDefaultMarkers(){
  defaultMarkers.forEach(m => m.setMap(null))
  defaultMarkers = []
}

async function showDefaultMarkers(){
  if (!map) return
  clearDefaultMarkers()
  const bounds = new window.google.maps.LatLngBounds()
  for (const addr of originOptions){
    const pt = await geocodeOSM(addr)
    if (!pt) continue
    const mk = new window.google.maps.Marker({ map, position: pt as any, title: addr })
    defaultMarkers.push(mk)
    bounds.extend(pt as any)
  }
  if (!bounds.isEmpty()) map.fitBounds(bounds)
}

function drawRoute(){
  if (!map || !dirSrv || !dirRnd) return

  const wps = waypointsText.value
    ? waypointsText.value.split('|').filter(Boolean).map((a:string)=>({location:a, stopover:true}))
    : []

  const req = {
    origin: originText.value || originOptions[0],
    destination: destinationText.value || originText.value || originOptions[0],
    waypoints: wps,
    travelMode: window.google.maps.TravelMode.DRIVING,
    optimizeWaypoints: true,
    language: 'es',
  }
  const sig = JSON.stringify(req)
  if (sig === lastSig) return
  lastSig = sig

  dirSrv.route(req, (res:any, status:string)=>{
    if (status!=='OK' || !res?.routes?.[0]){ legs.value=[]; return }
    clearDefaultMarkers()
    dirRnd.setDirections(res)
    const r = res.routes[0]
    legs.value = (r.legs||[]).map((l:any)=>({
      from: l.start_address||'', to: l.end_address||'',
      km: Number(km(l.distance?.value||0).toFixed(1)),
      min: Math.round(min(l.duration?.value||0))
    }))
    if (r.bounds) map.fitBounds(r.bounds)
  })
}

function resetView(){ // reiniciar vista al último bounds conocido
  const d = dirRnd?.getDirections?.()
  const b = d?.routes?.[0]?.bounds
  if (b) map.fitBounds(b)
}
function clearAll(){
  lastSig=''; legs.value=[]; autoDetectedStops.value=[]
  dirRnd?.set('directions', null)
  showDefaultMarkers()
}

/* ===================== Cercanas (radio 1 km a destino) ===================== */
const nearby = ref<{ comunidad:string, km:number, total:number }[]>([])
const nearbyRadiusKm = 1

const GEO_CACHE_KEY = 'geo_cache_v1'
let geoCache: Record<string, LatLng> = {}
try { geoCache = JSON.parse(localStorage.getItem(GEO_CACHE_KEY)||'{}') } catch { geoCache = {} }
function saveGeo(){ localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(geoCache)) }

async function geocodeOSM(addr:string):Promise<LatLng|null>{
  if (geoCache[addr]) return geoCache[addr]
  try{
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addr)}`
    const res = await fetch(url, { headers:{'Accept-Language':'es'} })
    const data = await res.json()
    if (Array.isArray(data) && data[0]){
      const pt = { lat:Number(data[0].lat), lng:Number(data[0].lon) }
      geoCache[addr] = pt; saveGeo(); return pt
    }
  }catch{}
  return null
}
function haversineKm(a:LatLng,b:LatLng){
  const R=6371, dLat=(b.lat-a.lat)*Math.PI/180, dLng=(b.lng-a.lng)*Math.PI/180
  const s = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2
  return 2*R*Math.asin(Math.sqrt(s))
}

async function computeNearbyToDestination(){
  nearby.value = []
  const dest = destinationText.value?.trim()
  if (!dest) return
  const destPt = await geocodeOSM(dest)
  if (!destPt) return

  const idsActual = new Set<string>((rutaSel.value?.pedidos ?? []) as string[])
  const all = allPedidosArray.value
  const candidatos = all.filter(p =>
    p && !idsActual.has(p.id) &&
    (p.estado==='pendiente' || p.estado==='en_ruta') &&
    !!cleanCommunity(p.solicitanteComunidad)
  )

  const groups: Record<string,{ comunidad:string, km:number, total:number }> = {}
  for (const p of candidatos){
    const comunidad = cleanCommunity(p.solicitanteComunidad)
    const addr = `${comunidad}, Quintana Roo`
    const c = await geocodeOSM(addr)
    if (!c) continue
    const d = haversineKm(destPt, c)
    if (d <= nearbyRadiusKm){
      if (!groups[comunidad]) groups[comunidad] = { comunidad, km:d, total:0 }
      groups[comunidad].total++
      if (d < groups[comunidad].km) groups[comunidad].km = d
    }
  }
  nearby.value = Object.values(groups).sort((a,b)=>a.km-b.km)
}

/* ===================== Emprendedoras / Pedidos seleccionados ===================== */
const emprPorLocalidad = computed(()=>{
  const m = new Map<string, string[]>()
  pedidosRuta.value.forEach(p=>{
    const c = cleanCommunity(p.solicitanteComunidad) || '—'
    const n = p.solicitanteNombre || 'Usuaria'
    if (!m.has(c)) m.set(c, [])
    m.get(c)!.push(n)
  })
  return Array.from(m.entries()).map(([localidad,nombres])=>({ localidad, nombres, total:nombres.length }))
})

/* ===================== Acciones UI ===================== */
async function trazadoOptimizado(){
  const autoCount = await fillFromUI(false)
  drawRouteDebounced()
  computeNearbyToDestination()
  
  // Mostrar mensaje informativo
  if (autoCount > 0) {
    console.log(`Se agregaron ${autoCount} comunidades de paso automáticamente`)
  }
}
async function trazadoRegreso(){
  const autoCount = await fillFromUI(true)
  drawRouteDebounced()
  computeNearbyToDestination()
  
  if (autoCount > 0) {
    console.log(`Se agregaron ${autoCount} comunidades de paso automáticamente`)
  }
}
function limpiarRuta(){
  clearStops()
  autoDetectedStops.value = []
  originText.value=''; destinationText.value=''; waypointsText.value=''
  clearAll()
}

/* ===================== Ciclo de vida ===================== */
onMounted(async ()=>{
  await waitForGoogle()
  initMap()
  if (hasAssigned.value) {
    fillFromAssigned(); drawRouteDebounced(); computeNearbyToDestination()
  } else {
    // Al iniciar sin ruta: mostrar marcadores de Morelos y Carrillo
    showDefaultMarkers()
  }
})
watch([()=>rutaSel.value?.id], ()=>{
  if (hasAssigned.value){ fillFromAssigned(); drawRouteDebounced(); computeNearbyToDestination() }
})
</script>

<template>
  <section class="space-y-5">
    <!-- Topbar -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Mapa de ruta</h1>
      <div class="flex gap-2">
        <button
          class="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
          @click="router.push({ name:'op.ruta', params:{ id: route.params.id } })">
          ← Volver a la ruta
        </button>
        <button class="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/20" @click="resetView">Reiniciar vista</button>
        <button class="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/20" @click="limpiarRuta">Limpiar todo</button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <!-- Lado izquierdo (solo si hay ruta asignada) -->
      <aside v-if="hasAssigned" class="lg:col-span-4 space-y-4">
        <!-- Origen / Destino / Paradas -->
        <div class="rounded-2xl bg-neutral-900/80 border border-white/10 p-4">
          <h3 class="font-semibold mb-3">Origen y paradas</h3>

          <div class="mb-3">
            <div class="text-sm text-white/70 mb-1">Origen</div>
            <select v-model="uiOrigin"
                    class="w-full rounded-xl bg-neutral-800 border border-neutral-600 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:bg-neutral-700 transition-colors cursor-pointer">
              <option v-for="o in originOptions" :key="o" :value="o" class="bg-neutral-800 text-white">{{ o }}</option>
            </select>
          </div>

          <div class="mb-3">
            <div class="text-sm text-white/70 mb-1">Destino</div>
            <select v-model="uiDest"
                    class="w-full rounded-xl bg-neutral-800 border border-neutral-600 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:bg-neutral-700 transition-colors cursor-pointer">
              <option v-for="c in communitySet" :key="c" :value="c" class="bg-neutral-800 text-white">{{ c }}</option>
            </select>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm">Paradas</span>
              <span class="text-xs text-white/60">{{ uiStops.length }} seleccionadas</span>
            </div>

            <!-- Indicador de paradas automáticas -->
            <div v-if="autoDetectedStops.length > 0" class="mb-2 p-2 bg-blue-900/30 border border-blue-500/50 rounded-lg">
              <div class="text-xs text-blue-300">
                <span class="font-semibold">✓ Detección automática:</span> 
                Se agregaron {{ autoDetectedStops.length }} comunidades de paso
              </div>
            </div>

            <div class="flex gap-2 mb-2">
              <button class="rounded-full bg-white/10 px-3 py-1 text-sm hover:bg-white/20" @click="selectAllStops">Seleccionar todo</button>
              <button class="rounded-full bg-white/10 px-3 py-1 text-sm hover:bg-white/20" @click="clearStops">Ninguna</button>
            </div>

            <div class="max-h-60 overflow-y-auto space-y-2 pr-1">
              <label
                v-for="c in communitySet"
                :key="c"
                :class="[
                  'flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors cursor-pointer',
                  autoDetectedStops.includes(c) 
                    ? 'border-blue-500/50 bg-blue-900/20 hover:bg-blue-900/30' 
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                ]">
                <div class="flex items-center gap-2">
                  <input type="checkbox" :checked="uiStops.includes(c)" @change="toggleStop(c)" 
                         class="rounded border-neutral-400 text-emerald-500 focus:ring-emerald-500 cursor-pointer">
                  <span>{{ c }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <span v-if="autoDetectedStops.includes(c)" class="text-xs text-blue-300">automática</span>
                  <span v-else class="text-xs text-white/60">parada</span>
                </div>
              </label>
            </div>

            <p class="text-xs text-white/60 mt-2">
              Sugerencia: marca solo las paradas que realmente visitarás; el orden se optimiza automáticamente.
              <br>Las paradas <span class="text-blue-300">azules</span> se detectaron automáticamente en el camino.
            </p>

            <div class="mt-3 flex gap-2">
              <button class="rounded-xl bg-emerald-600 px-3 py-2 hover:bg-emerald-500 transition-colors" @click="trazadoOptimizado">
                Trazar ruta optimizada
              </button>
              <button class="rounded-xl bg-white/10 px-3 py-2 hover:bg-white/20 transition-colors" @click="limpiarRuta">Limpiar ruta</button>
            </div>
            <button class="mt-2 w-full rounded-xl bg-indigo-600 px-3 py-2 hover:bg-indigo-500 transition-colors" @click="trazadoRegreso">
              Trazar ruta de regreso
            </button>
          </div>
        </div>

        <!-- Cercanas al destino (radio fijo 1km) -->
        <div class="rounded-2xl bg-neutral-900/80 border border-white/10 p-4">
          <div class="flex items-center justify-between mb-1">
            <h3 class="font-semibold">Comunidades cercanas con pedido</h3>
            <span class="text-xs text-white/60">Radio fijo: 1 km</span>
          </div>
          <div v-if="!nearby.length" class="text-sm text-white/60 mt-2">No hay cercanas dentro del radio.</div>
          <div v-else class="mt-3 space-y-2">
            <div
              v-for="n in nearby"
              :key="n.comunidad"
              class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm flex items-center justify-between hover:bg-white/10 transition-colors">
              <div>
                <div class="font-medium">{{ n.comunidad }}</div>
                <div class="text-white/60 text-xs">{{ n.km.toFixed(2) }} km · {{ n.total }} pedido(s)</div>
              </div>
              <a
                class="text-xs rounded bg-white/10 px-2 py-1 hover:bg-white/20 transition-colors"
                :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(n.comunidad + ', Quintana Roo')}`"
                target="_blank">Ver</a>
            </div>
          </div>
        </div>
      </aside>

      <!-- Mapa + tablas -->
      <div class="lg:col-span-8">
        <div class="bg-neutral-900/80 rounded-2xl border border-white/10 p-3 shadow">
          <div class="text-sm text-white/70 mb-2">Previsualización</div>
          <div v-if="!hasAssigned && !legs.length" class="h-[420px] grid place-items-center text-white/60 text-sm">
            Asigna pedidos a la ruta o usa el planificador para generar el mapa.
          </div>
          <div v-else ref="mapEl" class="w-full h-[420px] rounded-xl border border-white/10"></div>

          <!-- Resumen -->
          <div v-if="legs.length" class="mt-4 rounded-2xl bg-white/5 border border-white/10 p-4">
            <h3 class="font-semibold mb-3">Resumen del recorrido</h3>
            <div class="flex flex-wrap gap-2 mb-3">
              <span class="px-2 py-1 rounded text-xs bg-white/10 border border-white/10">Total: {{ totalKm.toFixed(1) }} km</span>
              <span class="px-2 py-1 rounded text-xs bg-white/10 border border-white/10">Tiempo total: {{ totalMin }} min</span>
              <span class="px-2 py-1 rounded text-xs bg-white/10 border border-white/10">{{ originText || uiOrigin }} → {{ destinationText || uiDest }}</span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="text-white/70">
                  <tr class="border-b border-white/10">
                    <th class="text-left py-2 pr-4">#</th>
                    <th class="text-left py-2 pr-4">De</th>
                    <th class="text-left py-2 pr-4">Hacia</th>
                    <th class="text-left py-2 pr-4">Distancia</th>
                    <th class="text-left py-2">Tiempo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(l,i) in legs" :key="i" class="border-b border-white/5">
                    <td class="py-2 pr-4">{{ i+1 }}</td>
                    <td class="py-2 pr-4">{{ l.from }}</td>
                    <td class="py-2 pr-4">{{ l.to }}</td>
                    <td class="py-2 pr-4">{{ l.km.toFixed(1) }} km</td>
                    <td class="py-2">{{ l.min }} min</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Pedidos seleccionados (nombre, comunidad, producto, cantidad) -->
          <div v-if="pedidosRuta.length" class="mt-4 rounded-2xl bg-white/5 border border-white/10 p-4">
            <h3 class="font-semibold mb-3">Pedidos seleccionados (ruta actual)</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="text-white/70">
                  <tr class="border-b border-white/10">
                    <th class="text-left py-2 pr-4">Nombre</th>
                    <th class="text-left py-2 pr-4">Localidad</th>
                    <th class="text-left py-2 pr-4">Producto</th>
                    <th class="text-left py-2">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in pedidosRuta" :key="p.id" class="border-b border-white/5">
                    <td class="py-2 pr-4">{{ p.solicitanteNombre || 'Usuaria' }}</td>
                    <td class="py-2 pr-4">{{ cleanCommunity(p.solicitanteComunidad) || '—' }}</td>
                    <td class="py-2 pr-4">{{ p.producto }}</td>
                    <td class="py-2">{{ p.cantidad }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Emprendedoras -->
          <div v-if="emprPorLocalidad.length" class="mt-4 rounded-2xl bg-white/5 border border-white/10 p-4">
            <h3 class="font-semibold mb-3">Emprendedoras (ruta actual)</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="text-white/70">
                  <tr class="border-b border-white/10">
                    <th class="text-left py-2 pr-4">#</th>
                    <th class="text-left py-2 pr-4">Localidad</th>
                    <th class="text-left py-2 pr-4">Nombres</th>
                    <th class="text-left py-2"># Emprendedoras</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row,i) in emprPorLocalidad" :key="i" class="border-b border-white/5 align-top">
                    <td class="py-2 pr-4">{{ i+1 }}</td>
                    <td class="py-2 pr-4">{{ row.localidad }}</td>
                    <td class="py-2">
                      <ul class="list-disc pl-4">
                        <li v-for="(n,idx) in row.nombres" :key="idx">{{ n }}</li>
                      </ul>
                    </td>
                    <td class="py-2 text-center">{{ row.total }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Estilos mejorados para los selects */
select {
  background-color: #1f2937; /* neutral-800 */
  border-color: #4b5563; /* neutral-600 */
  color: white;
  cursor: pointer;
}

select:hover {
  background-color: #374151; /* neutral-700 */
}

select option {
  background-color: #1f2937; /* neutral-800 */
  color: white;
}

select option:hover {
  background-color: #374151; /* neutral-700 */
}

/* Mejora para los checkboxes */
input[type="checkbox"] {
  border-color: #9ca3af; /* neutral-400 */
}

input[type="checkbox"]:checked {
  background-color: #10b981; /* emerald-500 */
  border-color: #10b981; /* emerald-500 */
}

/* Scrollbar personalizado para la lista de paradas */
.max-h-60::-webkit-scrollbar {
  width: 6px;
}

.max-h-60::-webkit-scrollbar-track {
  background: #1f2937;
  border-radius: 3px;
}

.max-h-60::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 3px;
}

.max-h-60::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>