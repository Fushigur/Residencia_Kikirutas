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
import { computed, onMounted, ref } from 'vue'
import { useRutasStore } from '@/stores/rutas'

interface RutaItem {
  id: string
  nombre?: string
  fechaISO?: string
  paradas?: any[]
  pedidos?: string[]
}

const rutasStore = useRutasStore()

// loading local del componente
const loading = ref(false)

// Rutas que se muestran hoy
const rutas = computed<RutaItem[]>(() => {
  // Si el store ya expone un getter rutasDeHoy, lo usamos
  const deHoy = (rutasStore as any).rutasDeHoy as RutaItem[] | undefined
  if (Array.isArray(deHoy)) return deHoy

  // Si no, tomamos ordenadas o items y filtramos por fecha de hoy
  const lista =
    ((rutasStore as any).ordenadas as RutaItem[] | undefined) ??
    ((rutasStore as any).items as RutaItem[] | undefined)

  if (!Array.isArray(lista)) return []

  const hoy = new Date().toISOString().slice(0, 10)
  return lista.filter(r => r.fechaISO === hoy)
})

onMounted(async () => {
  loading.value = true
  const hoy = new Date().toISOString().slice(0, 10)

  try {
    // Usa el load() nuevo del store, que ahora va contra Laravel
    await (rutasStore as any).load?.({ fecha: hoy })
  } catch (e) {
    console.error('Error cargando rutas de hoy', e)
  } finally {
    loading.value = false
  }
})

// Solo para pruebas/demo: llena el store con datos de ejemplo (no toca el backend)
function sembrarDemo() {
  const hoy = new Date().toISOString().slice(0, 10)
  const demo: RutaItem[] = [
    {
      id: 'hoy-01',
      nombre: 'JMM → Candelaria',
      paradas: ['Candelaria', 'Dziuché'],
      pedidos: ['p-1', 'p-2', 'p-3'],
      fechaISO: hoy,
    },
    {
      id: 'hoy-02',
      nombre: 'JMM → Kancabchén',
      paradas: ['La Presumida', 'Kancabchén'],
      pedidos: ['p-4', 'p-5'],
      fechaISO: hoy,
    },
  ]

  ;(rutasStore as any).items = demo
}
</script>
