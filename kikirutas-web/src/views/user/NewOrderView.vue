<template>
  <div class="rounded-xl bg-white/5 border border-white/10 p-4 max-w-4xl">
    <header class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold">Nuevo pedido</h2>

      <div v-if="sugerencia > 0" class="flex items-center gap-2 text-sm">
        <span class="text-white/70">Sugerencia: <b>{{ sugerencia }}</b> saco(s)</span>
        <button type="button" class="rounded bg-emerald-600 px-3 py-1 hover:bg-emerald-500" @click="aplicarSugerencia">
          Usar sugerencia
        </button>
      </div>
    </header>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm mb-1">Producto</label>
          <select v-model="producto" class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2">
            <option disabled value="">Selecciona un producto…</option>
            <option v-for="p in productos" :key="p" :value="p">{{ p }}</option>
          </select>
          <p v-if="errors.producto" class="text-rose-300 text-xs mt-1">{{ errors.producto }}</p>
        </div>

        <div>
          <label class="block text-sm mb-1">Cantidad (sacos)</label>
          <input v-model.number="cantidad" type="number" min="1" class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2" />
          <p v-if="errors.cantidad" class="text-rose-300 text-xs mt-1">{{ errors.cantidad }}</p>
        </div>
      </div>

      <div>
        <label class="block text-sm mb-1">Observaciones</label>
        <textarea v-model="observaciones" rows="3" class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2"></textarea>
      </div>

      <div class="flex items-center gap-3 pt-2">
        <button class="rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-500 disabled:opacity-60" type="submit" :disabled="isSaving">
          {{ isSaving ? 'Guardando…' : 'Guardar pedido' }}
        </button>
        <p v-if="formMsg" class="text-sm text-white/70">{{ formMsg }}</p>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useInventarioStore } from '@/stores/inventario';
import { useAlertasStore } from '@/stores/alertas';
import { usePedidosStore } from '@/stores/pedidos';

const inv = useInventarioStore(); inv.load();
const alertas = useAlertasStore();
const pedidos = usePedidosStore(); pedidos.load();

const productos = ref<string[]>([
  'Alimento ponedoras 40kg',
  'Alimento iniciador 40kg',
]);

const producto = ref<string>('');
const cantidad = ref<number | null>(null);
const observaciones = ref<string>('');
const isSaving = ref(false);
const formMsg = ref<string>('');
const errors = ref<{ producto?: string; cantidad?: string }>({});

function validate(): boolean {
  errors.value = {};
  if (!producto.value) errors.value.producto = 'Selecciona un producto';
  if (!cantidad.value || cantidad.value < 1) errors.value.cantidad = 'Ingresa una cantidad válida (mínimo 1)';
  return Object.keys(errors.value).length === 0;
}

const sugerencia = computed(() => inv.sugerirSacos ?? 0);
function aplicarSugerencia() { if (sugerencia.value > 0) cantidad.value = sugerencia.value; }

async function onSubmit() {
  if (!validate()) return;
  isSaving.value = true;

  try {
    const payload = {
      producto: producto.value,
      cantidad: cantidad.value ?? 1,
      observaciones: (observaciones.value || '').trim(),
    };

    // TODO: POST real a tu API -> await api.post('/pedidos', payload)

    // 1) Guardar en historial local con estado "pendiente"
    pedidos.addFromNewOrder(payload);

    // 2) Alerta de confirmación
    alertas.add({
      titulo: 'Pedido creado',
      mensaje: `Tu pedido de ${payload.cantidad} sacos fue registrado.`,
      tipo: 'pedido',
      severidad: 'info',
      ctaPrimaria: { label: 'Ver historial', routeName: 'u.historial' },
    });

    formMsg.value = 'Pedido registrado. Puedes revisarlo en Historial.';
  } catch (e) {
    formMsg.value = 'No se pudo registrar el pedido. Inténtalo de nuevo.';
    console.error(e);
  } finally {
    isSaving.value = false;
  }
}
</script>
