<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { usePedidosStore } from '@/stores/pedidos';

const pedidos = usePedidosStore();
onMounted(() => pedidos.load());

const lista = computed(() => pedidos.ordenados);

function toRuta(id: string) { pedidos.setEstado(id, 'en_ruta'); }
function toEntregado(id: string) { pedidos.setEstado(id, 'entregado'); }
function toCancelado(id: string) { pedidos.setEstado(id, 'cancelado'); }
</script>

<template>
  <div class="rounded-xl bg-white/5 border border-white/10 p-4">
    <h2 class="text-xl font-semibold mb-4">Pedidos</h2>

    <div v-if="lista.length" class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-white/60">
            <th class="text-left py-2">Folio</th>
            <th class="text-left">Producto</th>
            <th class="text-left">Cantidad</th>
            <th class="text-left">Fecha</th>
            <th class="text-left">Estatus</th>
            <th class="text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in lista" :key="p.id" class="border-t border-white/10">
            <td class="py-2">{{ p.folio }}</td>
            <td>{{ p.producto }}</td>
            <td>{{ p.cantidad }}</td>
            <td>{{ p.fechaISO }}</td>
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
                {{ p.estado === 'pendiente' ? 'Pendiente' : p.estado === 'en_ruta' ? 'En ruta' : p.estado === 'entregado' ? 'Entregado' : 'Cancelado' }}
              </span>
            </td>
            <td class="space-x-2 py-2">
              <button
                v-if="p.estado === 'pendiente'"
                class="rounded bg-emerald-600 px-3 py-1 hover:bg-emerald-500"
                @click="toRuta(p.id)"
              >Aceptar (en ruta)</button>

              <button
                v-if="p.estado === 'en_ruta'"
                class="rounded bg-blue-600 px-3 py-1 hover:bg-blue-500"
                @click="toEntregado(p.id)"
              >Marcar entregado</button>

              <button
                v-if="p.estado === 'pendiente' || p.estado === 'en_ruta'"
                class="rounded bg-rose-600 px-3 py-1 hover:bg-rose-500"
                @click="toCancelado(p.id)"
              >Cancelar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else class="text-white/70 text-sm">Sin pedidos.</p>
  </div>
</template>
