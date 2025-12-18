<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  modelValue?: { lat: number; lng: number } | null
  initialCenter?: { lat: number; lng: number }
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: { lat: number; lng: number } | null): void
  (e: 'close'): void
}>()

const mapContainer = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)
let map: any = null
let marker: any = null
let autocomplete: any = null

const DEFAULT_CENTER = { lat: 19.7485, lng: -88.7060 } // JMM
const currentPos = ref<{ lat: number; lng: number } | null>(props.modelValue || null)

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (marker) marker.setMap(null)
  map = null
})

function initMap() {
  if (!window.google || !mapContainer.value) return

  const center = props.modelValue || props.initialCenter || DEFAULT_CENTER

  map = new window.google.maps.Map(mapContainer.value, {
    center,
    zoom: 15,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      }
    ]
  })

  // Marker
  marker = new window.google.maps.Marker({
    position: center,
    map,
    draggable: true,
    animation: window.google.maps.Animation.DROP,
    title: "Mueve el pin a tu ubicación"
  })

  // Autocomplete
  if (searchInput.value) {
    autocomplete = new window.google.maps.places.Autocomplete(searchInput.value, {
      componentRestrictions: { country: 'mx' },
      fields: ['geometry', 'name', 'formatted_address']
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (!place.geometry || !place.geometry.location) return

      const pos = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      }

      map.setCenter(pos)
      map.setZoom(17)
      updateMarker(pos)
    })
  }

  // Click on map
  map.addListener('click', (e: any) => {
    updateMarker({
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    })
  })

  // Drag marker
  marker.addListener('dragend', () => {
    updateMarker({
      lat: marker.getPosition().lat(),
      lng: marker.getPosition().lng()
    })
  })
}

function updateMarker(pos: { lat: number; lng: number }) {
  currentPos.value = pos
  marker.setPosition(pos)
}

function useCurrentLocation() {
  if (!navigator.geolocation) {
    alert("Tu navegador no soporta geolocalización.")
    return
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const newPos = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }
      map.setCenter(newPos)
      map.setZoom(17)
      updateMarker(newPos)
    },
    (err) => {
      console.error(err)
      alert("No se pudo obtener tu ubicación. Verifica los permisos de tu navegador.")
    }
  )
}

function confirm() {
  emit('update:modelValue', currentPos.value)
  emit('close')
}

// Watch for external changes (optional)
watch(() => props.modelValue, (val) => {
  if (val && map && marker) {
    const pos = { lat: Number(val.lat), lng: Number(val.lng) }
    marker.setPosition(pos)
    map.setCenter(pos)
    currentPos.value = pos
  }
}, { deep: true })
</script>

<template>
  <div class="map-picker-overlay">
    <div class="map-picker-card">
      <div class="map-picker-header">
        <h3 class="text-lg font-bold text-slate-800">Selecciona tu ubicación</h3>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>

      <div class="map-picker-search">
        <input 
          ref="searchInput"
          type="text" 
          placeholder="Busca tu calle o colonia..." 
          class="search-input"
          @keydown.enter.prevent
        />
        <button @click="useCurrentLocation" class="geo-btn" title="Usar mi ubicación actual">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <div ref="mapContainer" class="map-container"></div>

      <div class="map-picker-footer">
        <p class="text-xs text-slate-500 mb-3 italic">
          Arrastra el pin rojo hasta la puerta de tu casa para que el repartidor llegue directo.
        </p>
        <button @click="confirm" class="confirm-btn">
          Confirmar ubicación
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.map-picker-card {
  background: white;
  width: 100%;
  max-width: 500px;
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  animation: modal-in 0.3s ease-out;
}

@keyframes modal-in {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.map-picker-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
}

.close-btn {
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
  line-height: 1;
  transition: color 0.2s;
}

.close-btn:hover { color: #1e293b; }

.map-picker-search {
  padding: 1rem 1.5rem;
  display: flex;
  gap: 0.5rem;
  position: relative;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #facc15;
  box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.1);
}

.geo-btn {
  background: #f8fafc;
  color: #64748b;
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.geo-btn:hover {
  background: #f1f5f9;
  color: #eab308;
}

.map-container {
  height: 350px;
  width: 100%;
  background: #f1f5f9;
}

.map-picker-footer {
  padding: 1.25rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.confirm-btn {
  width: 100%;
  background: #eab308;
  color: white;
  padding: 0.875rem;
  border-radius: 0.75rem;
  font-weight: 600;
  transition: all 0.2s;
}

.confirm-btn:hover {
  background: #ca8a04;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.confirm-btn:active { transform: translateY(0); }
</style>
