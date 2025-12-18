<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRutasStore } from '@/stores/rutas'
import { useAuthStore } from '@/stores/auth'
import { formatFechaLarga } from '@/utils/dateFormat'


interface RutaItem {
  id: string
  nombre?: string
  fechaISO?: string
  paradas?: any[]
  pedidos?: string[]
  choferId?: number | null
}

const rutasStore = useRutasStore()
const auth = useAuthStore()

const loading = ref(false)

// 👉 Fecha local YYYY-MM-DD
function todayLocalISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 👉 Fecha límite 1 mes adelante
function monthAheadISO(): string {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const hoy = todayLocalISO()
const limite = monthAheadISO()

// Base de rutas del store
const baseRutas = computed<RutaItem[]>(() => {
  const base =
    ((rutasStore as any).ordenadas as any[] | undefined) ??
    ((rutasStore as any).items as any[] | undefined)

  if (!Array.isArray(base)) return []
  return base as RutaItem[]
})

// ID del operador actual
const meId = computed(() => auth.user?.id ?? null)

// 👉 Rutas de HOY (para este operador)
const rutasHoy = computed<RutaItem[]>(() => {
  return baseRutas.value
    .filter((r) => r.fechaISO === hoy)
    .filter((r) => {
      if (!meId.value) return false
      const choferId = (r as any).choferId ?? null
      return choferId === meId.value
    })
})

// 👉 Próximas rutas (desde mañana hasta límite, para este operador)
const rutasProximas = computed<RutaItem[]>(() => {
  return baseRutas.value
    .filter((r) => {
      if (!r.fechaISO) return false
      return r.fechaISO > hoy && r.fechaISO <= limite
    })
    .filter((r) => {
      if (!meId.value) return false
      const choferId = (r as any).choferId ?? null
      return choferId === meId.value
    })
    // 👉 Ordenar por fecha Ascendente (más cercana primero)
    .sort((a, b) => (a.fechaISO || '').localeCompare(b.fechaISO || ''))
})

onMounted(async () => {
  loading.value = true
  try {
    // Traemos rutas desde hoy hasta 1 mes adelante
    await (rutasStore as any).load?.({
      desde: hoy,
      hasta: limite,
    })
  } catch (e) {
    console.error('Error cargando rutas', e)
  } finally {
    loading.value = false
  }
})
</script>


<template>
  <section class="container mx-auto">
    <h1 class="text-2xl font-bold mb-4 text-gray-900">Rutas de hoy</h1>

    <div v-if="loading" class="py-10 text-center text-gray-500">
      Cargando rutas…
    </div>

    <div v-else>
      <!-- RUTAS DE HOY -->
      <div v-if="rutasHoy.length === 0" class="mb-8 text-sm text-gray-500">
        No hay rutas asignadas hoy.
      </div>

      <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-10">
        <article
          v-for="r in rutasHoy"
          :key="r.id"
          class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all"
        >
          <h3 class="font-bold text-gray-900 mb-2 text-lg">{{ r.nombre ?? ('Ruta ' + r.id) }}</h3>
          <p class="text-sm text-gray-600 mb-4">
            <span class="font-medium text-gray-800">{{ r.paradas?.length ?? 0 }}</span> paradas · 
            <span class="font-medium text-gray-800">{{ (r.pedidos?.length ?? 0) }}</span> pedidos
            <span v-if="r.fechaISO" class="block mt-1 text-gray-400 text-xs uppercase font-bold tracking-wide">{{ formatFechaLarga(r.fechaISO) }}</span>
          </p>

          <div class="flex gap-2">
            <RouterLink
              :to="{ name: 'op.ruta', params: { id: r.id } }"
              class="inline-flex items-center rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-colors shadow-sm shadow-brand/20"
            >
              Abrir
            </RouterLink>

            <RouterLink
              :to="{ name: 'op.ruta.mapa', params: { id: r.id } }"
              class="inline-flex items-center rounded-xl bg-white border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
            >
              Ver mapa
            </RouterLink>
          </div>
        </article>
      </div>

      <!-- PRÓXIMAS RUTAS -->
      <div class="flex items-center justify-between mb-4 mt-8 pt-6 border-t border-gray-100">
        <h2 class="text-xl font-bold text-gray-900">Próximas rutas (próximo mes)</h2>
      </div>

      <div v-if="rutasProximas.length === 0" class="text-sm text-gray-500">
        No tienes rutas programadas en los próximos 30 días.
      </div>

      <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="r in rutasProximas"
          :key="r.id"
          class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all"
        >
          <h3 class="font-bold text-gray-900 mb-2 text-lg">{{ r.nombre ?? ('Ruta ' + r.id) }}</h3>
          <p class="text-sm text-gray-600 mb-4">
             <span class="font-medium text-gray-800">{{ r.paradas?.length ?? 0 }}</span> paradas · 
            <span class="font-medium text-gray-800">{{ (r.pedidos?.length ?? 0) }}</span> pedidos
            <span v-if="r.fechaISO" class="block mt-1 text-gray-400 text-xs uppercase font-bold tracking-wide">{{ formatFechaLarga(r.fechaISO) }}</span>
          </p>

          <div class="flex gap-2">
            <RouterLink
              :to="{ name: 'op.ruta', params: { id: r.id } }"
              class="inline-flex items-center rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-colors shadow-sm shadow-brand/20"
            >
              Abrir
            </RouterLink>

            <RouterLink
              :to="{ name: 'op.ruta.mapa', params: { id: r.id } }"
              class="inline-flex items-center rounded-xl bg-white border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
            >
              Ver mapa
            </RouterLink>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
