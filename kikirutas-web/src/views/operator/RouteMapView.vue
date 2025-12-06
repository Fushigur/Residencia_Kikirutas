<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRutasStore } from '@/stores/rutas'
import { usePedidosStore } from '@/stores/pedidos'

declare global { interface Window { google?: any } }

/* ===================== Tipos ===================== */
type PedidoEstado = 'pendiente' | 'en_ruta' | 'entregado' | 'cancelado'
type Pedido = {
  id: string
  producto: string
  cantidad: number
  fechaISO: string
  estado: PedidoEstado
  solicitanteNombre?: string
  solicitanteComunidad?: string
}
// Convierte una dirección de catálogo a LatLng fijo para Directions.
// Si no existe en STATIC_COORDS, se deja el string para que Google lo resuelva.
function asDirectionsLocation(addr: string): any {
  if (!addr) return addr
  const c = STATIC_COORDS[addr]
  if (c && window.google?.maps) {
    return new window.google.maps.LatLng(c.lat, c.lng)
  }
  return addr
}


type LatLng = { lat: number, lng: number }

// Coordenadas fijas Kikibá (tomadas del planner original)
const STATIC_COORDS: Record<string, LatLng> = {
  // Bases
  'José María Morelos, Quintana Roo': { lat: 19.7485, lng: -88.7060 },
  'Felipe Carrillo Puerto, Quintana Roo': { lat: 19.57987006324777, lng: -88.04392203071264 },

  // JMM
  'Candelaria, Quintana Roo': { lat: 19.7362, lng: -88.9580 },
  'Dziuché, Quintana Roo': { lat: 19.8971, lng: -88.8098 },
  'La Presumida, Quintana Roo': { lat: 19.8010, lng: -88.7534 },
  'Santa Gertrudis, Quintana Roo': { lat: 19.7996, lng: -88.7724 },
  'Kancabchén, Quintana Roo': { lat: 19.7139, lng: -88.8612 },
  'Cafetalito, Quintana Roo': { lat: 19.7276, lng: -88.7990 },
  'Cafetal Grande, Quintana Roo': { lat: 19.7163, lng: -88.8217 },
  'Benito Juárez, Quintana Roo': { lat: 19.7107, lng: -88.7707 },
  'Pozo Pirata, Quintana Roo': { lat: 19.6149, lng: -88.8900 },
  'San Carlos, Quintana Roo': { lat: 19.6336, lng: -88.9393 },
  'Chunhuhub, Quintana Roo': { lat: 19.5850, lng: -88.5914 },
  'Polyuc, Quintana Roo': { lat: 19.6099, lng: -88.5612 },
  'Dos Aguadas, Quintana Roo': { lat: 19.6663, lng: -88.6984 },
  'El Naranjal, Quintana Roo': { lat: 19.6449, lng: -88.7857 },
  'Othón P. Blanco, Quintana Roo': { lat: 19.6203, lng: -89.0054 },
  'Puerto Arturo, Quintana Roo': { lat: 19.6591, lng: -89.0668 },

  // FCP
  'Dzulá, Quintana Roo': { lat: 19.602682832330864, lng: -88.41559225310304 },
  'X-Yatil, Quintana Roo': { lat: 19.662795041921463, lng: -88.4435691850896 },
  'El Señor, Quintana Roo': { lat: 19.843208408219397, lng: -88.13529197133691 },
  'Tihosuco, Quintana Roo': { lat: 20.19546282557715, lng: -88.37403728985683 },
}

// Normaliza direcciones para compararlas sin importar mayúsculas/acentos/espacios
function canonAddr(addr: string): string {
  return (addr ?? '')
    .normalize('NFD')                     // separa letras y acentos
    .replace(/[\u0300-\u036f]/g, '')      // quita acentos
    .toLowerCase()
    .replace(/[.,]/g, ' ')                // quita puntos/comas
    .replace(/-/g, ' ')                   // "x yatil" == "x-yatil"
    .replace(/\s+/g, ' ')                 // colapsa espacios
    .trim()
}

// Mapa canónico de las coords estáticas
const STATIC_COORDS_CANON: Record<string, LatLng> = {}
const STATIC_LABELS_CANON: Record<string, string> = {}

for (const key in STATIC_COORDS) {
  const canon = canonAddr(key)
  STATIC_COORDS_CANON[canon] = STATIC_COORDS[key]
  STATIC_LABELS_CANON[canon] = key   // para usarlo como título del marcador
}


/* ===================== Stores ===================== */
const route = useRoute()
const router = useRouter()
const rutas = useRutasStore()
const pedidos = usePedidosStore()
const mapReady = ref(false)

onMounted(() => { rutas.load?.(); pedidos.load?.() })

const rutaSel = computed(() => rutas.byId?.(String(route.params.id)) ?? null)

/* ------------------ Pedidos asignados a la ruta ------------------ */
const pedidosRuta = computed<Pedido[]>(() => {
  const ids = (rutaSel.value?.pedidos ?? []) as string[]
  if (!ids.length) return []
  const get = (pedidos as any).byId as ((id: string) => Pedido | undefined) | undefined
  return get ? ids.map(id => get(id)).filter(Boolean) as Pedido[] : []
})
const hasAssigned = computed(() => pedidosRuta.value.length > 0)

/* ===================== UI de planificador ===================== */
/** bases para origen */
const originOptions = ['José María Morelos, Quintana Roo', 'Felipe Carrillo Puerto, Quintana Roo']

/** catálogo base de localidades (separadas por base) */
const jmmCommunities = [
  'Candelaria', 'Dziuché', 'La Presumida', 'Santa Gertrudis', 'Kancabchén',
  'Cafetalito', 'Cafetal Grande', 'Benito Juárez', 'Pozo Pirata', 'San Carlos',
  'Chunhuhub', 'Polyuc', 'Dos Aguadas', 'El Naranjal', 'Othón P. Blanco',
  'Puerto Arturo',
].map(c => `${c}, Quintana Roo`)

const fcpCommunities = [
  'Dzulá', 'X-Yatil', 'El Señor', 'Tihosuco',
].map(c => `${c}, Quintana Roo`)

/** universo combinado (para detecciones, etc.) */
const presetCommunities = [...jmmCommunities, ...fcpCommunities]

/** util para limpiar comunidades inválidas (—, --- , vacíos) */
const cleanCommunity = (s?: string) => {
  const t = (s ?? '').replace(/\s+/g, ' ').trim()
  return t && !/^[-—]+$/.test(t) ? t : ''
}

/** Helper para formatear dirección completa evitando duplicados */
const toAddress = (community: string) => {
  if (!community) return ''
  return community.endsWith(', Quintana Roo') ? community : `${community}, Quintana Roo`
}

const formatEstado = (e: PedidoEstado) => {
  switch (e) {
    case 'pendiente': return 'Pendiente'
    case 'en_ruta': return 'En ruta'
    case 'entregado': return 'Entregado'
    case 'cancelado': return 'Cancelado'
    default: return e
  }
}


/** comunidades detectadas desde pedidos + catálogo base */
const allPedidosArray = computed<Pedido[]>(() => {
  const items = (pedidos as any).items as Pedido[] | undefined
  const ord = (pedidos as any).ordenados as Pedido[] | undefined
  return (Array.isArray(items) && items.length ? items : (Array.isArray(ord) ? ord : []))
})

const communitySet = computed(() => {
  const set = new Set<string>(presetCommunities)
    ;[...allPedidosArray.value, ...pedidosRuta.value].forEach(p => {
      const c = cleanCommunity(p.solicitanteComunidad)
      if (c) set.add(toAddress(c))
    })
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))
})

/** comunidades visibles
 *  communitySet ya incluye:
 *  - todas las comunidades “preset” (JMM + FCP)
 *  - TODAS las comunidades que aparecen en pedidos (JMM o FCP)
 */
const filteredCommunities = computed(() => {
  return communitySet.value
})

/** selects */
const uiOrigin = ref(originOptions[0])
// El destino se inicializa vacío; initAutoRoute o el watch lo ajustan
const uiDest = ref<string>('')
const uiStops = ref<string[]>([]) // paradas seleccionadas manualmente

watch(filteredCommunities, (list) => {
  if (!list.length) return
  // Solo inicializamos si todavía no hay destino;
  // si initAutoRoute ya lo puso, NO lo tocamos.
  if (!uiDest.value) {
    uiDest.value = list[0]
  }
}, { immediate: true })

function toggleStop(val: string) {
  const i = uiStops.value.indexOf(val)
  if (i >= 0) uiStops.value.splice(i, 1)
  else uiStops.value.push(val)
}

function selectAllStops() {
  uiStops.value = filteredCommunities.value.slice(0, 50)
}

function clearStops() {
  uiStops.value = []
}

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

  // Obtener ruta base entre origen y destino (usando LatLng fijos si existen)
  const route = await new Promise<any>((resolve) => {
    const dirService = new window.google.maps.DirectionsService()
    dirService.route({
      origin: asDirectionsLocation(origin),
      destination: asDirectionsLocation(destination),
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

  const picked: { community: string, idx: number, dist: number }[] = []

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
const originText = ref('')
const destinationText = ref('')
const waypointsText = ref('')

/** Por defecto levanta desde pedidos asignados */
function fillFromAssigned() {
  const addresses = pedidosRuta.value.map(p => {
    const c = cleanCommunity(p.solicitanteComunidad)
    return c ? toAddress(c) : 'José María Morelos, Quintana Roo'
  })
  const first = addresses[0] || originOptions[0]
  const last = addresses.length > 1 ? addresses[addresses.length - 1] : first
  originText.value = first
  destinationText.value = last
  waypointsText.value = addresses.length > 2 ? addresses.slice(1, addresses.length - 1).join('|') : ''
}

/** Desde UI manual CON detección automática */
async function fillFromUI(reverse = false) {
  const o = uiOrigin.value
  const d = uiDest.value || o

  // Detectar paradas automáticas (SOLO comunidades de la base seleccionada)
  const candidates = filteredCommunities.value.filter(c => c !== o && c !== d)
  const autoStops = await detectStopsAlongPath(o, d, candidates)

  // Combinar paradas manuales + automáticas (sin duplicados)
  const allStops = [
    ...uiStops.value,
    ...autoStops.filter(a => !uiStops.value.includes(a))
  ]

  // Marcar automáticas en UI
  markAutoStopsInUI(autoStops)

  originText.value = reverse ? d : o
  destinationText.value = reverse ? o : d
  waypointsText.value = allStops.join('|')

  return autoStops.length
}

/* ===================== Google Maps ===================== */
const mapEl = ref<HTMLElement | null>(null)
let map: any = null, dirSrv: any = null, dirRnd: any = null, lastSig = ''

const legs = ref<{ from: string, to: string, km: number, min: number }[]>([])
const totalKm = computed(() => legs.value.reduce((s, l) => s + l.km, 0))
const totalMin = computed(() => legs.value.reduce((s, l) => s + l.min, 0))

function waitForGoogle(): Promise<void> {
  return new Promise(res => {
    if (window.google?.maps) return res()
    const iv = setInterval(() => { if (window.google?.maps) { clearInterval(iv); res() } }, 80)
  })
}
function initMap() {
  if (map || !mapEl.value) return
  map = new window.google.maps.Map(mapEl.value, {
    center: { lat: 19.576, lng: -88.05 }, zoom: 9,
    mapTypeControl: false, fullscreenControl: true, streetViewControl: true
  })
  dirSrv = new window.google.maps.DirectionsService()
  dirRnd = new window.google.maps.DirectionsRenderer({ map })
}
function km(m: number) { return m / 1000 }
function min(s: number) { return s / 60 }

let drawTimer: any = null
function drawRouteDebounced() { clearTimeout(drawTimer); drawTimer = setTimeout(drawRoute, 300) }

/* ---- marcadores por defecto (Morelos y Carrillo) ---- */
let defaultMarkers: any[] = []
function clearDefaultMarkers() {
  defaultMarkers.forEach(m => m.setMap(null))
  defaultMarkers = []
}

async function showDefaultMarkers() {
  if (!map) return
  clearDefaultMarkers()
  const bounds = new window.google.maps.LatLngBounds()
  for (const addr of originOptions) {
    const pt = await geocodeOSM(addr)
    if (!pt) continue
    const mk = new window.google.maps.Marker({ map, position: pt as any, title: addr })
    defaultMarkers.push(mk)
    bounds.extend(pt as any)
  }
  if (!bounds.isEmpty()) map.fitBounds(bounds)
}

/* ---- marcadores de comunidades de los pedidos ---- */
let communityMarkers: any[] = []

function clearCommunityMarkers() {
  communityMarkers.forEach(m => m.setMap(null))
  communityMarkers = []
}

// Muestra un pin por cada comunidad de los pedidos de la ruta actual.
// Solo usa coordenadas fijas (STATIC_COORDS), sin geocoder externo.
function showCommunityMarkersFromPedidos() {
  if (!map) {
    console.warn('[showCommunityMarkersFromPedidos] mapa aún no está listo')
    return
  }

  clearCommunityMarkers()

  const pedidosList = pedidosRuta.value ?? []
  if (!pedidosList.length) return

  const canonSet = new Set<string>()
  const bounds = new window.google.maps.LatLngBounds()

  for (const pedido of pedidosList) {
    const comunidadLimpia = cleanCommunity(pedido.solicitanteComunidad)
    if (!comunidadLimpia) continue

    const addr = toAddress(comunidadLimpia)      // "Dzula" -> "Dzula, Quintana Roo"
    const canon = canonAddr(addr)               // "dzula quintana roo"

    if (canonSet.has(canon)) continue           // ya dibujamos esta comunidad
    canonSet.add(canon)

    const coord = STATIC_COORDS_CANON[canon]
    if (!coord) {
      console.warn('[showCommunityMarkersFromPedidos] comunidad sin coords fijas:', addr)
      continue
    }

    const marker = new window.google.maps.Marker({
      map,
      position: coord as any,
      title: STATIC_LABELS_CANON[canon] ?? addr,
    })

    communityMarkers.push(marker)
    bounds.extend(marker.getPosition()!)
  }

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds)
  }
}

function drawRoute() {
  if (!map || !dirSrv || !dirRnd) return

  // Waypoints en texto crudo (para el "signature")
  const rawWps = waypointsText.value
    ? waypointsText.value.split('|').filter(Boolean)
    : []

  // Waypoints para Directions: usar LatLng fijo si existe
  const wps = rawWps.map((a: string) => ({
    location: asDirectionsLocation(a),
    stopover: true,
  }))

  const originAddr = originText.value || originOptions[0]
  const destAddr = destinationText.value || originText.value || originOptions[0]

  // Para evitar recalcular la misma ruta usamos una firma basada en los STRINGS,
  // no en los LatLng de Google (que no se serializan bien).
  const sigPayload = {
    origin: originAddr,
    destination: destAddr,
    waypoints: rawWps,
  }
  const sig = JSON.stringify(sigPayload)
  if (sig === lastSig) return
  lastSig = sig

  const req: any = {
    origin: asDirectionsLocation(originAddr),
    destination: asDirectionsLocation(destAddr),
    travelMode: window.google.maps.TravelMode.DRIVING,
    optimizeWaypoints: true,
    language: 'es',
  }
  if (wps.length) req.waypoints = wps

  dirSrv.route(req, (res: any, status: string) => {
    if (status !== 'OK' || !res?.routes?.[0]) { legs.value = []; return }
    clearDefaultMarkers()
    dirRnd.setDirections(res)
    const r = res.routes[0]
    legs.value = (r.legs || []).map((l: any) => ({
      from: l.start_address || '', to: l.end_address || '',
      km: Number(km(l.distance?.value || 0).toFixed(1)),
      min: Math.round(min(l.duration?.value || 0))
    }))
    if (r.bounds) map.fitBounds(r.bounds)
  })
}

function resetView() { // reiniciar vista al último bounds conocido
  const d = dirRnd?.getDirections?.()
  const b = d?.routes?.[0]?.bounds
  if (b) map.fitBounds(b)
}

function clearAll() {
  lastSig = ''; legs.value = []; autoDetectedStops.value = []
  dirRnd?.set('directions', null)
  clearCommunityMarkers()
  showDefaultMarkers()
}

/* ===================== Cercanas (radio 1 km a destino) ===================== */
const nearby = ref<{ comunidad: string, km: number, total: number }[]>([])
const nearbyRadiusKm = 1

const GEO_CACHE_KEY = 'geo_cache_v1'
let geoCache: Record<string, LatLng> = {}
try { geoCache = JSON.parse(sessionStorage.getItem(GEO_CACHE_KEY) || '{}') } catch { geoCache = {} }
function saveGeo() { sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(geoCache)) }

async function geocodeOSM(addr: string): Promise<LatLng | null> {
  if (!addr) return null

  const canon = canonAddr(addr)

  // 1) Primero usar coordenadas fijas (bases y comunidades)
  const staticHit = STATIC_COORDS_CANON[canon]
  if (staticHit) {
    return staticHit
  }

  // 2) Después cache local (también por clave canónica)
  if (geoCache[canon]) return geoCache[canon]

  // 3) Si no está en estático, pedir a Nominatim UNA sola vez
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addr)}`
    const res = await fetch(url, { headers: { 'Accept-Language': 'es' } })
    const data = await res.json()
    if (Array.isArray(data) && data[0]) {
      const pt = { lat: Number(data[0].lat), lng: Number(data[0].lon) }
      geoCache[canon] = pt
      saveGeo()
      return pt
    }
  } catch {
    // silencioso
  }
  return null
}


function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

async function computeNearbyToDestination() {
  nearby.value = []
  const dest = destinationText.value?.trim()
  if (!dest) return
  const destPt = await geocodeOSM(dest)
  if (!destPt) return

  const idsActual = new Set<string>((rutaSel.value?.pedidos ?? []) as string[])
  const all = allPedidosArray.value
  const candidatos = all.filter(p =>
    p && !idsActual.has(p.id) &&
    (p.estado === 'pendiente' || p.estado === 'en_ruta') &&
    !!cleanCommunity(p.solicitanteComunidad)
  )

  const groups: Record<string, { comunidad: string, km: number, total: number }> = {}
  for (const p of candidatos) {
    const comunidad = cleanCommunity(p.solicitanteComunidad)
    const addr = toAddress(comunidad)
    const c = await geocodeOSM(addr)
    if (!c) continue
    const d = haversineKm(destPt, c)
    if (d <= nearbyRadiusKm) {
      if (!groups[comunidad]) groups[comunidad] = { comunidad, km: d, total: 0 }
      groups[comunidad].total++
      if (d < groups[comunidad].km) groups[comunidad].km = d
    }
  }
  nearby.value = Object.values(groups).sort((a, b) => a.km - b.km)
}

/* ===================== Emprendedoras / Pedidos seleccionados ===================== */
const emprPorLocalidad = computed(() => {
  const m = new Map<string, string[]>()
  pedidosRuta.value.forEach(p => {
    const c = cleanCommunity(p.solicitanteComunidad) || '—'
    const n = p.solicitanteNombre || 'Usuaria'
    if (!m.has(c)) m.set(c, [])
    m.get(c)!.push(n)
  })
  return Array.from(m.entries()).map(([localidad, nombres]) => ({ localidad, nombres, total: nombres.length }))
})

/* ===================== Acciones UI ===================== */
async function trazadoOptimizado() {
  const autoCount = await fillFromUI(false)
  drawRouteDebounced()
  computeNearbyToDestination()

  // Mostrar mensaje informativo
  if (autoCount > 0) {
    console.log(`Se agregaron ${autoCount} comunidades de paso automáticamente`)
  }
}
async function trazadoRegreso() {
  const autoCount = await fillFromUI(true)
  drawRouteDebounced()
  computeNearbyToDestination()

  // Mostrar mensaje informativo
  if (autoCount > 0) {
    console.log(`Se agregaron ${autoCount} comunidades de paso automáticamente`)
  }
}
function limpiarRuta() {
  clearStops()
  autoDetectedStops.value = []
  originText.value = ''; destinationText.value = ''; waypointsText.value = ''
  clearAll()
}

async function marcarEntregado(id: string) {
  if (!rutaSel.value) return

  // Actualizamos en backend y en el store
  const ok = await pedidos.setEstado(id, 'entregado', {
    routeId: String(rutaSel.value.id),
  })

  if (!ok) {
    console.warn('No se pudo marcar como entregado el pedido', id)
    return
  }

  // Si en esta misma pestaña tienes otros componentes que usan usePedidosStore,
  // se actualizarán en automático. En otras pestañas, se verá al recargar.
}

function buildRouteFromCurrentSelection() {
  const o = uiOrigin.value
  const d = uiDest.value || o

  // Solo usamos las paradas que ya están en uiStops (las de los pedidos)
  const allStops = uiStops.value.slice()

  originText.value = o
  destinationText.value = d
  waypointsText.value = allStops.join('|')

  // Dibujar ruta y calcular cercanas
  drawRouteDebounced()
  computeNearbyToDestination()
}


/* ===================== Lógica de Auto-Inicialización ===================== */

// Configura automáticamente el mapa a partir de los pedidos de la ruta
async function initAutoRoute() {
  // 1) Si no hay pedidos en la ruta, mostrar solo las bases
  if (!pedidosRuta.value.length) {
    await showDefaultMarkers()
    return
  }

  // 2) Hay pedidos: quitamos marcadores por defecto de las bases
  clearDefaultMarkers()

  // Comunidades únicas de los pedidos (JMM y FCP)
  const comunidadesDePedidos = new Set<string>()
  for (const p of pedidosRuta.value) {
    const c = cleanCommunity(p.solicitanteComunidad)
    if (c) comunidadesDePedidos.add(toAddress(c))
  }

  const listaComunidades = Array.from(comunidadesDePedidos)
  if (!listaComunidades.length) {
    await showDefaultMarkers()
    return
  }

  // 3) Elegir BASE (origen) según dónde caen más comunidades (solo para el select)
  let jmmCount = 0
  let fcpCount = 0
  for (const addr of listaComunidades) {
    if (jmmCommunities.includes(addr)) jmmCount++
    if (fcpCommunities.includes(addr)) fcpCount++
  }

  uiOrigin.value = fcpCount > jmmCount ? originOptions[1] : originOptions[0]

  // 4) Destino y paradas solo para mostrar algo coherente en la UI
  const destino = listaComunidades[listaComunidades.length - 1]
  uiDest.value = destino
  uiStops.value = listaComunidades.filter(c => c !== destino)

  console.log('[initAutoRoute] solo pines de pedidos', {
    origin: uiOrigin.value,
    dest: uiDest.value,
    stops: uiStops.value,
  })

  // 5) 🔹 Lo importante: pintar SOLO los pines de las comunidades con pedido
  showCommunityMarkersFromPedidos()

  // 🔸 NO llamamos a buildRouteFromCurrentSelection()
  // 🔸 NO llamamos a trazadoOptimizado()
}


/* ===================== Ciclo de vida (mapa operador) ===================== */

// Preparamos Google Maps y mostramos solo las bases mientras cargan los datos
onMounted(async () => {
  await waitForGoogle()
  initMap()
  await showDefaultMarkers()   // esperamos a que ponga las bases
  mapReady.value = true        // ahora sí, el mapa está listo
})

// Para no correr initAutoRoute más de una vez por ruta
const autoRouteInitialized = ref(false)

watch(
  [() => hasAssigned.value, () => rutaSel.value?.id, () => mapReady.value],
  async ([has, id, ready]) => {
    // Necesitamos ruta con pedidos, mapa listo y que aún no se haya inicializado
    if (!has || !id || !ready || autoRouteInitialized.value) return

    autoRouteInitialized.value = true
    await initAutoRoute()
  },
  { immediate: true }
)
</script>

<template>
  <section class="space-y-5">
    <!-- Topbar -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Mapa de ruta</h1>
      <div class="flex gap-2">
        <button class="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
          @click="router.push({ name: 'op.ruta', params: { id: route.params.id } })">
          Volver a la ruta
        </button>
        <button class="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/20" @click="resetView">Reiniciar
          vista</button>
        <button class="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/20" @click="limpiarRuta">Limpiar
          todo</button>
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
            <select v-model="uiDest" class="w-full rounded-xl bg-neutral-800 border border-neutral-600 text-white px-3 py-2
                    focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:bg-neutral-700
                    transition-colors cursor-pointer">
              <option v-for="c in filteredCommunities" :key="c" :value="c" class="bg-neutral-800 text-white">
                {{ c }}
              </option>
            </select>
          </div>


          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm">Paradas</span>
              <span class="text-xs text-white/60">{{ uiStops.length }} seleccionadas</span>
            </div>

            <div class="flex gap-2 mb-2">
              <button class="rounded-full bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
                @click="selectAllStops">Seleccionar todo</button>
              <button class="rounded-full bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
                @click="clearStops">Ninguna</button>
            </div>
            <!-- desde aqui -->
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm">Paradas</span>
              <span class="text-xs text-white/60">{{ uiStops.length }} seleccionadas</span>
            </div>

            <!-- Indicador de paradas automáticas -->
            <div v-if="autoDetectedStops.length > 0"
              class="mb-2 p-2 bg-blue-900/30 border border-blue-500/50 rounded-lg">
              <div class="text-xs text-blue-300">
                <span class="font-semibold">✓ Detección automática:</span>
                Se agregaron {{ autoDetectedStops.length }} comunidades de paso
              </div>
            </div>

            <div class="max-h-60 overflow-y-auto space-y-2 pr-1">
              <label v-for="c in filteredCommunities" :key="c" :class="[
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
                  <span v-if="autoDetectedStops.includes(c)" class="text-xs text-blue-300">
                    automática
                  </span>
                  <span v-else class="text-xs text-white/60">
                    parada
                  </span>
                </div>
              </label>
            </div>

            <p class="text-xs text-white/60 mt-2">
              Sugerencia: marca solo las paradas que realmente visitarás; el orden se optimiza automáticamente.
              <br>Las paradas <span class="text-blue-300">azules</span> se detectaron automáticamente en el camino.
            </p>

            <div class="mt-3 flex gap-2">
              <button class="rounded-xl bg-emerald-600 px-3 py-2 hover:bg-emerald-500 transition-colors"
                @click="trazadoOptimizado">
                Trazar ruta optimizada
              </button>
              <button class="rounded-xl bg-white/10 px-3 py-2 hover:bg-white/20 transition-colors" @click="limpiarRuta">
                Limpiar ruta
              </button>
            </div>
            <button class="mt-2 w-full rounded-xl bg-indigo-600 px-3 py-2 hover:bg-indigo-500 transition-colors"
              @click="trazadoRegreso">
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
            <div v-for="n in nearby" :key="n.comunidad"
              class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm flex items-center justify-between hover:bg-white/10 transition-colors">
              <div>
                <div class="font-medium">{{ n.comunidad }}</div>
                <div class="text-white/60 text-xs">{{ n.km.toFixed(2) }} km · {{ n.total }} pedido(s)</div>
              </div>
              <a class="text-xs rounded bg-white/10 px-2 py-1 hover:bg-white/20 transition-colors"
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

          <!-- 🔹 Mapa siempre renderizado + overlay cuando no hay ruta -->
          <div class="relative">
            <div ref="mapEl" class="w-full h-[420px] rounded-xl border border-white/10"></div>

            <div v-if="!hasAssigned && !legs.length" class="absolute inset-0 grid place-items-center text-white/60 text-sm
                     bg-neutral-900/70 pointer-events-none rounded-xl">
              Asigna pedidos a la ruta o usa el planificador para generar el mapa.
            </div>
          </div>

          <!-- Resumen -->
          <div v-if="legs.length" class="mt-4 rounded-2xl bg-white/5 border border-white/10 p-4">
            <h3 class="font-semibold mb-3">Resumen del recorrido</h3>
            <div class="flex flex-wrap gap-2 mb-3">
              <span class="px-2 py-1 rounded text-xs bg-white/10 border border-white/10">
                Total: {{ totalKm.toFixed(1) }} km
              </span>
              <span class="px-2 py-1 rounded text-xs bg-white/10 border border-white/10">
                Tiempo total: {{ totalMin }} min
              </span>
              <span class="px-2 py-1 rounded text-xs bg-white/10 border border-white/10">
                {{ originText || uiOrigin }} → {{ destinationText || uiDest }}
              </span>
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
                  <tr v-for="(l, i) in legs" :key="i" class="border-b border-white/5">
                    <td class="py-2 pr-4">{{ i + 1 }}</td>
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
                    <th class="text-left py-2">Estado</th>
                    <th class="text-left py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in pedidosRuta" :key="p.id" class="border-b border-white/5">
                    <td class="py-2 pr-4">{{ p.solicitanteNombre || 'Usuaria' }}</td>
                    <td class="py-2 pr-4">{{ cleanCommunity(p.solicitanteComunidad) || '—' }}</td>
                    <td class="py-2 pr-4">{{ p.producto }}</td>
                    <td class="py-2">{{ p.cantidad }}</td>

                    <!-- Estado visual -->
                    <td class="py-2">
                      <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" :class="{
                        'bg-yellow-500/20 text-yellow-300': p.estado === 'pendiente',
                        'bg-sky-500/20 text-sky-300': p.estado === 'en_ruta',
                        'bg-emerald-500/20 text-emerald-300': p.estado === 'entregado',
                        'bg-rose-500/20 text-rose-300': p.estado === 'cancelado',
                      }">
                        {{ formatEstado(p.estado) }}
                      </span>
                    </td>

                    <!-- Acción Entregada -->
                    <td class="py-2">
                      <button v-if="p.estado !== 'entregado'" type="button"
                        class="text-xs rounded-full bg-emerald-600 hover:bg-emerald-500 px-3 py-1"
                        @click="marcarEntregado(p.id)">
                        Entregada
                      </button>
                      <span v-else class="text-xs text-white/60">Completado</span>
                    </td>
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
                  <tr v-for="(row, i) in emprPorLocalidad" :key="i" class="border-b border-white/5 align-top">
                    <td class="py-2 pr-4">{{ i + 1 }}</td>
                    <td class="py-2 pr-4">{{ row.localidad }}</td>
                    <td class="py-2">
                      <ul class="list-disc pl-4">
                        <li v-for="(n, idx) in row.nombres" :key="idx">{{ n }}</li>
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
  background-color: #1f2937;
  /* neutral-800 */
  border-color: #4b5563;
  /* neutral-600 */
  color: white;
  cursor: pointer;
}

select:hover {
  background-color: #374151;
  /* neutral-700 */
}

select option {
  background-color: #1f2937;
  /* neutral-800 */
  color: white;
}

select option:hover {
  background-color: #374151;
  /* neutral-700 */
}

/* Mejora para los checkboxes */
input[type="checkbox"] {
  border-color: #9ca3af;
  /* neutral-400 */
}

input[type="checkbox"]:checked {
  background-color: #10b981;
  /* emerald-500 */
  border-color: #10b981;
  /* emerald-500 */
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