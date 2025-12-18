<template>
  <section class="max-w-5xl mx-auto space-y-6 pb-12">
    <header class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-4">
      <div class="flex items-center gap-3">
        <div class="p-2.5 bg-brand/5 rounded-xl border border-brand/10">
          <svg class="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Alertas</h1>
          <p class="text-gray-500 text-sm font-medium">
            {{ noLeidas }} sin leer · {{ total }} en total
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button
          class="rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-red-800 transition-colors shadow-sm shadow-brand/20 disabled:opacity-50"
          @click="markAllRead" :disabled="noLeidas === 0">
          Marcar todas como leídas
        </button>

        <label
          class="flex items-center gap-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-50 cursor-pointer select-none transition-colors">
          <input type="checkbox" v-model="soloNoLeidas" class="rounded border-gray-300 text-brand focus:ring-brand" />
          Solo no leídas
        </label>

        <select v-model="categoria"
          class="rounded-xl bg-white border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 focus:border-brand focus:ring-1 focus:ring-brand outline-none cursor-pointer">
          <option value="todos">Todas las categorías</option>
          <option value="entrega">Entregas</option>
          <option value="inventario">Inventario</option>
          <option value="pedido">Pedidos</option>
          <option value="convocatoria">Convocatorias</option>
          <option value="asesor">Asesor</option>
        </select>
      </div>
    </header>

    <div v-if="lista.length" class="space-y-4">
      <article v-for="a in lista" :key="a.id" class="relative transition-all duration-300" :class="[
        'rounded-2xl border p-5',
        severityClasses(a.severidad, a.leida)
      ]">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center flex-wrap gap-2 mb-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-wide border"
                :class="chipClass(a.tipo)">
                {{ labelTipo(a.tipo) }}
              </span>
              <span class="text-xs font-medium text-gray-400">{{ formatTime(a.createdAt) }}</span>
              <span v-if="!a.leida"
                class="flex items-center gap-1 text-[10px] font-bold text-brand bg-brand/5 border border-brand/10 rounded-full px-2 py-0.5">
                <span class="w-1.5 h-1.5 rounded-full bg-brand"></span>
                NUEVA
              </span>
            </div>

            <h3 class="text-base font-bold text-gray-900 mb-1 leading-snug">{{ a.titulo }}</h3>
            <p class="text-gray-600 text-sm leading-relaxed">{{ a.mensaje }}</p>
          </div>

          <div class="flex items-center gap-2 pt-2 md:pt-0 shrink-0">
            <RouterLink v-if="a.ctaPrimaria?.routeName"
              :to="{ name: a.ctaPrimaria.routeName, params: a.ctaPrimaria.routeParams }"
              class="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200"
              @click="markRead(a.id, true)">
              {{ a.ctaPrimaria.label }}
            </RouterLink>
            <a v-else-if="a.ctaPrimaria?.href" :href="a.ctaPrimaria.href" target="_blank" rel="noopener"
              class="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200"
              @click="markRead(a.id, true)">
              {{ a.ctaPrimaria.label }}
            </a>

            <RouterLink v-if="a.ctaSecundaria?.routeName"
              :to="{ name: a.ctaSecundaria.routeName, params: a.ctaSecundaria.routeParams }"
              class="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold hover:bg-blue-100 transition-colors">
              {{ a.ctaSecundaria.label }}
            </RouterLink>

            <button type="button"
              class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              :title="a.leida ? 'Marcar como no leída' : 'Marcar como leída'" @click="markRead(a.id, !a.leida)">
              <svg v-if="a.leida" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>

            <button type="button"
              class="p-2 rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-red-300"
              :disabled="!a.leida" title="Eliminar alerta" @click.stop.prevent="removeAlert(a.id)">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

          </div>
        </div>
      </article>
    </div>

    <div v-else
      class="flex flex-col items-center justify-center py-20 px-4 text-center bg-white border border-gray-100 rounded-3xl shadow-sm">
      <div class="bg-gray-50 rounded-full p-4 mb-4">
        <svg class="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p class="text-gray-900 font-bold mb-1">No hay alertas para mostrar</p>
      <p class="text-gray-400 text-sm">Crea un pedido o actualiza tu inventario para ver sugerencias.</p>
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
    case 'entrega': return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'inventario': return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'pedido': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'convocatoria': return 'bg-purple-50 text-purple-700 border-purple-100';
    case 'asesor': return 'bg-rose-50 text-rose-700 border-rose-100';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function severityClasses(s: string, leida: boolean) {
  const base = 'shadow-sm hover:shadow-md'
  const opacity = leida ? 'bg-gray-50/50' : 'bg-white';

  if (leida) return `${base} ${opacity} border-gray-100`

  switch (s) {
    case 'urgent': return `${base} ${opacity} border-red-200 bg-red-50/30`;
    case 'warning': return `${base} ${opacity} border-amber-200 bg-amber-50/30`;
    default: return `${base} ${opacity} border-gray-100`;
  }
}
</script>