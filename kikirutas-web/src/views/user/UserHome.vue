<template>
  <section class="space-y-6">
    <!-- Encabezado de bienvenida -->
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
      <div>
        <h1 class="text-2xl md:text-3xl font-semibold">
          Hola, {{ displayName || 'Bienvenida' }}
        </h1>
        <p class="text-white/70 text-sm mt-1">
          Administra tus pedidos y revisa las alertas de entrega.
        </p>
      </div>
      <div class="flex gap-2">
        <RouterLink :to="{name:'u.historial'}" class="btn-secondary">Ver historial</RouterLink>
      </div>
    </div>

    <!-- Tarjetas principales -->
    <div class="grid md:grid-cols-3 gap-4">
      <!-- Acciones rápidas -->
      <article class="card">
        <h3 class="card-title">Acciones rápidas</h3>
        <div class="flex flex-wrap gap-2 mt-3">
          <RouterLink :to="{name:'u.pedido.nuevo'}" class="chip">Hacer pedido</RouterLink>
          <RouterLink :to="{name:'u.alertas'}" class="chip">Ver alertas</RouterLink>
          <RouterLink :to="{name:'u.perfil'}" class="chip">Editar perfil</RouterLink>
        </div>
      </article>

      <!-- Estado de pedidos -->
      <article class="card">
        <h3 class="card-title">Estado de tus pedidos</h3>

        <div v-if="hasPedidos" class="space-y-2 mt-2">
          <p class="muted text-xs">
            Mostrando tus últimos {{ ultimosPedidos.length }} pedidos.
          </p>
          <ul class="space-y-2">
            <li
              v-for="p in ultimosPedidos"
              :key="p.id"
              class="flex items-center justify-between text-sm"
            >
              <div>
                <p class="font-medium">
                  {{ p.producto || 'Pedido' }}
                </p>
                <p class="text-xs text-white/60">
                  {{ formatFechaLarga(p.fechaISO || '') }}
                </p>
              </div>
              <span
                class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="estadoBadgeClass(p.estado)"
              >
                {{ labelEstado(p.estado) }}
              </span>
            </li>
          </ul>
        </div>

        <p v-else class="muted mt-2">
          No tienes pedidos registrados aún. Cuando hagas uno, aquí verás su estado.
        </p>
      </article>

      <!-- Próxima ruta -->
      <article class="card">
        <h3 class="card-title">Próxima ruta</h3>

        <div v-if="proximaRuta">
          <p class="muted mt-2">
            {{ proximaRutaMensaje }}
          </p>
          <p class="text-xs text-white/60 mt-1">
            Esta información se actualiza cuando el administrador asigna tu pedido a una ruta.
          </p>
        </div>

        <p v-else class="muted mt-2">
          Aún no hay una ruta asignada para tus pedidos pendientes.
        </p>
      </article>
    </div>

    <!-- Consejos -->
    <div class="card">
      <h3 class="card-title">Consejos útiles</h3>
      <ul class="list mt-3">
        <li>Para hacer un pedido rápido toca el botón <strong>Nuevo pedido</strong>.</li>
        <li>En <strong>Alertas</strong> verás avisos de entrega y cambios de ruta.</li>
        <li>Actualiza tu <strong>Perfil</strong> para recibir notificaciones correctas.</li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
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
  estado: string | null  // estado de la RUTA: borrador | en_curso | cerrada
}

// ---------- Estado local ----------
const ultimosPedidos = ref<PedidoResumen[]>([])
const proximaRuta = ref<ProximaRutaUI | null>(null)

const hasPedidos = computed(() => ultimosPedidos.value.length > 0)

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

function estadoBadgeClass(e: PedidoEstado): string {
  switch (e) {
    case 'pendiente':
      return 'bg-yellow-500/20 text-yellow-300'
    case 'en_ruta':
      return 'bg-blue-500/20 text-blue-300'
    case 'entregado':
      return 'bg-emerald-500/20 text-emerald-300'
    case 'cancelado':
      return 'bg-red-500/20 text-red-300'
    default:
      return 'bg-slate-500/20 text-slate-200'
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
  if (!proximaRuta.value) return ''

  const { fechaISO, choferNombre, nombre, estado } = proximaRuta.value
  const operador = choferNombre || nombre || 'la persona operadora asignada'

  // Si por alguna razón no tenemos fecha, sólo mostramos un mensaje general
  if (!fechaISO) {
    return `Tienes pedidos pendientes que serán incluidos en la siguiente ruta con ${operador}.`
  }

  const hoy = todayLocalISO()

  // Ruta futura
  if (fechaISO > hoy) {
    return `Tienes pedidos pendientes para la ruta del ${formatFechaLarga(fechaISO)} con ${operador}.`
  }

  // Hoy y la ruta ya está en curso
  if (fechaISO === hoy && estado === 'en_curso') {
    return `La ruta de hoy (${formatFechaLarga(fechaISO)}) ya está en camino con ${operador}. Sigue el estado de tus pedidos en esta pantalla.`
  }

  // Hoy pero la ruta sigue en borrador/en espera
  if (fechaISO === hoy) {
    return `Tus pedidos están programados para entregarse hoy (${formatFechaLarga(fechaISO)}) con ${operador}. En cuanto el operador inicie la ruta verás las actualizaciones.`
  }

  // Fecha pasada (por si el backend devuelve la última ruta con pedidos de esta persona)
  if (fechaISO < hoy) {
    return `Tu última ruta registrada fue el ${formatFechaLarga(fechaISO)} con ${operador}. Todos los pedidos de esa ruta deberían estar entregados.`
  }

  return `Tienes pedidos pendientes asignados a una ruta con ${operador}.`
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
    // Si algo falla, dejamos todo vacío para que el template muestre los mensajes por defecto
    ultimosPedidos.value = []
    proximaRuta.value = null
  }
}

onMounted(() => {
  loadDashboard()
  // refresca el panel cada 30 segundos para reflejar cambios del operador
  dashboardTimer = window.setInterval(loadDashboard, 30000)
})

onBeforeUnmount(() => {
  if (dashboardTimer) {
    clearInterval(dashboardTimer)
  }
})
</script>

<style scoped>

.btn-secondary:hover{ background: rgba(34,167,136,.22); }

.card{
  background: rgba(255,255,255,.03);
  border:1px solid rgba(255,255,255,.08);
  border-radius:1rem; padding:1rem;
}
.card-title{ font-weight:600; }
.chip{
  font-size:.9rem; padding:.45rem .75rem; border-radius:999px;
  background: rgba(34,167,136,.15); border:1px solid rgba(34,167,136,.35);
  color:#d6e6df; text-decoration:none;
}
.chip:hover{ background: rgba(34,167,136,.22); }
.muted{ color: rgba(255,255,255,.7); font-size:.95rem; }
.list{ list-style: disc; padding-left:1.1rem; color:#d6e6df; }
</style>
