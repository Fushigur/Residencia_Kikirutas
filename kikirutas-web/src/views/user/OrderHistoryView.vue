<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePedidosStore, type PedidoEstado } from '@/stores/pedidos'
import { useAuthStore } from '@/stores/auth'
import { formatFechaCorta } from '@/utils/dateFormat'

const pedidos = usePedidosStore()
const auth = useAuthStore()

// Al montar, pedimos SOLO mis pedidos al backend (?mine=1)
onMounted(() => {
  pedidos.load({ mine: true })
})

const { ordenados } = storeToRefs(pedidos)

/** Nombre completo del usuario autenticado */
const nombreActual = computed(() => {
  const a: any = auth
  const user: any = a.user || a.me || a.perfil || {}

  const partes = [
    user.nombre,
    user.apellido_paterno,
    user.apellido_materno,
  ].filter(Boolean)

  const nombreBackend = partes.length ? partes.join(' ') : ''

  return (
    nombreBackend ||
    a.displayName ||
    a.name ||
    ''
  )
})

/**
 * Filtro de seguridad en el front
 */
const soloMios = computed(() => {
  const n = nombreActual.value.trim()
  if (!n) return ordenados.value
  return ordenados.value.filter(p => (p.solicitanteNombre || '').trim() === n)
})

function estadoLabel(e: PedidoEstado) {
  return e === 'pendiente'   ? 'Pendiente'
    : e === 'en_ruta'        ? 'En ruta'
    : e === 'entregado'      ? 'Entregado'
    :                             'Cancelado'
}
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <div class="flex items-center gap-3 mb-6">
      <div class="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
        <svg class="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <h2 class="text-xl font-bold text-white">Historial de Pedidos</h2>
        <p class="text-xs text-white/50">Consulta el estado y detalle de tus solicitudes pasadas.</p>
      </div>
    </div>

    <div class="rounded-xl bg-white/5 border border-white/10 overflow-hidden shadow-xl">
      
      <div v-if="soloMios.length" class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-white/50">
              <th class="px-6 py-4 font-medium">Folio</th>
              <th class="px-6 py-4 font-medium">Producto</th>
              <th class="px-6 py-4 font-medium">Cantidad</th>
              <th class="px-6 py-4 font-medium">Fecha</th>
              <th class="px-6 py-4 font-medium text-right">Estatus</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-sm text-white/80">
            <tr
              v-for="p in soloMios"
              :key="p.id"
              class="hover:bg-white/5 transition-colors group"
            >
              <td class="px-6 py-4 font-mono text-white/60 group-hover:text-emerald-400 transition-colors">
                #{{ p.folio }}
              </td>
              
              <td class="px-6 py-4 font-medium text-white">
                {{ p.producto }}
              </td>
              
              <td class="px-6 py-4">
                {{ p.cantidad }} saco(s)
              </td>
              
              <td class="px-6 py-4 text-white/60">
                {{ formatFechaCorta(p.fechaISO) }}
              </td>
              
              <td class="px-6 py-4 text-right">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                  :class="{
                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20': p.estado === 'pendiente',
                    'bg-blue-500/10 text-blue-400 border-blue-500/20': p.estado === 'en_ruta',
                    'bg-emerald-500/10 text-emerald-500 border-emerald-500/20': p.estado === 'entregado',
                    'bg-red-500/10 text-red-500 border-red-500/20': p.estado === 'cancelado',
                  }"
                >
                  {{ estadoLabel(p.estado) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div class="bg-white/5 rounded-full p-4 mb-4">
          <svg class="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h3 class="text-white font-medium mb-1">Aún no tienes pedidos</h3>
        <p class="text-white/50 text-sm mb-6 max-w-xs">
          Comienza creando tu primera solicitud de producto para verla reflejada aquí.
        </p>
        <RouterLink 
          :to="{name:'u.pedido.nuevo'}"
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Crear Nuevo Pedido
        </RouterLink>
      </div>

    </div>
  </div>
</template>