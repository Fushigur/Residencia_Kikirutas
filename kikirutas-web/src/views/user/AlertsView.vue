<template>
  <section class="space-y-4">
    <header class="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold">Alertas</h1>
        <p class="text-white/70 text-sm">
          {{ noLeidas }} sin leer · {{ total }} en total
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          class="rounded bg-emerald-600 px-3 py-2 text-sm hover:bg-emerald-500"
          @click="markAllRead"
          :disabled="noLeidas === 0"
        >
          Marcar todas como leídas
        </button>

        <label class="flex items-center gap-2 text-sm bg-white/5 border border-white/10 rounded px-3 py-2">
          <input type="checkbox" v-model="soloNoLeidas" />
          Solo no leídas
        </label>

        <select v-model="categoria" class="rounded bg-neutral-900 border border-white/10 px-3 py-2 text-sm">
          <option value="todos">Todas las categorías</option>
          <option value="entrega">Entregas</option>
          <option value="inventario">Inventario</option>
          <option value="pedido">Pedidos</option>
          <option value="convocatoria">Convocatorias</option>
          <option value="asesor">Asesor</option>
        </select>
      </div>
    </header>

    <div v-if="lista.length" class="space-y-3">
      <article
        v-for="a in lista"
        :key="a.id"
        class="card flex flex-col md:flex-row md:items-center md:justify-between gap-3"
        :class="severityClass(a.severidad, a.leida)"
      >
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="chip" :class="chipClass(a.tipo)">{{ labelTipo(a.tipo) }}</span>
            <span class="text-xs text-white/50">{{ formatTime(a.createdAt) }}</span>
            <span v-if="!a.leida" class="text-[10px] uppercase tracking-wider bg-white/10 border border-white/15 rounded px-2 py-0.5">No leída</span>
          </div>
          <h3 class="font-semibold">{{ a.titulo }}</h3>
          <p class="text-white/80 text-sm mt-0.5">{{ a.mensaje }}</p>
        </div>

        <div class="flex items-center gap-2">
          <RouterLink
            v-if="a.ctaPrimaria?.routeName"
            :to="{ name: a.ctaPrimaria.routeName, params: a.ctaPrimaria.routeParams }"
            class="btn-primary"
            @click="markRead(a.id, true)"
          >
            {{ a.ctaPrimaria.label }}
          </RouterLink>
          <a
            v-else-if="a.ctaPrimaria?.href"
            :href="a.ctaPrimaria.href"
            target="_blank" rel="noopener"
            class="btn-primary"
            @click="markRead(a.id, true)"
          >
            {{ a.ctaPrimaria.label }}
          </a>

          <RouterLink
            v-if="a.ctaSecundaria?.routeName"
            :to="{ name: a.ctaSecundaria.routeName, params: a.ctaSecundaria.routeParams }"
            class="btn-secondary"
          >
            {{ a.ctaSecundaria.label }}
          </RouterLink>

          <button class="btn-ghost" type="button" @click="markRead(a.id, !a.leida)">
            {{ a.leida ? 'Marcar como no leída' : 'Marcar como leída' }}
          </button>

          <!-- Botón eliminar sin confirmación -->
            <button
            type="button"
            class="btn-danger"
            :disabled="!a.leida"
            :title="a.leida ? 'Eliminar alerta' : 'Marca como leída para habilitar eliminar'"
            @click.stop.prevent="removeAlert(a.id)"
            >
            Eliminar
            </button>

        </div>
      </article>
    </div>

    <div v-else class="card text-center py-10">
      <p class="text-white/70">No hay alertas para mostrar.</p>
      <p class="text-white/50 text-sm">Crea un pedido o actualiza tu inventario para ver sugerencias.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAlertasStore } from '@/stores/alertas';
import { useInventarioStore } from '@/stores/inventario';

const alertas = useAlertasStore();
const inv = useInventarioStore();

onMounted(() => {
  inv.load();
  alertas.load();
  alertas.seedDemo();          // opcional
  alertas.refreshSystemAlerts();
});

const { visibles, noLeidasCount } = storeToRefs(alertas);

const lista = visibles;
const noLeidas = noLeidasCount;
const total = computed(() => alertas.items.length);

const categoria = computed({
  get: () => alertas.filtros.categoria,
  set: (v) => alertas.setCategoria(v as any),
});
const soloNoLeidas = computed({
  get: () => alertas.filtros.soloNoLeidas,
  set: (v) => alertas.setSoloNoLeidas(v),
});

const markAllRead = () => alertas.markAllRead();
const markRead = (id: string, value: boolean) => alertas.markRead(id, value);

// Función simplificada para eliminar sin confirmación
const removeAlert = (id: string) => {
  const ok = alertas.remove(id);     // devuelve false si la alerta no está leída
  if (!ok) {
    // opcional: feedback mínimo
    console.warn('Para eliminar, primero marca la alerta como leída.');
  }
};


// Helpers UI
function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} · ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function labelTipo(t: string) {
  switch (t) {
    case 'entrega': return 'Entrega';
    case 'inventario': return 'Inventario';
    case 'pedido': return 'Pedido';
    case 'convocatoria': return 'Convocatoria';
    case 'asesor': return 'Asesor';
    default: return 'Alerta';
  }
}

function chipClass(t: string) {
  switch (t) {
    case 'entrega': return 'chip-blue';
    case 'inventario': return 'chip-amber';
    case 'pedido': return 'chip-emerald';
    case 'convocatoria': return 'chip-purple';
    case 'asesor': return 'chip-rose';
    default: return 'chip-slate';
  }
}

function severityClass(s: string, leida: boolean) {
  const base = leida ? 'opacity-80' : '';
  switch (s) {
    case 'urgent': return `card-urgent ${base}`;
    case 'warning': return `card-warning ${base}`;
    default: return `card ${base}`;
  }
}
</script>

<style scoped>
.card{
  background: rgba(255,255,255,.03);
  border:1px solid rgba(255,255,255,.08);
  border-radius:1rem; padding:1rem;
}
.card-warning{
  background: rgba(255, 193, 7, .07);
  border: 1px solid rgba(255, 193, 7, .25);
  border-radius: 1rem; padding: 1rem;
}
.card-urgent{
  background: rgba(229, 72, 77, .08);
  border: 1px solid rgba(229, 72, 77, .35);
  border-radius: 1rem; padding: 1rem;
}

.btn-primary{
  background:#22A788; color:#0c2b25; font-weight:700;
  padding:.55rem .85rem; border-radius:.7rem; font-size:.9rem;
}
.btn-secondary{
  background: rgba(34,167,136,.15); color:#d6e6df;
  padding:.55rem .85rem; border-radius:.7rem; font-size:.9rem;
  border:1px solid rgba(34,167,136,.35);
}
.btn-ghost{
  background: transparent; color:#d6e6df; border:1px dashed rgba(255,255,255,.2);
  padding:.5rem .75rem; border-radius:.6rem; font-size:.85rem;
}
.btn-ghost:hover{ background: rgba(255,255,255,.05); }

.btn-danger{
  background:#e5484d; color:white; font-weight:700;
  padding:.55rem .85rem; border-radius:.7rem; font-size:.9rem;
}
.btn-danger[disabled]{ opacity:.5; cursor:not-allowed; }

.chip{
  display:inline-block; padding:.15rem .5rem; border-radius:.5rem;
  font-size:.7rem; letter-spacing:.2px; border:1px solid transparent;
}
.chip-blue{ background: rgba(59,130,246,.15); border-color: rgba(59,130,246,.35); }
.chip-amber{ background: rgba(245,158,11,.15); border-color: rgba(245,158,11,.35); }
.chip-emerald{ background: rgba(16,185,129,.15); border-color: rgba(16,185,129,.35); }
.chip-purple{ background: rgba(168,85,247,.15); border-color: rgba(168,85,247,.35); }
.chip-rose{ background: rgba(244,63,94,.15); border-color: rgba(244,63,94,.35); }
.chip-slate{ background: rgba(148,163,184,.15); border-color: rgba(148,163,184,.35); }
</style>