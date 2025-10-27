  // ======== Precios de combustibles (MXN/L) ========
  const PRECIOS_COMBUSTIBLE = {
    regular: 24.87,
    premium: 26.73,
    diesel: 26.41
  };


  // Guarda las paradas de la última ruta trazada
  let lastRouteStops = [];
  let lastRouteDestino = null;
  let lastRouteBaseId = null;

  let map = null;
  let directionsService = null;
  let directionsRenderer = null;
  let directionsRendererReturn = null; // opcional: eliminar si no se usa
  let directionsRendererUser = null;
  let searchAC = null;
  let markers = [];


  // ======== Bases fijas (JMM/FCP) y destinos por base ========
  const BASES = [
    { id:'jmm', nombre:'José María Morelos', pos:{lat:19.7485, lng:-88.7060} },
    { id:'fcp', nombre:'Felipe Carrillo Puerto', pos:{lat:19.57987006324777, lng:-88.04392203071264} }
  ];
  const ESCENARIOS = {
    jmm: {
      origen: BASES[0],
      destinos: [
        {id:'candelaria', nombre:'Candelaria', pos:{lat:19.7362, lng:-88.9580}},
        {id:'dziuche', nombre:'Dziuché', pos:{lat:19.8971, lng:-88.8098}},
        {id:'la-presumida', nombre:'La Presumida', pos:{lat:19.8010, lng:-88.7534}},
        {id:'santa-gertrudis', nombre:'Santa Gertrudis', pos:{lat:19.7996, lng:-88.7724}},
        {id:'kancabchen', nombre:'Kancabchén', pos:{lat:19.7139, lng:-88.8612}},
        {id:'cafetalito', nombre:'Cafetalito', pos:{lat:19.7276, lng:-88.7990}},
        {id:'cafetal-grande', nombre:'Cafetal Grande', pos:{lat:19.7163, lng:-88.8217}},
        {id:'benito-juarez', nombre:'Benito Juárez', pos:{lat:19.7106, lng:-88.7707}},
        {id:'pozo-pirata', nombre:'Pozo Pirata', pos:{lat:19.6149, lng:-88.8900}},
        {id:'san-carlos', nombre:'San Carlos', pos:{lat:19.6336, lng:-88.9393}},
        {id:'chunhuhub', nombre:'Chunhuhub', pos:{lat:19.5850, lng:-88.5914}},
        {id:'polyuc', nombre:'Polyuc', pos:{lat:19.6099, lng:-88.5612}},
        {id:'dos-aguadas', nombre:'Dos Aguadas', pos:{lat:19.6663, lng:-88.6984}},
        {id:'el-naranjal', nombre:'El Naranjal', pos:{lat:19.6449, lng:-88.7857}},
        {id:'othon-p-blanco', nombre:'Othón P. Blanco', pos:{lat:19.6203, lng:-89.0054}},
        {id:'puerto-arturo', nombre:'Puerto Arturo', pos:{lat:19.6591, lng:-89.0668}},
      ]
    },
    fcp: {
      origen: BASES[1],
      destinos: [
        {id:'dzula', nombre:'Dzulá', pos:{lat:19.602682832330864, lng:-88.41559225310304}},
        {id:'X-Yatil', nombre:'X-Yatil', pos:{lat:19.662795041921463, lng:-88.4435691850896}}, //19.662795041921463, -88.4435691850896
        {id:'el-senor', nombre:'El Señor', pos:{lat:19.843208408219397, lng:-88.13529197133691}},
        {id:'tihosuco', nombre:'Tihosuco', pos:{lat:20.19546282557715, lng:-88.37403728985683}},
      ]
    }
  };
  const COMUNIDADES = [...ESCENARIOS.jmm.destinos, ...ESCENARIOS.fcp.destinos];

  // ======== Auto-paradas "de paso" ========
const ONROUTE_THRESHOLD_M = 1000; // 1 km alrededor del trazo

const ll = (pos) => new google.maps.LatLng(pos.lat, pos.lng);

// Selección persistente por base: { jmm: Set(ids), fcp: Set(ids) }
const selectedByBase = { jmm: new Set(), fcp: new Set() };


/**
 * Distancia mínima desde un punto a la polilínea (aprox por muestreo de vértices).
 * Devuelve { dist: metros, idx: índice del vértice más cercano }.
 */
function minDistanceToPath(pointLL, pathLLs){
  let best = Infinity, bestIdx = -1;
  for(let i=0; i<pathLLs.length; i++){
    const d = google.maps.geometry.spherical.computeDistanceBetween(pointLL, pathLLs[i]);
    if(d < best){ best = d; bestIdx = i; }
  }
  return { dist: best, idx: bestIdx };
}

/**
 * Devuelve las comunidades candidatas que están "de paso", y cerca del trazo.
 * Ordenadas por el índice del vértice más cercano para conservar sentido de viaje.
 */
function getStopsAlongPath(pathLLs, candidates, thresholdM = ONROUTE_THRESHOLD_M){
  const picked = [];
  for(const c of candidates){
    const { dist, idx } = minDistanceToPath(ll(c.pos), pathLLs);
    if(dist <= thresholdM){
      picked.push({ ...c, _nearestIndex: idx, _nearestDist: dist });
    }
  }
  picked.sort((a,b)=> a._nearestIndex - b._nearestIndex);
  return picked;
}

/** Marca en la UI las paradas auto-detectadas “de paso”. */
function markAutoStopsInUI(stops){
  stops.forEach(st => {
    const inp = document.querySelector(`#stopsGrid input[data-stop="${st.id}"]`);
    if(inp && !inp.checked){ inp.checked = true; }
  });
  updateStopsCount();
}

  // Nuevos: routing desde ubicación del usuario
  let userPos = null, userMarker = null, searchMarker = null, searchLatLng = null;

  const $  = (sel)=>document.querySelector(sel);
  const $$ = (sel)=>Array.from(document.querySelectorAll(sel));
  const fmtMXN = new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format;

  // ===== Botón "Calcular distancias y costo": habilitar/deshabilitar =====
  function setCostBtnEnabled(on) {
    const btn = document.getElementById('btnTabla');
    if (!btn) return;
    btn.disabled = !on;
    btn.classList.toggle('is-disabled', !on);
  }

  // ===== Preferencias del panel (persisten en localStorage) =====
  const PREFS_KEY = 'rk_table_prefs';
  const tablePrefs = {
    showLegs: true,
    showCost: true,
    colDist:  true,
    colTime:  true,
    colAcum:  true,
    colCost:  true,
  };
  function savePrefs(){ try{ localStorage.setItem(PREFS_KEY, JSON.stringify(tablePrefs)); }catch{} }
  function loadPrefs(){ try{ const j = JSON.parse(localStorage.getItem(PREFS_KEY)); if(j) Object.assign(tablePrefs, j); }catch{} }

  // Aplica visibilidad de tablas y columnas
  function applyTableMenu(){
    // mostrar/ocultar bloques
    const legsWrap  = document.getElementById('legsWrap');
    const tablaWrap = document.getElementById('tablaWrap');
    if (legsWrap)  legsWrap.style.display  = tablePrefs.showLegs ? '' : 'none';
    if (tablaWrap) tablaWrap.style.display = tablePrefs.showCost ? '' : 'none';

    // clases para ocultar columnas
    const pairs = [
      ['table-hide-dist', !tablePrefs.colDist],
      ['table-hide-time', !tablePrefs.colTime],
      ['table-hide-acum', !tablePrefs.colAcum],
      ['table-hide-cost', !tablePrefs.colCost],
    ];
    [legsWrap, tablaWrap].forEach(w => {
      if (!w) return;
      pairs.forEach(([cls, cond]) => w.classList.toggle(cls, cond));
    });
  }



  function initApp(){
    map = new google.maps.Map(document.getElementById('map'), { center:{lat:19.1,lng:-88.6}, zoom:8 });
    directionsService = new google.maps.DirectionsService();
    // Renderer de IDA (principal)
    directionsRenderer = new google.maps.DirectionsRenderer({
      map,
      polylineOptions: { strokeColor: '#0F53FF', strokeOpacity: 0.9, strokeWeight: 6 } // verde
    });

    // Renderer de REGRESO (secundario)
    directionsRendererReturn = new google.maps.DirectionsRenderer({
      map,
      polylineOptions: { strokeColor: '#22c55e', strokeOpacity: 0.7, strokeWeight: 5 }, // azul
      suppressMarkers: true
    });

    directionsRendererUser = new google.maps.DirectionsRenderer({map, polylineOptions:{strokeOpacity:0.85}}); // renderer para "desde mi ubicación"

    // Botón de costos arranca deshabilitado y se sincroniza al cambiar ruta
    setCostBtnEnabled(false);
    google.maps.event.addListener(directionsRenderer, 'directions_changed', () => {
      const hasRoute = !!directionsRenderer.getDirections()?.routes?.length;
      setCostBtnEnabled(hasRoute);
    });

    // ---------- Autocomplete con limpieza del pin al borrar ----------
    searchAC = new google.maps.places.Autocomplete($('#searchBox'), {
      fields:['geometry','name','formatted_address','place_id'],
      componentRestrictions:{country:'mx'}
    });

    searchAC.addListener('place_changed', ()=>{
      const p = searchAC.getPlace();
      if (searchMarker) { searchMarker.setMap(null); searchMarker = null; }
      if(!p || !p.geometry){
        setStatus('Sin geometría para ese lugar.');
        searchLatLng = null;
        return;
      }

      searchLatLng = { lat: p.geometry.location.lat(), lng: p.geometry.location.lng() };
      map.panTo(p.geometry.location);
      map.setZoom(14);

      searchMarker = new google.maps.Marker({
        map,
        position: p.geometry.location,
        title: p.name || 'Lugar'
      });
      setStatus(`Destino fijado: ${p.name || p.formatted_address}`);
    });

    // Si el usuario borra el texto del input, eliminamos el pin del buscador
    const sb = $('#searchBox');
    sb.addEventListener('input', () => {
      if (sb.value.trim() === '' && searchMarker) {
        searchMarker.setMap(null);
        searchMarker = null;
        searchLatLng = null;
        setStatus('Pin de búsqueda eliminado.');
      }
    });

    // Botones de geoloc / routing simple
    $('#btnUbicarme').addEventListener('click', locateMe);
    $('#btnIrDesdeAqui').addEventListener('click', routeFromHere);

    // Llenar selects base / tabla
    // Llenar selects base
    fillSelect($('#selOrigen'), BASES);

    // Cargar JMM por defecto
    $('#selOrigen').value = 'jmm';
    onOrigenChange();

    // Botones
    $('#btnRuta').addEventListener('click', drawOptimizedRoute);
    //
    $('#btnRutaRegreso').addEventListener('click', drawReturnRoute);

    // limpia ruta (ambos renderers)
    $('#btnLimpiarRuta').addEventListener('click', (e) => {
      // por si algún día es <a>
      if (e && e.preventDefault) e.preventDefault();
      clearRoute();
    });

    // agrega este para el del header
    $('#btnLimpiarTodo').addEventListener('click', (e) => {
      e.preventDefault();              // evita el salto por href="#"
      clearRoute();                    // limpia rutas
      // opcional: también resetea UI
      $$('#stopsGrid input[type=checkbox]').forEach(c => c.checked = false);
      updateStopsCount();
      $('#tablaWrap').innerHTML = '';
      setStatus('Todo limpio.');
    });

    $('#btnTabla').addEventListener('click', buildDistanceCostTable);
    $('#btnReset').addEventListener('click', ()=>{ map.setCenter({lat:19.1,lng:-88.6}); map.setZoom(8); });

    // Acordeón
    $('#btnAccordion').addEventListener('click', ()=>{
      $('#btnAccordion').classList.toggle('open');
      $('#stopsPanel').classList.toggle('open');
    });
    $('#btnAll').addEventListener('click', () => {
      const baseId = getEscenario().origen.id;
      selectedByBase[baseId].clear();
      $$('#stopsGrid input[type=checkbox]').forEach(c => {
        c.checked = true;
        selectedByBase[baseId].add(c.dataset.stop);
      });
      updateStopsCount();
    });

    $('#btnNone').addEventListener('click', () => {
      const baseId = getEscenario().origen.id;
      selectedByBase[baseId].clear();
      $$('#stopsGrid input[type=checkbox]').forEach(c => { c.checked = false; });
      updateStopsCount();
    });

    // Marcadores base solamente al inicio
    BASES.forEach(b=> addMarker(b.pos, b.nombre));

    // Intento silencioso de geoloc al cargar (no obligatorio)
    tryLocateSilently();

    // ===== Panel flotante: abrir/cerrar + switches + persistencia =====
    const panel    = document.getElementById('tableMenu');
    const toggleBtn= document.getElementById('fpToggle');
    const closeBtn = document.getElementById('fpClose');

    // Carga prefs y sincroniza switches
    loadPrefs();
    document.getElementById('chkVerLegs').checked   = tablePrefs.showLegs;
    document.getElementById('chkVerCostos').checked = tablePrefs.showCost;
    document.querySelectorAll('.chk-col').forEach(inp=>{
      const k = 'col' + inp.dataset.col.charAt(0).toUpperCase() + inp.dataset.col.slice(1);
      if (k in tablePrefs) inp.checked = tablePrefs[k];
    });
    applyTableMenu();

    // Abrir / cerrar
    function closePanel(){ panel.classList.remove('is-open'); toggleBtn.setAttribute('aria-expanded','false'); }
    toggleBtn.addEventListener('click', e=>{
      e.stopPropagation();
      panel.classList.toggle('is-open');
      toggleBtn.setAttribute('aria-expanded', panel.classList.contains('is-open'));
    });
    closeBtn.addEventListener('click', e=>{ e.stopPropagation(); closePanel(); });
    document.addEventListener('click', e=>{ if(!panel.contains(e.target) && e.target!==toggleBtn) closePanel(); });
    document.addEventListener('keydown', e=>{ if(e.key==='Escape') closePanel(); });

    // Switches -> estado + persistencia
    document.getElementById('chkVerLegs')
      .addEventListener('change', e=>{ tablePrefs.showLegs = e.target.checked; applyTableMenu(); savePrefs(); });
    document.getElementById('chkVerCostos')
      .addEventListener('change', e=>{ tablePrefs.showCost = e.target.checked; applyTableMenu(); savePrefs(); });

    document.querySelectorAll('.chk-col').forEach(inp=>{
      inp.addEventListener('change', e=>{
        const k = 'col' + e.target.dataset.col.charAt(0).toUpperCase() + e.target.dataset.col.slice(1);
        tablePrefs[k] = e.target.checked;
        applyTableMenu(); savePrefs();
      });
    });

    // Botón "Restablecer"
    document.getElementById('fpReset').addEventListener('click', ()=>{
      Object.assign(tablePrefs, { showLegs:true, showCost:true, colDist:true, colTime:true, colAcum:true, colCost:true });
      document.getElementById('chkVerLegs').checked   = true;
      document.getElementById('chkVerCostos').checked = true;
      document.querySelectorAll('.chk-col').forEach(i=> i.checked = true);
      applyTableMenu(); savePrefs();
    });


  }

  function setStatus(msg){ $('#status').textContent = msg; }
  function addMarker(position, title){ const m = new google.maps.Marker({map, position, title}); markers.push(m); return m; }
  function fillSelect(sel, arr){ sel.innerHTML = arr.map(o=>`<option value="${o.id}">${o.nombre}</option>`).join(''); }
  function getEscenario(){ return ESCENARIOS[$('#selOrigen').value]; }

  $('#selOrigen').addEventListener('change', onOrigenChange);

  function onOrigenChange() {
  const scene = getEscenario();
  const baseId = scene.origen.id; // 'jmm' o 'fcp'

  // Rellena destinos
  const selDest = $('#selDestino');
  selDest.innerHTML = scene.destinos.map(d => `<option value="${d.id}">${d.nombre}</option>`).join('');
  selDest.selectedIndex = 0;

  // Rellena paradas (todas desmarcadas)
  const grid = $('#stopsGrid');
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

  // Restaurar selección guardada para esta base
  grid.querySelectorAll('input[type=checkbox]').forEach(chk => {
    if (selectedByBase[baseId]?.has(chk.dataset.stop)) chk.checked = true;
    // Guardar cambios en memoria al marcar/desmarcar
    chk.addEventListener('change', () => {
      if (chk.checked) selectedByBase[baseId].add(chk.dataset.stop);
      else selectedByBase[baseId].delete(chk.dataset.stop);
      updateStopsCount();
    });
  });

  // Sincroniza el selector de "Base para la tabla" con la base actual (opcional pero útil)
  const selDestinoTabla = $('#selDestinoTabla');
  if (selDestinoTabla) selDestinoTabla.value = baseId;

  updateStopsCount();
  setStatus(`Origen: ${scene.origen.nombre}. Localidades cargadas: ${scene.destinos.length}.`);
}



  function updateStopsCount(){
    const n = $$('#stopsGrid input[type=checkbox]:checked').length;
    $('#stopsCount').textContent = `${n} seleccionadas`;
  }

  // ======== Geolocalización ========
  function getLocation(options={}){
    return new Promise((resolve,reject)=>{
      if(!navigator.geolocation) return reject(new Error('Geolocalización no disponible.'));
      navigator.geolocation.getCurrentPosition(
        pos => resolve({lat:pos.coords.latitude,lng:pos.coords.longitude}),
        err => reject(err),
        { enableHighAccuracy:true, timeout:8000, maximumAge:0, ...options }
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
      }else{
        userMarker.setPosition(userPos);
      }
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
      }else{
        userMarker.setPosition(userPos);
      }
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
        const v = $('#searchBox').value.trim();
        alert(v ? 'Elige una sugerencia del autocompletado para fijar el destino.' : 'Escribe y elige un destino primero.');
        return;
      }
      if(!userPos){ await locateMe(); }

      setStatus('Calculando la mejor ruta con tráfico…');
      directionsRendererUser.set('directions', null); // limpia ruta anterior "desde aquí" (no toca la de paradas)
      directionsService.route({
        origin: userPos,
        destination: searchLatLng,
        travelMode: google.maps.TravelMode.DRIVING,
        // Mejor estimación con tráfico actual:
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
        // Ajusta vista a origen y destino
        const b = new google.maps.LatLngBounds();
        b.extend(leg.start_location); b.extend(leg.end_location);
        map.fitBounds(b, 72);
      });
    }catch(err){
      setStatus('Error al trazar ruta: ' + (err.message || err));
    }
  }

  // ======== Ruta optimizada (bases/paradas) ========
  const MAX_WAYPOINTS = 23; // Google permite hasta 23, pero dejamos margen

 function drawOptimizedRoute() {
  const scene = getEscenario();
  const destinoId = $('#selDestino').value;
  const destinoObj = scene.destinos.find(d => d.id === destinoId);
  if (!destinoObj) { setStatus('Selecciona un destino.'); return; }

  // Paradas seleccionadas manualmente
  let manualStops = $$('#stopsGrid input[type=checkbox]:checked')
    .map(chk => scene.destinos.find(p => p.id === chk.dataset.stop))
    .filter(p => p && p.id !== destinoId);

  setStatus('Calculando ruta base para detectar localidades de paso…');

  // Siempre calcular ruta base para detectar de paso
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

    // Detectar las localidades de paso (aunque haya manuales)
    const basePath = baseRes.routes[0].overview_path;
    const candidates = scene.destinos.filter(p => p.id !== destinoId);
    const autoStops = getStopsAlongPath(basePath, candidates);

    // Evitar duplicados si alguna ya estaba seleccionada manualmente
    const allStops = [
      ...manualStops,
      ...autoStops.filter(a => !manualStops.some(m => m.id === a.id))
    ];

    // Reflejar en la interfaz las nuevas auto-paradas
    markAutoStopsInUI(autoStops);

    // Continuar con el trazado final
    routeWithStops(scene, destinoObj, allStops, `Se agregaron ${autoStops.length} localidades de paso.`);
  });
}

/** Pinta una tabla con los tramos del recorrido (A->B, B->C, ...) */
function renderLegsTable(legs, orderedNames) {
  if (!Array.isArray(legs) || legs.length === 0) {
    document.getElementById('legsWrap').innerHTML = '';
    return;
  }

  const fmtKm = m => (m/1000).toFixed(1) + ' km';
  const fmtMin = s => {
    const min = Math.round(s/60);
    if (min < 60) return `${min} min`;
    const h = Math.floor(min/60), r = min % 60;
    return r ? `${h} h ${r} min` : `${h} h`;
  };

  let accM = 0, accS = 0;

  const rowsHtml = legs.map((leg, i) => {
    const from = orderedNames?.[i] ?? leg.start_address ?? `Punto ${i+1}`;
    const to   = orderedNames?.[i+1] ?? leg.end_address ?? `Punto ${i+2}`;
    const m = leg.distance?.value ?? 0;
    const s = leg.duration?.value ?? 0;
    accM += m; accS += s;

    return `
      <tr>
        <td>${i+1}</td>
        <td>${from}</td>
        <td>${to}</td>
        <td class="col-dist">${leg.distance?.text || '—'}</td>
        <td class="col-time">${leg.duration?.text || '—'}</td>
        <td class="col-acum">${fmtKm(accM)}</td>
        <td class="col-acum">${fmtMin(accS)}</td>
      </tr>`;
  }).join('');

  const totalHtml = `
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px">
      <span class="pill">Total: ${fmtKm(accM)}</span>
      <span class="pill">Tiempo total: ${fmtMin(accS)}</span>
      <span class="pill">${orderedNames?.[0] || 'Inicio'} → ${orderedNames?.[orderedNames.length-1] || 'Fin'}</span>
    </div>`;

  document.getElementById('legsWrap').innerHTML = `
    <div class="card">
      <div style="font-weight:600;margin-bottom:6px">Resumen del recorrido</div>
      ${totalHtml}
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>De</th>
            <th>Hacia</th>
            <th class="col-dist">Distancia tramo</th>
            <th class="col-time">Tiempo tramo</th>
            <th class="col-acum">Acum. distancia</th>
            <th class="col-acum">Acum. tiempo</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>`;

  // respetar switches del panel
  applyTableMenu();
}



/**
 * Hace el request final a Directions con waypoints (optimizable), recorta a 23 si hace falta
 */
function routeWithStops(scene, destinoObj, stops, extraNote='') {
  let trimmed = false;

  // Waypoints con nombres para el status/tabla
  let waypointsExtended = stops.map(p => ({ location: p.pos, stopover: true, _name: p.nombre }));
  if (waypointsExtended.length > MAX_WAYPOINTS) {
    waypointsExtended = waypointsExtended.slice(0, MAX_WAYPOINTS);
    trimmed = true;
  }
  const waypoints = waypointsExtended.map(w => ({ location: w.location, stopover: true }));

  const req = {
    origin: scene.origen.pos,
    destination: destinoObj.pos,
    travelMode: google.maps.TravelMode.DRIVING,
    region: 'MX'
  };
  if (waypoints.length) {
    req.optimizeWaypoints = true;
    req.waypoints = waypoints;
  }

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
    if (waypoints.length) {
      const order = res.routes[0].waypoint_order || [];
      const optimNames = order.map(i => waypointsExtended[i]._name);
      if (optimNames.length) info += `. Paradas: ${optimNames.join(' → ')}`;
      if (trimmed) info += ' (se usaron solo las primeras 23 paradas por límite de Google).';
    }
    if (extraNote) info += ` ${extraNote}`;
    setStatus(info);

    // >>> Tabla de tramos (legs) <<<
    const order = res.routes[0].waypoint_order || [];
    // Nombres en el orden final del recorrido: Origen -> paradas optimizadas -> Destino
    const orderedNames = [
      scene.origen.nombre,
      ...order.map(i => (stops[i]?.nombre || waypointsExtended[i]?._name || `Parada ${i+1}`)),
      destinoObj.nombre
    ];
    renderLegsTable(res.routes[0].legs, orderedNames);

    // Guardar última ruta
    // Guardar los datos de la última ruta (para generar la tabla luego)
    lastRouteStops = stops;
    lastRouteDestino = destinoObj;
    lastRouteBaseId = scene.origen.id;


  });
}

function clearRoute(){
  directionsRenderer.set('directions', null);
  directionsRendererUser.set('directions', null);
  if (directionsRendererReturn) directionsRendererReturn.set('directions', null);
  $('#legsWrap').innerHTML = '';
  setStatus('Rutas limpiadas.');
  setCostBtnEnabled(false);

}



  // ======== Tabla: distancias/costo SOLO de las comunidades seleccionadas ========
function buildDistanceCostTable(){
  // Lectura de parámetros
  const tipo = document.getElementById('selCombustible').value;
  const rendimiento = Math.max(0.0001, Number(document.getElementById('inpRendimiento').value || 1)); // evita /0
  const precio = PRECIOS_COMBUSTIBLE[tipo] ?? PRECIOS_COMBUSTIBLE.regular;

  // Ruta actual (guard)
  const dir = directionsRenderer.getDirections?.();
  const route = dir?.routes?.[0];
  const legs  = route?.legs || [];
  if (!legs.length){
    alert('Primero traza una ruta antes de calcular el costo.');
    setStatus('No hay ruta trazada para calcular.');
    return;
  }

  // Nombres en el orden real del recorrido: Origen -> paradas optimizadas -> Destino
  const scene = getEscenario();
  const order = route.waypoint_order || [];
  const namesOrdered = [
    scene.origen.nombre,
    ...order.map(i => lastRouteStops[i]?.nombre ?? `Parada ${i+1}`),
    lastRouteDestino?.nombre || 'Destino'
  ];

  // Filas + totales
  let totalKm = 0, totalCosto = 0;
  const rowsHtml = legs.map((leg, i) => {
    const km = (leg.distance?.value || 0) / 1000;
    const costo = (km / rendimiento) * precio;
    totalKm  += km;
    totalCosto += costo;

    return `
      <tr>
        <td>${i + 1}</td>
        <td>${namesOrdered[i + 1] || leg.end_address || '—'}</td>
        <td class="col-dist">${km.toFixed(1)} km</td>
        <td class="col-cost">${fmtMXN(costo)}</td>
      </tr>`;
  }).join('');

  // Render
  const html = `
    <div class="card">
      <div style="font-weight:600;margin-bottom:6px">Tabla de costos</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Comunidad</th>
            <th class="col-dist">Distancia a ${scene.origen.nombre}</th>
            <th class="col-cost">Costo estimado</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div style="margin-top:8px;padding:8px 10px;border:1px solid var(--border);
        border-radius:8px;background:#0e1522;font-size:13px">
        <b>Combustible:</b> ${tipo.toUpperCase()} ($${precio}/L) &nbsp; • &nbsp;
        <b>Rendimiento:</b> ${rendimiento} km/L<br>
        <b>Total distancia:</b> ${totalKm.toFixed(1)} km &nbsp; • &nbsp;
        <b>Total costo:</b> ${fmtMXN(totalCosto)}
      </div>
    </div>`;

  document.getElementById('tablaWrap').innerHTML = html;

  // Respeta switches del panel (mostrar/ocultar columnas/secciones)
  if (typeof applyTableMenu === 'function') applyTableMenu();

  setStatus(`Tabla de costos actualizada. Total: ${fmtMXN(totalCosto)}.`);
}


// ======== Ruta de regreso (ida y vuelta) ========
function drawReturnRoute() {
  if (!lastRouteDestino) {
    alert('Primero traza una ruta antes de calcular el regreso.');
    setStatus('No hay ruta previa para invertir.');
    return;
  }

  const base = BASES.find(b => b.id === lastRouteBaseId) || getEscenario().origen;
  const destino = lastRouteDestino;
  const stopsReverse = [...lastRouteStops].reverse();

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

    // Distancia/tiempo de la IDA (lo ya trazado)
    const idaDir = directionsRenderer.getDirections?.();
    const legsIda = idaDir?.routes?.[0]?.legs || [];
    const idaKm  = legsIda.reduce((s,l)=> s + (l.distance?.value||0), 0) / 1000;
    const idaMin = legsIda.reduce((s,l)=> s + (l.duration?.value||0), 0) / 60;

    // Costeo con ambas
    const tipo = $('#selCombustible').value;
    const precio = PRECIOS_COMBUSTIBLE[tipo];
    const rend = Number($('#inpRendimiento').value || 1);

    const totalKm  = idaKm + regresoKm;
    const totalMin = idaMin + regresoMin;
    const costoTotal = (totalKm / rend) * precio;

    setStatus(`Ida: ${idaKm.toFixed(1)} km • Regreso: ${regresoKm.toFixed(1)} km • Total: ${totalKm.toFixed(1)} km, ~${Math.round(totalMin)} min, ${fmtMXN(costoTotal)}.`);
  });
}

/*Nuevo */


// al final de script.js
window.initApp = initApp;