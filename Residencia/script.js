// ================= Rutas Kikibá – Script consolidado (corregido) =================
// Carga Google Maps con:
// <script src="https://maps.googleapis.com/maps/api/js?key=TU_API_KEY&libraries=places,geometry&callback=initApp" async defer></script>

// ======== Precios de combustibles (MXN/L) ========
const PRECIOS_COMBUSTIBLE = {
  regular: 24.87,
  premium: 26.73,
  diesel: 26.41,
};

// ======== Estado (última ruta) ========
let lastRouteStops = [];      // [{id,nombre,pos}, ...] (SIN origen)
let lastRouteDestino = null;  // {id,nombre,pos}
let lastRouteBaseId = null;   // 'jmm' | 'fcp'

// ======== Google Maps ========
let map = null;
let directionsService = null;
let directionsRenderer = null;        // ida principal
let directionsRendererReturn = null;  // regreso
let directionsRendererUser = null;    // desde ubicación del usuario
let searchAC = null;
let markers = [];

// ======== Bases fijas (JMM/FCP) y destinos por base ========
const BASES = [
  { id: 'jmm', nombre: 'José María Morelos', pos: { lat: 19.7485, lng: -88.7060 } },
  { id: 'fcp', nombre: 'Felipe Carrillo Puerto', pos: { lat: 19.57987006324777, lng: -88.04392203071264 } },
];

const ESCENARIOS = {
  jmm: {
    origen: BASES[0],
    destinos: [
      { id: 'candelaria', nombre: 'Candelaria', pos: { lat: 19.7362, lng: -88.9580 } },
      { id: 'dziuche', nombre: 'Dziuché', pos: { lat: 19.8971, lng: -88.8098 } },
      { id: 'la-presumida', nombre: 'La Presumida', pos: { lat: 19.8010, lng: -88.7534 } },
      { id: 'santa-gertrudis', nombre: 'Santa Gertrudis', pos: { lat: 19.7996, lng: -88.7724 } },
      { id: 'kancabchen', nombre: 'Kancabchén', pos: { lat: 19.7139, lng: -88.8612 } },
      { id: 'cafetalito', nombre: 'Cafetalito', pos: { lat: 19.7276, lng: -88.7990 } },
      { id: 'cafetal-grande', nombre: 'Cafetal Grande', pos: { lat: 19.7163, lng: -88.8217 } },
      { id: 'benito-juarez', nombre: 'Benito Juárez', pos: { lat: 19.7106, lng: -88.7707 } },
      { id: 'pozo-pirata', nombre: 'Pozo Pirata', pos: { lat: 19.6149, lng: -88.8900 } },
      { id: 'san-carlos', nombre: 'San Carlos', pos: { lat: 19.6336, lng: -88.9393 } },
      { id: 'chunhuhub', nombre: 'Chunhuhub', pos: { lat: 19.5850, lng: -88.5914 } },
      { id: 'polyuc', nombre: 'Polyuc', pos: { lat: 19.6099, lng: -88.5612 } },
      { id: 'dos-aguadas', nombre: 'Dos Aguadas', pos: { lat: 19.6663, lng: -88.6984 } },
      { id: 'el-naranjal', nombre: 'El Naranjal', pos: { lat: 19.6449, lng: -88.7857 } },
      { id: 'othon-p-blanco', nombre: 'Othón P. Blanco', pos: { lat: 19.6203, lng: -89.0054 } },
      { id: 'puerto-arturo', nombre: 'Puerto Arturo', pos: { lat: 19.6591, lng: -89.0668 } },
    ],
  },
  fcp: {
    origen: BASES[1],
    destinos: [
      { id: 'dzula', nombre: 'Dzulá', pos: { lat: 19.602682832330864, lng: -88.41559225310304 } },
      { id: 'X-Yatil', nombre: 'X-Yatil', pos: { lat: 19.662795041921463, lng: -88.4435691850896 } },
      { id: 'el-senor', nombre: 'El Señor', pos: { lat: 19.843208408219397, lng: -88.13529197133691 } },
      { id: 'tihosuco', nombre: 'Tihosuco', pos: { lat: 20.19546282557715, lng: -88.37403728985683 } },
    ],
  },
};

// Universo combinado (opcional)
const COMUNIDADES = [...ESCENARIOS.jmm.destinos, ...ESCENARIOS.fcp.destinos];

// ======== Auto-paradas "de paso" ========
const ONROUTE_THRESHOLD_M = 1000;     // 1 km alrededor del trazo
const METERS_PER_DEGREE = 111320;     // ≈ metros por grado (Q. Roo ~ ecuador)

const ll = (pos) => new google.maps.LatLng(pos.lat, pos.lng);

// Selección persistente por base: { jmm: Set(ids), fcp: Set(ids) }
const selectedByBase = { jmm: new Set(), fcp: new Set() };

/** Distancia mínima desde un punto a los vértices (fallback para ordenar) */
function minDistanceToPath(pointLL, pathLLs) {
  let best = Infinity, bestIdx = -1;
  for (let i = 0; i < pathLLs.length; i++) {
    const d = google.maps.geometry.spherical.computeDistanceBetween(pointLL, pathLLs[i]);
    if (d < best) { best = d; bestIdx = i; }
  }
  return { dist: best, idx: bestIdx };
}

/**
 * Devuelve comunidades "de paso".
 * Usa isLocationOnEdge con tolerancia EN GRADOS (correcto para Google Maps).
 * Si no está geometry.poly, cae al muestreo por vértices.
 */
function getStopsAlongPath(pathLLs, candidates, thresholdM = ONROUTE_THRESHOLD_M) {
  const picked = [];
  const poly = new google.maps.Polyline({ path: pathLLs });
  const tolDeg = thresholdM / METERS_PER_DEGREE;

  const hasIsOnEdge = !!(google.maps.geometry && google.maps.geometry.poly && google.maps.geometry.poly.isLocationOnEdge);

  for (const c of candidates) {
    const pLL = ll(c.pos);

    // Siempre calculamos el vértice más cercano para ORDENAR
    const md = minDistanceToPath(pLL, pathLLs);
    const idx = md.idx;
    const dist = md.dist;

    let pass = false;
    if (hasIsOnEdge) {
      // Cercanía real a segmentos con tolerancia en GRADOS
      pass = google.maps.geometry.poly.isLocationOnEdge(pLL, poly, tolDeg);
    } else {
      // Fallback: vértices
      pass = dist <= thresholdM;
    }

    if (idx >= 0 && pass) {
      picked.push({ ...c, _nearestIndex: idx, _nearestDist: dist });
    }
  }

  picked.sort((a, b) => a._nearestIndex - b._nearestIndex);
  return picked;
}

/** Marca en la UI las paradas auto-detectadas “de paso” y persiste por base. */
function markAutoStopsInUI(stops) {
  const scene = getEscenario();
  const baseId = scene?.origen?.id;
  stops.forEach((st) => {
    const inp = document.querySelector(`#stopsGrid input[data-stop="${st.id}"]`);
    if (inp && !inp.checked) {
      inp.checked = true;
      if (baseId && selectedByBase[baseId]) selectedByBase[baseId].add(st.id);
    }
  });
  updateStopsCount();
}

// ======== UI helpers ========
let userPos = null, userMarker = null, searchMarker = null, searchLatLng = null;
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const fmtMXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format;

function ensureWrap(id) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.style.padding = '12px 16px';
    const main = document.querySelector('main') || document.body;
    const legs = document.getElementById('legsWrap');
    if (legs && legs.parentNode === main) legs.insertAdjacentElement('afterend', el);
    else main.appendChild(el);
  }
  return el;
}

// Orden real de paradas (según waypoint_order) + destino final
function getStopsInOrder() {
  const dir = directionsRenderer.getDirections?.();
  const route = dir?.routes?.[0];
  const order = route?.waypoint_order || [];
  const orderedStops = order.map((i) => lastRouteStops[i]).filter(Boolean);
  if (lastRouteDestino) orderedStops.push(lastRouteDestino);
  return orderedStops; // [{id,nombre,pos}, ...] (sin origen)
}

// ===== Botón "Calcular distancias y costo" =====
function setCostBtnEnabled(on) {
  const btn = document.getElementById('btnTabla');
  if (!btn) return;
  btn.disabled = !on;
  btn.classList.toggle('is-disabled', !on);
}

// ===== Preferencias del panel (persisten) =====
const PREFS_KEY = 'rk_table_prefs';
const tablePrefs = {
  showLegs: true,
  showCost: true,
  colDist: true,
  colTime: true,
  colAcum: true,
  colCost: true,
  // NUEVOS – qué mostrar
  viewKms: true,
  viewEmp: true,
  viewFood: true,
};
function savePrefs() { try { localStorage.setItem(PREFS_KEY, JSON.stringify(tablePrefs)); } catch {} }
function loadPrefs() { try { const j = JSON.parse(localStorage.getItem(PREFS_KEY)); if (j) Object.assign(tablePrefs, j); } catch {} }

function applyViewFilters(){
  // Kilometrajes (usa también showLegs para respetar ese toggle)
  const legsWrap  = document.getElementById('legsWrap');
  if (legsWrap) legsWrap.style.display = (tablePrefs.viewKms && tablePrefs.showLegs) ? '' : 'none';

  // Productoras
  const empWrap   = document.getElementById('empWrap');
  if (empWrap) empWrap.style.display = tablePrefs.viewEmp ? '' : 'none';

  // Alimentos
  const distWrap  = document.getElementById('distWrap');
  if (distWrap) distWrap.style.display = tablePrefs.viewFood ? '' : 'none';

  // Costos (ya lo manejas con showCost)
  const tablaWrap = document.getElementById('tablaWrap');
  if (tablaWrap) tablaWrap.style.display = tablePrefs.showCost ? '' : 'none';
}

function applyTableMenu() {
  const legsWrap  = document.getElementById('legsWrap');
  const tablaWrap = document.getElementById('tablaWrap');
  if (legsWrap)  legsWrap.style.display  = tablePrefs.showLegs ? '' : 'none';
  if (tablaWrap) tablaWrap.style.display = tablePrefs.showCost ? '' : 'none';

  const pairs = [
    ['table-hide-dist', !tablePrefs.colDist],
    ['table-hide-time', !tablePrefs.colTime],
    ['table-hide-acum', !tablePrefs.colAcum],
    ['table-hide-cost', !tablePrefs.colCost],
  ];
  [legsWrap, tablaWrap].forEach((w) => {
    if (!w) return;
    pairs.forEach(([cls, cond]) => w.classList.toggle(cls, cond));
  });
}

// ===== Emprendedoras por parada =====
function buildEntrepreneursTable() {
  const empWrap = ensureWrap('empWrap');
  const stops = getStopsInOrder();
  if (!stops.length) { empWrap.innerHTML = ''; return; }

  const totalEmp = stops.reduce((s, st) => s + (META[st.id]?.emprendedoras || 0), 0) || 0;
  let acc = 0;
  const rows = stops.map((st, i) => {
    const emp = META[st.id]?.emprendedoras || 0;
    acc += emp;
    const pct = totalEmp ? Math.round((emp / totalEmp) * 100) : 0;
    return `
      <tr>
        <td class="t-center">${i + 1}</td>
        <td>${st.nombre}</td>
        <td class="t-num">${emp}</td>
        <td class="t-num">${acc}</td>
        <td class="t-num">${pct}%</td>
      </tr>`;
  }).join('');

  empWrap.innerHTML = `
    <div class="card table-card">
      <div class="card-title">Emprendedoras (ruta actual)</div>
      <div class="card-sub">Total emprendedoras en esta ruta: <b>${totalEmp}</b></div>
      <table class="data-table data-table--emp">
        <colgroup>
          <col class="col-idx"><col class="col-loc"><col class="col-emp"><col class="col-acc"><col class="col-pct">
        </colgroup>
        <thead>
          <tr>
            <th>#</th><th>Localidad</th><th>Emprendedoras</th><th>Acumulado</th><th>% del total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}


// ===== Distribución de alimentos =====
const DEFAULT_CAPACIDAD = 80;        // sacos
const DEFAULT_MODO = 'fijo';         // 'fijo' o 'proporcional'
const DEFAULT_ENTREGAR_EN_DESTINO = false;

function getCapacidad() {
  const v = Number(document.getElementById('inpCapacidad')?.value || DEFAULT_CAPACIDAD);
  return Math.max(0, Math.floor(v));
}
function getModoReparto() {
  const v = document.getElementById('selModoReparto')?.value || DEFAULT_MODO;
  return (v === 'proporcional') ? 'proporcional' : 'fijo';
}
function getEntregarEnDestino() {
  const el = document.getElementById('chkDestinoFinal');
  return el ? !!el.checked : DEFAULT_ENTREGAR_EN_DESTINO;
}

function largestRemainder(weights, total) {
  const sumW = weights.reduce((a, b) => a + b, 0);
  if (!sumW || !total) return weights.map(() => 0);
  const exact = weights.map((w) => (w * total) / sumW);
  const base = exact.map((x) => Math.floor(x));
  let used = base.reduce((a, b) => a + b, 0);
  const rema = exact.map((x, i) => ({ i, r: x - base[i] })).sort((a, b) => b.r - a.r);
  let idx = 0;
  while (used < total && idx < rema.length) { base[rema[idx].i]++; used++; idx++; }
  return base;
}

function buildDistributionTable() {
  const distWrap = ensureWrap('distWrap');
  const stops = getStopsInOrder();
  if (!stops.length) { distWrap.innerHTML = ''; return; }

  const capacidad = getCapacidad();
  const modo = getModoReparto();
  const entregarEnDestino = getEntregarEnDestino();

  const demandas = stops.map(st => Math.max(0, META[st.id]?.demanda || 0));
  const pesosEmp = stops.map(st => Math.max(0, META[st.id]?.emprendedoras || 0));

  let objetivo = [];
  if (modo === 'proporcional') {
    const cuotas = largestRemainder(pesosEmp, capacidad);
    objetivo = cuotas.map((c, i) => Math.min(c, demandas[i]));
  } else {
    objetivo = [...demandas];
  }

  let restante = capacidad, totalEntregado = 0;
  let sim = stops.map((st, i) => {
    const demanda = demandas[i];
    const entregaDeseada = objetivo[i];
    let entregaReal = Math.min(entregaDeseada, restante);
    restante -= entregaReal; totalEntregado += entregaReal;
    const falt = Math.max(0, demanda - entregaReal);
    const cobertura = demanda ? Math.round((entregaReal / demanda) * 100) : (entregaReal ? 100 : 0);
    return { nombre: st.nombre, demanda, entregaReal, falt, restante, cobertura };
  });

  if (entregarEnDestino && restante > 0 && sim.length) {
    const i = sim.length - 1;
    const espacio = Math.max(0, demandas[i] - sim[i].entregaReal);
    const extra = Math.min(restante, espacio);
    if (extra > 0) {
      sim[i].entregaReal += extra;
      sim[i].falt = Math.max(0, demandas[i] - sim[i].entregaReal);
      sim[i].cobertura = demandas[i] ? Math.round((sim[i].entregaReal / demandas[i]) * 100) : sim[i].cobertura;
      sim[i].restante -= extra;
      restante -= extra; totalEntregado += extra;
    }
  }

  const faltantes = sim.reduce((a, r) => a + (r.falt > 0 ? 1 : 0), 0);
  const utilizado = capacidad ? Math.round((totalEntregado / capacidad) * 100) : 0;

  const rows = sim.map((r, i) => `
    <tr>
      <td class="t-center">${i + 1}</td>
      <td>${r.nombre}</td>
      <td class="t-num">${r.demanda}</td>
      <td class="t-num">${r.entregaReal}</td>
      <td class="t-num">${r.restante}</td>
      <td class="t-num" style="color:${r.falt>0 ? '#f87171' : '#a7f3d0'}">${r.falt}</td>
      <td class="t-num">${r.cobertura}%</td>
    </tr>`).join('');

  distWrap.innerHTML = `
    <div class="card table-card">
      <div class="card-title">Distribución de alimentos</div>
      <div class="card-sub">
        Capacidad inicial: <b>${capacidad}</b> • Entregado: <b>${totalEntregado}</b> (${utilizado}%) • Restante al final: <b>${restante}</b> • Localidades con faltante: <b>${faltantes}</b><br>
        Modo: <b>${modo}</b>${entregarEnDestino ? ' • Entregar en destino final: <b>Sí</b>' : ''}
      </div>
      <table class="data-table data-table--food">
        <colgroup>
          <col class="col-idx"><col class="col-loc"><col class="col-dem">
          <col class="col-ent"><col class="col-rest"><col class="col-falt"><col class="col-cov">
        </colgroup>
        <thead>
          <tr>
            <th>#</th><th>Localidad</th>
            <th>Demanda</th><th>Entrega (sacos)</th><th>Restante en camión</th><th>Faltante</th><th>% cubierto</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}


// ======== Inicialización principal ========
function initApp() {
  map = new google.maps.Map(document.getElementById('map'), { center: { lat: 19.1, lng: -88.6 }, zoom: 8 });
  directionsService = new google.maps.DirectionsService();

  // Renderer de IDA (principal)
  directionsRenderer = new google.maps.DirectionsRenderer({
    map,
    polylineOptions: { strokeColor: '#0F53FF', strokeOpacity: 0.9, strokeWeight: 6 }, // azul
  });

  // Renderer de REGRESO (secundario)
  directionsRendererReturn = new google.maps.DirectionsRenderer({
    map,
    polylineOptions: { strokeColor: '#22c55e', strokeOpacity: 0.7, strokeWeight: 5 }, // verde
    suppressMarkers: true,
  });

  // Renderer para "desde mi ubicación"
  directionsRendererUser = new google.maps.DirectionsRenderer({ map, polylineOptions: { strokeOpacity: 0.85 } });

  // Botón de costos arranca deshabilitado y se sincroniza al cambiar ruta
  setCostBtnEnabled(false);
  google.maps.event.addListener(directionsRenderer, 'directions_changed', () => {
    const hasRoute = !!directionsRenderer.getDirections()?.routes?.length;
    setCostBtnEnabled(hasRoute);
  });

  // ---------- Autocomplete ----------
  const sb = $('#searchBox');
  if (sb) {
    searchAC = new google.maps.places.Autocomplete(sb, {
      fields: ['geometry', 'name', 'formatted_address', 'place_id'],
      componentRestrictions: { country: 'mx' },
    });
    searchAC.addListener('place_changed', () => {
      const p = searchAC.getPlace();
      if (searchMarker) { searchMarker.setMap(null); searchMarker = null; }
      if (!p || !p.geometry) {
        setStatus('Sin geometría para ese lugar.');
        searchLatLng = null;
        return;
      }
      searchLatLng = { lat: p.geometry.location.lat(), lng: p.geometry.location.lng() };
      map.panTo(p.geometry.location);
      map.setZoom(14);
      searchMarker = new google.maps.Marker({ map, position: p.geometry.location, title: p.name || 'Lugar' });
      setStatus(`Destino fijado: ${p.name || p.formatted_address}`);
    });
    sb.addEventListener('input', () => {
      if (sb.value.trim() === '' && searchMarker) {
        searchMarker.setMap(null); searchMarker = null; searchLatLng = null; setStatus('Pin de búsqueda eliminado.');
      }
    });
  }

  // Botones básicos
  $('#btnUbicarme')?.addEventListener('click', locateMe);
  $('#btnIrDesdeAqui')?.addEventListener('click', routeFromHere);

  // Llenar selects base y enganchar cambio
  if ($('#selOrigen')) {
    fillSelect($('#selOrigen'), BASES);
    $('#selOrigen').addEventListener('change', onOrigenChange);
    $('#selOrigen').value = 'jmm';
    onOrigenChange();
  }

  // Botones de rutas
  $('#btnRuta')?.addEventListener('click', drawOptimizedRoute);
  $('#btnRutaRegreso')?.addEventListener('click', drawReturnRoute);

  // Limpieza
  $('#btnLimpiarRuta')?.addEventListener('click', (e) => { e?.preventDefault?.(); clearRoute(); });
  $('#btnLimpiarTodo')?.addEventListener('click', (e) => {
    e?.preventDefault?.();
    clearRoute();
    $$('#stopsGrid input[type=checkbox]').forEach((c) => (c.checked = false));
    updateStopsCount();
    $('#tablaWrap') && ($('#tablaWrap').innerHTML = '');
    setStatus('Todo limpio.');
  });

  // Tabla de costos
  $('#btnTabla')?.addEventListener('click', buildDistanceCostTable);
  $('#btnReset')?.addEventListener('click', () => { map.setCenter({ lat: 19.1, lng: -88.6 }); map.setZoom(8); });

  // Acordeón de paradas
  $('#btnAccordion')?.addEventListener('click', () => {
    $('#btnAccordion').classList.toggle('open');
    $('#stopsPanel').classList.toggle('open');
  });
  $('#btnAll')?.addEventListener('click', () => {
    const baseId = getEscenario().origen.id;
    selectedByBase[baseId].clear();
    $$('#stopsGrid input[type=checkbox]').forEach((c) => { c.checked = true; selectedByBase[baseId].add(c.dataset.stop); });
    updateStopsCount();
  });
  $('#btnNone')?.addEventListener('click', () => {
    const baseId = getEscenario().origen.id;
    selectedByBase[baseId].clear();
    $$('#stopsGrid input[type=checkbox]').forEach((c) => (c.checked = false));
    updateStopsCount();
  });

  // Marcadores para bases
  BASES.forEach((b) => addMarker(b.pos, b.nombre));

  // Intento silencioso de geoloc al cargar
  tryLocateSilently();

  // ===== Panel flotante (switches) =====
  const panel    = document.getElementById('tableMenu');
  const toggleBtn= document.getElementById('fpToggle');
  const closeBtn = document.getElementById('fpClose');

  loadPrefs();
  // Establecer estado inicial desde prefs
  document.getElementById('viewKms')?.setAttribute('checked', tablePrefs.viewKms ? 'checked' : null);
  document.getElementById('viewEmp')?.setAttribute('checked', tablePrefs.viewEmp ? 'checked' : null);
  document.getElementById('viewFood')?.setAttribute('checked', tablePrefs.viewFood ? 'checked' : null);

  // Listeners NUEVOS
  const vK = document.getElementById('viewKms');
  const vE = document.getElementById('viewEmp');
  const vF = document.getElementById('viewFood');

  vK?.addEventListener('change', e => {
    tablePrefs.viewKms = e.target.checked;
    // Sincroniza con “Resumen de recorrido”
    const legChk = document.getElementById('chkVerLegs');
    if (legChk) { legChk.checked = e.target.checked; tablePrefs.showLegs = legChk.checked; }
    applyTableMenu();  // por si ocultas columnas/legendas
    applyViewFilters();
    savePrefs();
  });

  vE?.addEventListener('change', e => {
    tablePrefs.viewEmp = e.target.checked;
    applyViewFilters(); savePrefs();
  });

  vF?.addEventListener('change', e => {
    tablePrefs.viewFood = e.target.checked;
    applyViewFilters(); savePrefs();
  });

  // Si el usuario toca “Resumen de recorrido”, sincroniza con Kilometrajes
  document.getElementById('chkVerLegs')?.addEventListener('change', e => {
    tablePrefs.showLegs = e.target.checked;
    const vK = document.getElementById('viewKms');
    if (vK) vK.checked = e.target.checked;
    applyTableMenu();
    applyViewFilters();
    savePrefs();
  });

  // Al arrancar, aplica estados
  applyTableMenu();
  applyViewFilters();

  // ---- Switches individuales ----
  if (document.getElementById('chkVerLegs'))    document.getElementById('chkVerLegs').checked = tablePrefs.showLegs;
  if (document.getElementById('chkVerCostos'))  document.getElementById('chkVerCostos').checked = tablePrefs.showCost;
  document.querySelectorAll('.chk-col').forEach((inp) => {
    const k = 'col' + inp.dataset.col.charAt(0).toUpperCase() + inp.dataset.col.slice(1);
    if (k in tablePrefs) inp.checked = tablePrefs[k];
  });

  function closePanel(){ panel?.classList.remove('is-open'); toggleBtn?.setAttribute('aria-expanded', 'false'); }
  toggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    panel?.classList.toggle('is-open');
    toggleBtn?.setAttribute('aria-expanded', panel?.classList.contains('is-open'));
  });
  closeBtn?.addEventListener('click', (e) => { e.stopPropagation(); closePanel(); });
  document.addEventListener('click', (e) => { if (panel && !panel.contains(e.target) && e.target !== toggleBtn) closePanel(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });

  document.getElementById('chkVerLegs')?.addEventListener('change', (e) => { tablePrefs.showLegs = e.target.checked; applyTableMenu(); savePrefs(); });
  document.getElementById('chkVerCostos')?.addEventListener('change', (e) => { tablePrefs.showCost = e.target.checked; applyTableMenu(); savePrefs(); });
  document.querySelectorAll('.chk-col').forEach((inp) => {
    inp.addEventListener('change', (e) => {
      const k = 'col' + e.target.dataset.col.charAt(0).toUpperCase() + e.target.dataset.col.slice(1);
      tablePrefs[k] = e.target.checked; applyTableMenu(); savePrefs();
    });
  });
  document.getElementById('fpReset')?.addEventListener('click', () => {
    Object.assign(tablePrefs, { showLegs: true, showCost: true, colDist: true, colTime: true, colAcum: true, colCost: true });
    if (document.getElementById('chkVerLegs'))   document.getElementById('chkVerLegs').checked   = true;
    if (document.getElementById('chkVerCostos')) document.getElementById('chkVerCostos').checked = true;
    document.querySelectorAll('.chk-col').forEach((i) => (i.checked = true));
    applyTableMenu(); savePrefs();
  });
}

function setStatus(msg) { const el = document.getElementById('status'); if (el) el.textContent = msg; else console.log('[status]', msg); }
function addMarker(position, title){ const m = new google.maps.Marker({ map, position, title }); markers.push(m); return m; }
function fillSelect(sel, arr){ if (!sel) return; sel.innerHTML = arr.map(o => `<option value="${o.id}">${o.nombre}</option>`).join(''); }
function getEscenario(){ return ESCENARIOS[document.getElementById('selOrigen')?.value || 'jmm']; }

function onOrigenChange() {
  const scene = getEscenario();
  const baseId = scene.origen.id;

  // Rellena destinos
  const selDest = document.getElementById('selDestino');
  if (selDest) {
    selDest.innerHTML = scene.destinos.map(d => `<option value="${d.id}">${d.nombre}</option>`).join('');
    selDest.selectedIndex = 0;
  }

  // Rellena paradas
  const grid = document.getElementById('stopsGrid');
  if (grid) {
    grid.innerHTML = scene.destinos.map(p => {
      const id = `stop_${p.id}`;
      return `
        <div class="stop-row">
          <input id="${id}" type="checkbox" data-stop="${p.id}">
          <label class="stop" for="${id}">
            <span class="dot"></span>
            <span>${p.nombre}</span>
            <span class="tag">parada</span>
          </label>
        </div>`;
    }).join('');

    // Restaurar selección guardada
    grid.querySelectorAll('input[type=checkbox]').forEach(chk => {
      if (selectedByBase[baseId]?.has(chk.dataset.stop)) chk.checked = true;
      chk.addEventListener('change', () => {
        if (chk.checked) selectedByBase[baseId].add(chk.dataset.stop);
        else selectedByBase[baseId].delete(chk.dataset.stop);
        updateStopsCount();
      });
    });
  }

  // Sincroniza selector de base (si existe)
  const selDestinoTabla = document.getElementById('selDestinoTabla');
  if (selDestinoTabla) selDestinoTabla.value = baseId;

  updateStopsCount();
  setStatus(`Origen: ${scene.origen.nombre}. Localidades cargadas: ${scene.destinos.length}.`);
}

function updateStopsCount() {
  const n = $$('#stopsGrid input[type=checkbox]:checked').length;
  const el = document.getElementById('stopsCount');
  if (el) el.textContent = `${n} seleccionadas`;
}

// ======== Geolocalización ========
function getLocation(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocalización no disponible.'));
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0, ...options }
    );
  });
}

async function tryLocateSilently(){
  try{
    userPos = await getLocation({ timeout: 3000 });
    if(!userMarker){
      userMarker = new google.maps.Marker({
        map, position: userPos,
        label:{text:'Tú',color:'#fff'},
        icon:{ path: google.maps.SymbolPath.CIRCLE, scale:7, fillColor:'#22c55e', fillOpacity:1, strokeWeight:2, strokeColor:'#064e3b' }
      });
    } else { userMarker.setPosition(userPos); }
    setStatus('Ubicación detectada.');
  }catch(_){ /* silencioso */ }
}

async function locateMe(){
  try{
    userPos = await getLocation();
    if(!userMarker){
      userMarker = new google.maps.Marker({
        map, position: userPos,
        label:{text:'Tú',color:'#fff'},
        icon:{ path: google.maps.SymbolPath.CIRCLE, scale:7, fillColor:'#22c55e', fillOpacity:1, strokeWeight:2, strokeColor:'#064e3b' }
      });
    } else { userMarker.setPosition(userPos); }
    map.panTo(userPos); map.setZoom(15);
    setStatus('Listo: usando tu ubicación actual.');
  }catch(err){
    setStatus('No se pudo obtener tu ubicación: ' + (err.message || err));
    alert('Activa la ubicación y recarga. Requiere HTTPS o localhost.');
  }
}

// ======== Ruta rápida: desde mi ubicación → destino del buscador ========
async function routeFromHere(){
  try{
    if(!searchLatLng){
      const v = document.getElementById('searchBox')?.value?.trim();
      alert(v ? 'Elige una sugerencia del autocompletado para fijar el destino.' : 'Escribe y elige un destino primero.');
      return;
    }
    if(!userPos){ await locateMe(); }

    setStatus('Calculando la mejor ruta con tráfico…');
    directionsRendererUser.set('directions', null);
    directionsService.route({
      origin: userPos,
      destination: searchLatLng,
      travelMode: google.maps.TravelMode.DRIVING,
      drivingOptions: { departureTime: new Date(), trafficModel: google.maps.TrafficModel.BEST_GUESS },
      provideRouteAlternatives: false,
      region: 'MX'
    }, (res, status)=>{
      if(status !== 'OK' || !res?.routes?.[0]){
        let msg = 'No se pudo calcular la ruta.';
        if(status==='ZERO_RESULTS') msg = 'No hay ruta en carretera entre esos puntos.';
        else if(status==='REQUEST_DENIED') msg = 'Verifica permisos de la API/clave.';
        setStatus(msg);
        return;
      }
      directionsRendererUser.setDirections(res);
      const leg = res.routes[0].legs[0];
      const km = (leg.distance.value/1000).toFixed(1);
      const min = Math.round(leg.duration.value/60);
      setStatus(`Ruta desde tu ubicación → destino. Total: ${km} km, ~${min} min.`);
      const b = new google.maps.LatLngBounds();
      b.extend(leg.start_location); b.extend(leg.end_location);
      map.fitBounds(b, 72);
    });
  }catch(err){
    setStatus('Error al trazar ruta: ' + (err.message || err));
  }
}

// ======== Ruta optimizada (bases/paradas) ========
const MAX_WAYPOINTS = 23; // límite de Google

function drawOptimizedRoute() {
  const scene = getEscenario();
  const destinoId = document.getElementById('selDestino')?.value;
  const destinoObj = scene.destinos.find(d => d.id === destinoId);
  if (!destinoObj) { setStatus('Selecciona un destino.'); return; }

  // Paradas seleccionadas manualmente (excluye destino)
  const manualStops = $$('#stopsGrid input[type=checkbox]:checked')
    .map(chk => scene.destinos.find(p => p.id === chk.dataset.stop))
    .filter(p => p && p.id !== destinoId);

  setStatus('Calculando ruta base para detectar localidades de paso…');

  directionsService.route({
    origin: scene.origen.pos,
    destination: destinoObj.pos,
    travelMode: google.maps.TravelMode.DRIVING,
    region: 'MX'
  }, (baseRes, baseStatus) => {
    if (baseStatus !== 'OK' || !baseRes?.routes?.[0]) {
      let msg = 'No se pudo obtener la ruta base.';
      if (baseStatus === 'ZERO_RESULTS') msg = 'No hay ruta en carretera entre esos puntos.';
      else if (baseStatus === 'REQUEST_DENIED') msg = 'Verifica permisos de la API/clave.';
      setStatus(msg);
      return;
    }

    const basePath = baseRes.routes[0].overview_path;
    const candidates = scene.destinos.filter(p => p.id !== destinoId);
    const autoStops = getStopsAlongPath(basePath, candidates);

    // Evitar duplicados
    const allStops = [
      ...manualStops,
      ...autoStops.filter(a => !manualStops.some(m => m.id === a.id))
    ];

    // Reflejar en la UI y persistir
    markAutoStopsInUI(autoStops);

    // Trazar final optimizado
    routeWithStops(scene, destinoObj, allStops, `Se agregaron ${autoStops.length} localidades de paso.`);
  });
}

// ======== Tabla de tramos (legs) ========
function renderLegsTable(legs, orderedNames) {
  const lw = document.getElementById('legsWrap');
  if (!Array.isArray(legs) || legs.length === 0) { if (lw) lw.innerHTML = ''; return; }

  const fmtKm  = m => (m/1000).toFixed(1) + ' km';
  const fmtMin = s => { const min = Math.round(s/60); if (min < 60) return `${min} min`; const h = Math.floor(min/60), r = min % 60; return r ? `${h} h ${r} min` : `${h} h`; };

  let accM = 0, accS = 0;
  const rowsHtml = legs.map((leg, i) => {
    const from = orderedNames?.[i]   ?? leg.start_address ?? `Punto ${i+1}`;
    const to   = orderedNames?.[i+1] ?? leg.end_address   ?? `Punto ${i+2}`;
    const m = leg.distance?.value ?? 0;
    const s = leg.duration?.value ?? 0;
    accM += m; accS += s;
    return `
      <tr>
        <td class="t-center">${i+1}</td>
        <td>${from}</td>
        <td>${to}</td>
        <td class="t-num col-dist">${leg.distance?.text || '—'}</td>
        <td class="t-num col-time">${leg.duration?.text || '—'}</td>
        <td class="t-num col-acum">${fmtKm(accM)}</td>
        <td class="t-num col-acum">${fmtMin(accS)}</td>
      </tr>`;
  }).join('');

  const totalHtml = `
    <div class="table-metrics">
      <span class="pill">Total: ${fmtKm(accM)}</span>
      <span class="pill">Tiempo total: ${fmtMin(accS)}</span>
      <span class="pill">${orderedNames?.[0] || 'Inicio'} → ${orderedNames?.[orderedNames.length-1] || 'Fin'}</span>
    </div>`;

  lw.innerHTML = `
    <div class="card table-card">
      <div class="card-title">Resumen del recorrido</div>
      ${totalHtml}
      <table class="data-table data-table--legs">
        <colgroup>
          <col class="col-idx"><col class="col-from"><col class="col-to">
          <col class="col-dist"><col class="col-time"><col class="col-adist"><col class="col-atime">
        </colgroup>
        <thead>
          <tr>
            <th>#</th><th>De</th><th>Hacia</th>
            <th class="col-dist">Distancia tramo</th>
            <th class="col-time">Tiempo tramo</th>
            <th class="col-adist">Acum. distancia</th>
            <th class="col-atime">Acum. tiempo</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>`;
  applyTableMenu();
}


// ======== Directions con waypoints ========
function routeWithStops(scene, destinoObj, stops, extraNote='') {
  let trimmed = false;
  let waypointsExtended = stops.map(p => ({ location: p.pos, stopover: true, _name: p.nombre }));
  if (waypointsExtended.length > MAX_WAYPOINTS) { waypointsExtended = waypointsExtended.slice(0, MAX_WAYPOINTS); trimmed = true; }
  const waypoints = waypointsExtended.map(w => ({ location: w.location, stopover: true }));

  const req = { origin: scene.origen.pos, destination: destinoObj.pos, travelMode: google.maps.TravelMode.DRIVING, region: 'MX' };
  if (waypoints.length) { req.optimizeWaypoints = true; req.waypoints = waypoints; }

  directionsRenderer.set('directions', null);
  setStatus(waypoints.length ? 'Calculando ruta optimizada…' : 'Calculando ruta directa…');

  directionsService.route(req, (res, status) => {
    if (status !== 'OK' || !res?.routes?.[0]) {
      console.error('Directions error:', status, res);
      let msg = 'Error al trazar ruta.';
      if (status === 'ZERO_RESULTS') msg = 'No hay ruta en carretera entre esos puntos.';
      else if (status === 'MAX_WAYPOINTS_EXCEEDED') msg = 'Demasiadas paradas (máx. 23).';
      else if (status === 'OVER_QUERY_LIMIT') msg = 'Límite de cuota alcanzado.';
      else if (status === 'REQUEST_DENIED') msg = 'Permisos de API/clave.';
      else if (status === 'INVALID_REQUEST') msg = 'Solicitud inválida.';
      setStatus(msg);
      return;
    }

    directionsRenderer.setDirections(res);
    setCostBtnEnabled(true);

    // Status informativo
    let info = `Ruta: ${scene.origen.nombre} → ${destinoObj.nombre}`;
    const order = res.routes[0].waypoint_order || [];
    if (waypoints.length) {
      const optimNames = order.map(i => waypointsExtended[i]._name);
      if (optimNames.length) info += `. Paradas: ${optimNames.join(' → ')}`;
      if (trimmed) info += ' (se usaron solo las primeras 23 paradas por límite de Google).';
    }
    if (extraNote) info += ` ${extraNote}`;
    setStatus(info);

    const orderedNames = [
      scene.origen.nombre,
      ...order.map(i => (stops[i]?.nombre || waypointsExtended[i]?._name || `Parada ${i+1}`)),
      destinoObj.nombre
    ];
    renderLegsTable(res.routes[0].legs, orderedNames);

    // Guardar última ruta
    lastRouteStops = stops;
    lastRouteDestino = destinoObj;
    lastRouteBaseId = scene.origen.id;

    // Tablas auxiliares
    buildEntrepreneursTable();
    buildDistributionTable();
    applyViewFilters();
  });
}

function clearRoute(){
  directionsRenderer.set('directions', null);
  directionsRendererUser.set('directions', null);
  if (directionsRendererReturn) directionsRendererReturn.set('directions', null);
  const lw = document.getElementById('legsWrap'); if (lw) lw.innerHTML = '';
  setStatus('Rutas limpiadas.');
  setCostBtnEnabled(false);
  const emp  = document.getElementById('empWrap');  if (emp)  emp.innerHTML  = '';
  const dist = document.getElementById('distWrap'); if (dist) dist.innerHTML = '';
}

// ======== Tabla: distancias/costo (por tramo) ========
function buildDistanceCostTable(){
  const tipo = document.getElementById('selCombustible')?.value || 'regular';
  const rendimiento = Math.max(0.0001, Number(document.getElementById('inpRendimiento')?.value || 1));
  const precio = PRECIOS_COMBUSTIBLE[tipo] ?? PRECIOS_COMBUSTIBLE.regular;

  const dir = directionsRenderer.getDirections?.();
  const route = dir?.routes?.[0];
  const legs = route?.legs || [];
  if (!legs.length) { alert('Primero traza una ruta antes de calcular el costo.'); setStatus('No hay ruta trazada para calcular.'); return; }

  const scene = getEscenario();
  const order = route.waypoint_order || [];
  const namesOrdered = [ scene.origen.nombre, ...order.map(i => lastRouteStops[i]?.nombre ?? `Parada ${i+1}`), lastRouteDestino?.nombre || 'Destino' ];

  let totalKm = 0, totalCosto = 0;
  const rowsHtml = legs.map((leg, i) => {
    const km = (leg.distance?.value || 0) / 1000;
    const costo = (km / rendimiento) * precio;
    totalKm += km; totalCosto += costo;
    return `
      <tr>
        <td class="t-center">${i + 1}</td>
        <td>${namesOrdered[i + 1] || leg.end_address || '—'}</td>
        <td class="t-num">${km.toFixed(1)} km</td>
        <td class="t-num">${fmtMXN(costo)}</td>
      </tr>`;
  }).join('');

  const html = `
    <div class="card table-card">
      <div class="card-title">Tabla de costos</div>
      <div class="card-sub">
        <b>Combustible:</b> ${tipo.toUpperCase()} ($${precio}/L) &nbsp; • &nbsp;
        <b>Rendimiento:</b> ${rendimiento} km/L
      </div>
      <table class="data-table data-table--cost">
        <colgroup>
          <col class="col-idx"><col class="col-loc"><col class="col-dist"><col class="col-money">
        </colgroup>
        <thead>
          <tr>
            <th>#</th><th>Comunidad</th><th>Distancia del tramo</th><th>Costo estimado</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div class="table-metrics" style="margin-top:8px">
        <span class="pill">Total distancia: ${totalKm.toFixed(1)} km</span>
        <span class="pill">Total costo: ${fmtMXN(totalCosto)}</span>
      </div>
    </div>`;
  const tw = document.getElementById('tablaWrap'); if (tw) tw.innerHTML = html;
  applyTableMenu();
  setStatus(`Tabla de costos actualizada. Total: ${fmtMXN(totalCosto)}.`);
}


// ======== Ruta de regreso (ida y vuelta) ========
function drawReturnRoute() {
  if (!lastRouteDestino) { alert('Primero traza una ruta antes de calcular el regreso.'); setStatus('No hay ruta previa para invertir.'); return; }
  const base = BASES.find(b => b.id === lastRouteBaseId) || getEscenario().origen;
  const destino = lastRouteDestino;
  const stopsReverse = [...lastRouteStops].reverse().slice(0, MAX_WAYPOINTS);

  setStatus('Calculando ruta de regreso…');

  const req = {
    origin: destino.pos,
    destination: base.pos,
    travelMode: google.maps.TravelMode.DRIVING,
    region: 'MX',
    waypoints: stopsReverse.map(s => ({ location: s.pos, stopover: true })),
    optimizeWaypoints: false
  };

  directionsService.route(req, (res, status) => {
    if (status !== 'OK' || !res?.routes?.[0]) {
      setStatus('No se pudo calcular la ruta de regreso.');
      return;
    }
    directionsRendererReturn.setDirections(res);

    // Distancia/tiempo del REGRESO
    const legsReg = res.routes[0].legs || [];
    const regresoKm  = legsReg.reduce((s,l)=> s + (l.distance?.value||0), 0) / 1000;
    const regresoMin = legsReg.reduce((s,l)=> s + (l.duration?.value||0), 0) / 60;

    // IDA (lo ya trazado)
    const idaDir = directionsRenderer.getDirections?.();
    const legsIda = idaDir?.routes?.[0]?.legs || [];
    const idaKm  = legsIda.reduce((s,l)=> s + (l.distance?.value||0), 0) / 1000;
    const idaMin = legsIda.reduce((s,l)=> s + (l.duration?.value||0), 0) / 60;

    // Costeo con ambas
    const tipo   = document.getElementById('selCombustible')?.value || 'regular';
    const precio = PRECIOS_COMBUSTIBLE[tipo] ?? PRECIOS_COMBUSTIBLE.regular;
    const rend   = Math.max(0.0001, Number(document.getElementById('inpRendimiento')?.value || 1));

    const totalKm  = idaKm + regresoKm;
    const totalMin = idaMin + regresoMin;
    const costoTotal = (totalKm / rend) * precio;

    setStatus(`Ida: ${idaKm.toFixed(1)} km • Regreso: ${regresoKm.toFixed(1)} km • Total: ${totalKm.toFixed(1)} km, ~${Math.round(totalMin)} min, ${fmtMXN(costoTotal)}.`);
  });
}

/* ======== META (solo visualización) ========
   Edita estos números cuando quieras; si falta una localidad, se asume 0. */
const META = {
  // --- JMM ---
  'candelaria':       { emprendedoras: 12, demanda: 18 },
  'dziuche':          { emprendedoras: 8,  demanda: 10 },
  'la-presumida':     { emprendedoras: 5,  demanda: 6  },
  'santa-gertrudis':  { emprendedoras: 5,  demanda: 6  },
  'kancabchen':       { emprendedoras: 7,  demanda: 8  },
  'cafetalito':       { emprendedoras: 6,  demanda: 7  },
  'cafetal-grande':   { emprendedoras: 6,  demanda: 8  },
  'benito-juarez':    { emprendedoras: 9,  demanda: 12 },
  'pozo-pirata':      { emprendedoras: 4,  demanda: 5  },
  'san-carlos':       { emprendedoras: 4,  demanda: 6  },
  'chunhuhub':        { emprendedoras: 20, demanda: 25 },
  'polyuc':           { emprendedoras: 15, demanda: 18 },
  'dos-aguadas':      { emprendedoras: 3,  demanda: 4  },
  'el-naranjal':      { emprendedoras: 6,  demanda: 7  },
  'othon-p-blanco':   { emprendedoras: 10, demanda: 12 },
  'puerto-arturo':    { emprendedoras: 3,  demanda: 4  },
  // --- FCP ---
  'dzula':            { emprendedoras: 6,  demanda: 7  },
  'X-Yatil':          { emprendedoras: 5,  demanda: 6  },
  'el-senor':         { emprendedoras: 8,  demanda: 10 },
  'tihosuco':         { emprendedoras: 14, demanda: 18 },
};

// Exponer initApp al global
window.initApp = initApp;