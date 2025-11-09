<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRutasStore } from '@/stores/rutas';
import { usePedidosStore } from '@/stores/pedidos';

const rutas = useRutasStore();
const pedidos = usePedidosStore();

onMounted(() => {
  rutas.load();
  pedidos.load();
});

const selectedRutaId = ref<string | null>(null);
const nuevaRuta = ref<{ nombre: string; fechaISO: string }>({
  nombre: '',
  fechaISO: new Date().toISOString().slice(0, 10),
});

const listaRutas = computed(() => rutas.ordenadas);
const rutaSel = computed(() => selectedRutaId.value ? rutas.byId(selectedRutaId.value) : null);
const pendientes = computed(() => pedidos.pendientes);

const toAssign = ref<string[]>([]); // ids marcados (pendientes)

function crearRuta() {
  const id = rutas.create({
    nombre: (nuevaRuta.value.nombre || 'Ruta sin nombre').trim(),
    fechaISO: nuevaRuta.value.fechaISO,
  });
  selectedRutaId.value = id;
  nuevaRuta.value.nombre = '';
}

function asignarSeleccionados() {
  if (!rutaSel.value || !toAssign.value.length) return;
  for (const pid of toAssign.value) rutas.assignPedido(rutaSel.value.id, pid);
  toAssign.value = [];
}

function quitarPedido(pid: string) {
  if (!rutaSel.value) return;
  rutas.removePedido(rutaSel.value.id, pid);
}

function marcarEntregado(pid: string) {
  pedidos.setEstado(pid, 'entregado');
}

function etiquetaEstado(e: string) {
  return e === 'planificada' ? 'Planificada'
    : e === 'en_ruta' ? 'En ruta'
    : 'Finalizada';
}
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-semibold">Rutas</h1>

    <div class="grid md:grid-cols-3 gap-4">
      <!-- Columna izquierda: crear y seleccionar ruta -->
      <div class="md:col-span-1 space-y-4">
        <div class="rounded-xl bg-white/5 border border-white/10 p-4">
          <h3 class="font-semibold mb-3">Nueva ruta</h3>
          <label class="block text-sm mb-1">Nombre / Operador</label>
          <input v-model.trim="nuevaRuta.nombre" type="text"
                 class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2"
                 placeholder="Ej. Pedro - Norte" />
          <label class="block text-sm mt-3 mb-1">Fecha</label>
          <input v-model="nuevaRuta.fechaISO" type="date"
                 class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2" />
          <button class="mt-3 rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-500" @click="crearRuta">
            Crear ruta
          </button>
        </div>

        <div class="rounded-xl bg-white/5 border border-white/10 p-4">
          <h3 class="font-semibold mb-3">Rutas</h3>
          <div v-if="listaRutas.length" class="space-y-2">
            <button
              v-for="r in listaRutas"
              :key="r.id"
              class="w-full text-left rounded px-3 py-2 border"
              :class="[
                'border-white/10 bg-white/5 hover:bg-white/10',
                selectedRutaId === r.id ? 'ring-2 ring-emerald-600' : ''
              ]"
              @click="selectedRutaId = r.id"
            >
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium">{{ r.nombre }}</div>
                  <div class="text-xs text-white/60">{{ r.fechaISO }}</div>
                </div>
                <span class="px-2 py-1 rounded text-xs"
                      :class="{
                        'bg-blue-500/15 text-blue-300 border border-blue-500/30': r.estado === 'en_ruta',
                        'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30': r.estado === 'finalizada',
                        'bg-slate-500/15 text-slate-300 border border-slate-500/30': r.estado === 'planificada',
                      }">
                  {{ etiquetaEstado(r.estado) }}
                </span>
              </div>
              <div class="text-xs text-white/60 mt-1">Pedidos: {{ r.pedidos.length }}</div>
            </button>
          </div>
          <p v-else class="text-white/70 text-sm">Sin rutas.</p>
        </div>
      </div>

      <!-- Columna derecha: asignar y gestionar pedidos -->
      <div class="md:col-span-2 space-y-4">
        <div class="rounded-xl bg-white/5 border border-white/10 p-4">
          <h3 class="font-semibold mb-3">Pedidos pendientes</h3>
          <div v-if="pendientes.length" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-white/60">
                  <th class="text-left py-2"><input type="checkbox"
                    :checked="toAssign.length === pendientes.length"
                    @change="toAssign = ($event.target as HTMLInputElement).checked ? pendientes.map(p => p.id) : []" /></th>
                  <th class="text-left">Folio</th>
                  <th class="text-left">Producto</th>
                  <th class="text-left">Cantidad</th>
                  <th class="text-left">Fecha</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in pendientes" :key="p.id" class="border-t border-white/10">
                  <td class="py-2">
                    <input type="checkbox" :value="p.id" v-model="toAssign" />
                  </td>
                  <td>{{ p.folio }}</td>
                  <td>{{ p.producto }}</td>
                  <td>{{ p.cantidad }}</td>
                  <td>{{ p.fechaISO }}</td>
                </tr>
              </tbody>
            </table>

            <div class="mt-3">
              <button
                class="rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-500 disabled:opacity-50"
                :disabled="!rutaSel || !toAssign.length"
                @click="asignarSeleccionados"
              >
                Asignar a ruta seleccionada
              </button>
            </div>
          </div>
          <p v-else class="text-white/70 text-sm">No hay pedidos pendientes.</p>
        </div>

        <div class="rounded-xl bg-white/5 border border-white/10 p-4" v-if="rutaSel">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold">Pedidos en {{ rutaSel.nombre }} ({{ rutaSel.fechaISO }})</h3>
            <div class="space-x-2">
              <button class="rounded bg-blue-600 px-3 py-1 hover:bg-blue-500" @click="rutas.setEstado(rutaSel.id, 'en_ruta')">Marcar En ruta</button>
              <button class="rounded bg-emerald-600 px-3 py-1 hover:bg-emerald-500" @click="rutas.setEstado(rutaSel.id, 'finalizada')">Finalizar ruta</button>
            </div>
          </div>

          <div v-if="rutaSel.pedidos.length" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-white/60">
                  <th class="text-left py-2">Folio</th>
                  <th class="text-left">Producto</th>
                  <th class="text-left">Cantidad</th>
                  <th class="text-left">Estado</th>
                  <th class="text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="pid in rutaSel.pedidos" :key="pid" class="border-t border-white/10">
                  <td class="py-2">{{ pedidos.byId(pid)?.folio }}</td>
                  <td>{{ pedidos.byId(pid)?.producto }}</td>
                  <td>{{ pedidos.byId(pid)?.cantidad }}</td>
                  <td>{{ pedidos.byId(pid)?.estado }}</td>
                  <td class="space-x-2">
                    <button class="rounded bg-blue-600 px-3 py-1 hover:bg-blue-500" @click="marcarEntregado(pid)">Entregado</button>
                    <button class="rounded bg-white/10 px-3 py-1 hover:bg-white/20" @click="quitarPedido(pid)">Quitar</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-white/70 text-sm">La ruta aún no tiene pedidos.</p>
        </div>
      </div>
    </div>
  </section>
</template>
