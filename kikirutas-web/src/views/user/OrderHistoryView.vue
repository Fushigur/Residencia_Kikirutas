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

/** Nombre completo del usuario autenticado, igualito a como lo guardamos en pedidos */
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
 * Filtro de seguridad en el front:
 * si tenemos nombreActual, solo mostramos pedidos cuyo solicitanteNombre coincida.
 * Si por alguna razón nombreActual está vacío, mostramos todo lo que haya.
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
    :                         'Cancelado'
}
</script>

<template>
  <div class="rounded-xl bg-white/5 border border-white/10 p-4">
    <h2 class="text-xl font-semibold mb-4">Historial</h2>

    <div v-if="soloMios.length" class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-white/60">
            <th class="text-left py-2">Folio</th>
            <th class="text-left">Producto</th>
            <th class="text-left">Cantidad</th>
            <th class="text-left">Fecha</th>
            <th class="text-left">Estatus</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in soloMios"
            :key="p.id"
            class="border-t border-white/10"
          >
            <td class="py-2">{{ p.folio }}</td>
            <td>{{ p.producto }}</td>
            <td>{{ p.cantidad }}</td>
            <td> {{ formatFechaCorta(p.fechaISO) }}</td>
            <td>
              <span
                class="px-2 py-1 rounded text-xs font-medium"
                :class="{
                  'bg-amber-500/15 text-amber-300 border border-amber-500/30': p.estado === 'pendiente',
                  'bg-blue-500/15 text-blue-300 border border-blue-500/30': p.estado === 'en_ruta',
                  'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30': p.estado === 'entregado',
                  'bg-rose-500/15 text-rose-300 border border-rose-500/30': p.estado === 'cancelado',
                }"
              >
                {{ estadoLabel(p.estado) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else class="text-white/70 text-sm">
      Aún no tienes pedidos. Crea uno en <strong>Nuevo pedido</strong>.
    </p>
  </div>
</template>