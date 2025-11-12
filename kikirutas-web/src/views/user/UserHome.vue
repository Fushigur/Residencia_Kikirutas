<template>
  <section class="space-y-6">
    <!-- Encabezado de bienvenida -->
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
      <div>
        <h1 class="text-2xl md:text-3xl font-semibold">Hola, {{ auth.displayName ?? 'Bienvenida' }}</h1>
        <p class="text-white/70 text-sm mt-1">
          Administra tus pedidos y revisa las alertas de entrega.
        </p>
      </div>
      <div class="flex gap-2">
        <RouterLink :to="{name:'u.pedido.nuevo'}" class="btn-primary">Nuevo pedido</RouterLink>
        <RouterLink :to="{name:'u.historial'}" class="btn-secondary">Ver historial</RouterLink>
      </div>
    </div>

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
        <h3 class="card-title">Estado</h3>
        <p class="muted mt-2">No hay pedidos activos.</p>
      </article>

      <article class="card">
        <h3 class="card-title">Próxima ruta</h3>
        <p class="muted mt-2">Aún no hay fecha programada.</p>
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
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
const auth = useAuthStore();
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
