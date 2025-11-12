<template>
  <section class="container mx-auto">
    <h1 class="text-2xl font-bold mb-4">Rutas de hoy</h1>

    <div v-if="loading" class="py-10 text-center opacity-80">Cargando rutas…</div>

    <div v-else-if="rutas.length === 0" class="alert alert-info">
      No hay rutas asignadas hoy.
      <button class="btn btn-sm btn-primary ms-2" @click="sembrarDemo">Crear demo</button>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <article v-for="r in rutas" :key="r.id" class="rounded-xl border border-white/10 bg-white/5 p-4">
        <h3 class="font-semibold mb-1">{{ r.nombre ?? ('Ruta ' + r.id) }}</h3>
        <p class="text-sm opacity-80 mb-2">
          {{ r.paradas?.length ?? 0 }} paradas · {{ (r.pedidos?.length ?? 0) }} pedidos
          <span v-if="r.fechaISO" class="ms-2 opacity-70">• {{ r.fechaISO }}</span>
        </p>

        <div class="flex gap-2">
          <RouterLink
            :to="{ name: 'op.ruta', params: { id: r.id } }"
            class="inline-flex items-center rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            Abrir
          </RouterLink>

          <RouterLink
            :to="{ name: 'op.ruta.mapa', params: { id: r.id } }"
            class="inline-flex items-center rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Ver mapa
          </RouterLink>
        </div>

      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRutasStore } from '@/stores/rutas'

interface RutaItem { id: string; nombre?: string; fechaISO?: string; paradas?: any[]; pedidos?: string[] }

const rutasStore = useRutasStore()
const loading = computed<boolean>(() => Boolean((rutasStore as any).loading ?? false))

const rutas = computed<RutaItem[]>(() => {
  const fromGetter = (rutasStore as any).ordenadas as RutaItem[] | undefined
  if (Array.isArray(fromGetter) && fromGetter.length > 0) return fromGetter
  const deHoy = (rutasStore as any).rutasDeHoy as RutaItem[] | undefined
  if (Array.isArray(deHoy) && deHoy.length > 0) return deHoy
  try {
    const raw = localStorage.getItem('rutas_kikirutas'); if (!raw) return []
    const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed as RutaItem[] : []
  } catch { return [] }
})

onMounted(() => {
  ;(rutasStore as any).loadDeHoy?.()
  ;(rutasStore as any).load?.()
})

function sembrarDemo() {
  const demo: RutaItem[] = [
    { id: 'hoy-01', nombre: 'JMM → Candelaria', paradas: ['Candelaria','Dziuché'], pedidos: ['p-1','p-2','p-3'], fechaISO: new Date().toISOString().slice(0,10) },
    { id: 'hoy-02', nombre: 'JMM → Kancabchén', paradas: ['La Presumida','Kancabchén'], pedidos: ['p-4','p-5'], fechaISO: new Date().toISOString().slice(0,10) },
  ]
  try { localStorage.setItem('rutas_kikirutas', JSON.stringify(demo)) } catch {}
  location.reload()
}
</script>
