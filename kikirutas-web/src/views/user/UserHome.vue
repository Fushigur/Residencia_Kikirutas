<template>
  <section class="max-w-7xl mx-auto space-y-6 pb-10">
    
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">
          Hola, <span class="text-brand">{{ displayName || 'Bienvenida' }}</span>
        </h1>
        <p class="text-gray-500 text-sm mt-1">
          Administra tus pedidos y revisa las alertas de entrega.
        </p>
      </div>
      
      <RouterLink 
        :to="{name:'u.historial'}" 
        class="text-sm font-bold text-brand hover:text-red-800 flex items-center gap-1 transition-colors"
      >
        Ver historial completo
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
      </RouterLink>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

      <article class="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
        <div>
          <h3 class="font-bold text-gray-900 mb-4">Acciones rápidas</h3>
          
          <div class="space-y-3">
            <RouterLink 
              :to="{name:'u.pedido.nuevo'}" 
              class="flex items-center justify-center gap-2 w-full bg-brand hover:bg-red-800 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-brand/20 hover:-translate-y-0.5"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
              Hacer Nuevo Pedido
            </RouterLink>

            <div class="flex gap-3">
              <RouterLink 
                :to="{name:'u.alertas'}" 
                class="flex-1 text-center py-2 px-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Ver alertas
              </RouterLink>
              <RouterLink 
                :to="{name:'u.perfil'}" 
                class="flex-1 text-center py-2 px-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Editar perfil
              </RouterLink>
            </div>
          </div>
        </div>
      </article>

      <article class="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md transition-all">
        <h3 class="font-bold text-gray-900 mb-1">Estado de tus pedidos</h3>
        <p class="text-xs text-gray-400 mb-4 font-medium">Mostrando el último movimiento.</p>

        <div v-if="hasPedidos" class="flex-1 flex flex-col justify-center">
          <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div class="flex justify-between items-start mb-2">
              <span class="font-bold text-gray-900 text-sm line-clamp-2">
                {{ ultimosPedidos[0].producto || 'Pedido' }}
              </span>
              <span 
                class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                :class="estadoBadgeClass(ultimosPedidos[0].estado)"
              >
                {{ labelEstado(ultimosPedidos[0].estado) }}
              </span>
            </div>
            <p class="text-xs text-gray-500 font-medium">
              {{ formatFechaLarga(ultimosPedidos[0].fechaISO || '') }}
            </p>
          </div>
        </div>

        <div v-else class="flex-1 flex items-center justify-center text-gray-400 text-sm italic">
          No hay pedidos recientes.
        </div>
      </article>

      <article class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
        <h3 class="font-bold text-gray-900 mb-4">Próxima ruta</h3>
        
        <div v-if="proximaRutaMensaje">
          <p class="text-sm text-gray-600 leading-relaxed">
            {{ proximaRutaMensaje }}
          </p>
          <p class="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100 font-medium">
            Esta información se actualiza cuando el administrador asigna rutas.
          </p>
        </div>

        <div v-else class="text-sm text-gray-400 italic">
           Aún no hay una ruta asignada para tus pedidos pendientes.
        </div>
      </article>

    </div>

    <article class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
      <h3 class="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide opacity-80">Consejos útiles</h3>
      <ul class="space-y-2 text-sm text-gray-600">
        <li class="flex items-start gap-2">
          <span class="text-brand mt-1 font-bold">•</span>
          <span>Para hacer un pedido rápido toca el botón <b>Nuevo pedido</b>.</span>
        </li>
        <li class="flex items-start gap-2">
           <span class="text-brand mt-1 font-bold">•</span>
          <span>En <b>Alertas</b> verás avisos de entrega y cambios de ruta.</span>
        </li>
        <li class="flex items-start gap-2">
           <span class="text-brand mt-1 font-bold">•</span>
          <span>Actualiza tu <b>Perfil</b> para recibir notificaciones correctas.</span>
        </li>
      </ul>
    </article>

  </section>
</template>

<script setup lang="ts">
// TU LOGICA DE SCRIPT ORIGINAL (NO CAMBIA NADA)
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/api'
import { useAuthStore } from '@/stores/auth'
import type { PedidoEstado } from '@/stores/pedidos'
import { formatFechaLarga } from '@/utils/dateFormat'

const auth = useAuthStore()

// Nombre mostrado en el saludo
const displayName = computed(() => {
  const u: any = auth.user
  if (!u) return ''
  return String(u.name ?? u.nombre ?? '').trim()
})

// ---------- Tipos locales para el dashboard ----------
type PedidoResumen = {
  id: number
  producto: string
  cantidad: number
  estado: PedidoEstado
  fechaISO: string | null
}

type ProximaRutaUI = {
  fechaISO: string | null
  choferNombre: string | null
  nombre: string | null
  estado: string | null
}

// ---------- Estado local ----------
const ultimosPedidos = ref<PedidoResumen[]>([])
const proximaRuta = ref<ProximaRutaUI | null>(null)

const hasPedidos = computed(() => ultimosPedidos.value.length > 0)

// Último pedido ENTREGADO entre los recientes
const ultimoEntregado = computed<PedidoResumen | null>(() => {
  for (const p of ultimosPedidos.value) {
    if (p.estado === 'entregado') return p
  }
  return null
})


let dashboardTimer: number | undefined

// ---------- Helpers de estado ----------
function labelEstado(e: PedidoEstado): string {
  const map: Record<PedidoEstado, string> = {
    pendiente: 'Pendiente',
    en_ruta: 'En ruta',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
  }
  return map[e] ?? e
}

// Colores de badges (Simplificados)
function estadoBadgeClass(e: PedidoEstado): string {
  switch (e) {
    case 'pendiente':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'en_ruta':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'entregado':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'cancelado':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-gray-100 text-gray-500 border-gray-200'
  }
}

// ---------- Helper fecha local ----------
function todayLocalISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Mensaje dinámico para la tarjeta "Próxima ruta"
const proximaRutaMensaje = computed(() => {
  const ruta = proximaRuta.value
  const ultimo = ultimoEntregado.value

  if (!ruta && !ultimo) return ''

  let siguienteParte = ''
  if (ruta) {
    const { fechaISO, choferNombre, nombre, estado } = ruta
    const operador = choferNombre || nombre || 'el operador asignado'
    const hoy = todayLocalISO()

    if (!fechaISO) {
      siguienteParte = `Tienes pedidos pendientes que serán incluidos en la próxima ruta con ${operador}.`
    } else if (fechaISO > hoy) {
      siguienteParte = `Tu siguiente entrega está programada para el ${formatFechaLarga(fechaISO)} con ${operador}.`
    } else if (fechaISO === hoy && estado === 'en_curso') {
      siguienteParte = `Tu pedido ya está en ruta hoy (${formatFechaLarga(fechaISO)}) con ${operador}.`
    } else if (fechaISO === hoy) {
      siguienteParte = `Tus pedidos están programados para entregarse hoy (${formatFechaLarga(fechaISO)}) con ${operador}.`
    } else if (fechaISO < hoy) {
      siguienteParte = `Tu última ruta registrada fue el ${formatFechaLarga(fechaISO)} con ${operador}.`
    } else {
      siguienteParte = `Tu siguiente entrega está programada con ${operador}.`
    }
  }

  let parteEntregado = ''
  if (ultimo && ultimo.fechaISO) {
    const fechaUltimo = formatFechaLarga(ultimo.fechaISO)
    const producto = ultimo.producto || 'tu pedido'
    parteEntregado = `Tu último pedido entregado fue "${producto}" el ${fechaUltimo}. `
  }

  return `${parteEntregado}${siguienteParte}`.trim()
})

// ---------- Carga desde /api/usuario/dashboard ----------
async function loadDashboard() {
  try {
    const { data } = await api.get('/usuario/dashboard')

    const pedidos = Array.isArray(data.pedidos_recientes)
      ? data.pedidos_recientes
      : []

    ultimosPedidos.value = pedidos.map((p: any) => ({
      id: Number(p.id),
      producto: String(p.producto ?? 'Pedido'),
      cantidad: Number(p.cantidad ?? 0),
      estado: (p.estado ?? 'pendiente') as PedidoEstado,
      fechaISO: p.fecha ?? null,
    }))

    if (data.proxima_ruta) {
      const r = data.proxima_ruta
      proximaRuta.value = {
        fechaISO: r.fecha ?? null,
        choferNombre: r.chofer_nombre ?? null,
        nombre: r.chofer_nombre ?? null,
        estado: r.estado ?? null,
      }
    } else {
      proximaRuta.value = null
    }
  } catch (err) {
    ultimosPedidos.value = []
    proximaRuta.value = null
  }
}

onMounted(() => {
  loadDashboard()
  dashboardTimer = window.setInterval(loadDashboard, 30000)
})

onBeforeUnmount(() => {
  if (dashboardTimer) {
    clearInterval(dashboardTimer)
  }
})
</script>