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
    <div class="flex items-center gap-3 mb-8">
      <div class="p-2.5 bg-brand/10 rounded-xl border border-brand/20">
        <svg class="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Historial de Pedidos</h2>
        <p class="text-sm text-gray-500 font-medium">Consulta el estado y detalle de tus solicitudes pasadas.</p>
      </div>
    </div>

    <div class="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
      
      <div v-if="soloMios.length" class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-bold">
              <th class="px-6 py-4">Folio</th>
              <th class="px-6 py-4">Producto</th>
              <th class="px-6 py-4">Cantidad</th>
              <th class="px-6 py-4">Fecha</th>
              <th class="px-6 py-4 text-right">Estatus</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-sm text-gray-700">
            <tr
              v-for="p in soloMios"
              :key="p.id"
              class="hover:bg-gray-50 transition-colors group"
            >
              <td class="px-6 py-4 font-mono font-medium text-gray-600 group-hover:text-brand transition-colors">
                #{{ p.folio }}
              </td>
              
              <td class="px-6 py-4 font-bold text-gray-900">
                {{ p.producto }}
              </td>
              
              <td class="px-6 py-4 font-medium">
                {{ p.cantidad }} saco(s)
              </td>
              
              <td class="px-6 py-4 text-gray-500">
                {{ formatFechaCorta(p.fechaISO) }}
              </td>
              
              <td class="px-6 py-4 text-right">
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border"
                  :class="{
                    'bg-amber-50 text-amber-700 border-amber-200': p.estado === 'pendiente',
                    'bg-blue-50 text-blue-700 border-blue-200': p.estado === 'en_ruta',
                    'bg-emerald-50 text-emerald-700 border-emerald-200': p.estado === 'entregado',
                    'bg-red-50 text-red-700 border-red-200': p.estado === 'cancelado',
                  }"
                >
                  {{ estadoLabel(p.estado) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div class="bg-gray-50 rounded-full p-6 mb-6">
          <svg class="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h3 class="text-gray-900 font-bold text-lg mb-2">Aún no tienes pedidos</h3>
        <p class="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
          Comienza creando tu primera solicitud de producto para verla reflejada aquí.
        </p>
        <RouterLink 
          :to="{name:'u.pedido.nuevo'}"
          class="px-6 py-3 bg-brand hover:bg-red-800 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-brand/20 flex items-center gap-2 hover:-translate-y-0.5"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Crear Nuevo Pedido
        </RouterLink>
      </div>

    </div>
  </div>
</template>