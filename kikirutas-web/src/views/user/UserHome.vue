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
        <!-- Tarjetas principales -->
        <div class="grid md:grid-cols-3 gap-4">
          <article class="card">
            <h3 class="card-title">Acciones rápidas</h3>
            <div class="flex flex-wrap gap-2 mt-3">
              <RouterLink :to="{name:'u.pedido.nuevo'}" class="chip">Hacer pedido</RouterLink>
              <RouterLink :to="{name:'u.alertas'}" class="chip">Ver alertas</RouterLink>
              <RouterLink :to="{name:'u.perfil'}" class="chip">Editar perfil</RouterLink>
            </div>
          </article>

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
                      {{ p.fechaISO }}
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

          <article class="card">
            <h3 class="card-title">Próxima ruta</h3>

            <div v-if="proximaRuta">
              <p class="muted mt-2">
                Tu próximo pedido saldrá en ruta el
                <strong>{{ proximaRuta.fechaISO }}</strong>
                con
                <strong>{{ proximaRuta.choferNombre || proximaRuta.nombre }}</strong>.
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



    <!-- Sugerencias educativas (mejora de usabilidad) -->
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
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePedidosStore, type PedidoEstado } from '@/stores/pedidos'
import { useRutasStore } from '@/stores/rutas'

const auth = useAuthStore()
const pedidos = usePedidosStore()
const rutas = useRutasStore()

// Nombre mostrado sin depender de una propiedad inexistente en el store
const displayName = computed(() => {
  const u: any = auth.user
  if (!u) return ''
  // intenta name, luego nombre (por si viene del back en español)
  return String(u.name ?? u.nombre ?? '').trim()
})

const hasPedidos = computed(() => pedidos.ordenados.length > 0)

// Mostramos sólo los últimos 3 pedidos de la usuaria
const ultimosPedidos = computed(() => pedidos.ordenados.slice(0, 3))

// Calcula la próxima ruta donde viaja alguno de los pedidos de la usuaria
const proximaRuta = computed(() => {
  if (!hasPedidos.value || rutas.items.length === 0) return null

  // Tomamos todos los ids de pedidos de la usuaria
  const ids = new Set(pedidos.ordenados.map((p) => p.id))

  const candidatas = rutas.items.filter((r) =>
    r.pedidos.some((pid) => ids.has(pid))
  )

  // Sólo rutas que no estén finalizadas
  const activas = candidatas.filter((r) => r.estado !== 'finalizada')
  if (activas.length === 0) return null

  // Ordenamos por fecha ascendente (la más próxima primero)
  const ordenadas = [...activas].sort((a, b) => a.fechaISO.localeCompare(b.fechaISO))

  return ordenadas[0]
})

function labelEstado(e: PedidoEstado): string {
  switch (e) {
    case 'pendiente':
      return 'Pendiente'
    case 'en_ruta':
      return 'En ruta'
    case 'entregado':
      return 'Entregado'
    case 'cancelado':
      return 'Cancelado'
    default:
      return String(e)
  }
}

function estadoBadgeClass(e: PedidoEstado) {
  switch (e) {
    case 'pendiente':
      return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
    case 'en_ruta':
      return 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
    case 'entregado':
      return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
    case 'cancelado':
      return 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
    default:
      return 'bg-white/10 text-white border border-white/20'
  }
}

onMounted(async () => {
  // Carga sólo los pedidos de la usuaria actual
  await pedidos.load({ mine: true })
  // Carga las rutas para poder calcular la "próxima ruta"
  await rutas.load()
})
</script>


<style scoped>
.btn-primary{
  background: var(--brand); color:#0c2b25; font-weight:700;
  padding:.65rem 1rem; border-radius:.8rem;
}
.btn-primary:hover{ filter:brightness(1.05); }
.btn-secondary{
  background: rgba(34,167,136,.15); color:#d6e6df; font-weight:600;
  padding:.65rem 1rem; border-radius:.8rem; border:1px solid rgba(34,167,136,.35);
}
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