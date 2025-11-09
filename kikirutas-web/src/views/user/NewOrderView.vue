<template>
  <div class="max-w-5xl">
    <h2 class="text-2xl font-semibold mb-4">Nuevo pedido</h2>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm mb-1">Producto</label>
          <select
            v-model="producto"
            class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2"
          >
            <option value="Alimento ponedoras 40kg">Alimento ponedoras 40kg</option>
            <option value="Alimento iniciador 40kg">Alimento iniciador 40kg</option>
          </select>
        </div>

        <div>
          <label class="block text-sm mb-1">Cantidad (sacos)</label>
          <div class="flex gap-2">
            <input
              v-model.number="cantidad"
              type="number"
              min="1"
              step="1"
              class="flex-1 rounded bg-neutral-900 border border-white/10 px-3 py-2"
            />
            <button
              type="button"
              class="rounded bg-emerald-800/40 border border-emerald-600/40 px-3 py-2 hover:bg-emerald-700/50 text-sm"
              @click="aplicarSugerencia"
            >
              Sugerir ({{ sugerencia }})
            </button>
          </div>
          <p class="text-xs text-white/60 mt-1">
            Cobertura actual: {{ inv.diasCobertura }} días. Consumo diario aprox:
            {{ inv.consumoDiarioKg.toFixed(2) }} kg.
          </p>
        </div>
      </div>

      <div>
        <label class="block text-sm mb-1">Observaciones</label>
        <textarea
          v-model="observaciones"
          rows="3"
          class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2"
        ></textarea>
      </div>

      <div class="flex items-center gap-3">
        <button
          :disabled="!puedeGuardar"
          class="rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
        >
          Guardar pedido
        </button>
        <span class="text-xs text-white/60">
          La sugerencia busca cubrir 14 días + {{ inv.diasSeguridad }} de seguridad.
        </span>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useInventarioStore } from '@/stores/inventario';

const inv = useInventarioStore();
inv.load();

const producto = ref<string>('Alimento ponedoras 40kg');
const cantidad = ref<number | null>(null);
const observaciones = ref<string>('');

const sugerencia = computed(() => inv.sugerirSacos);

function aplicarSugerencia() {
  const s = sugerencia.value;
  cantidad.value = s > 0 ? s : 1;
}

const puedeGuardar = computed(
  () => !!producto.value && cantidad.value !== null && cantidad.value >= 1
);

async function onSubmit() {
  const payload = {
    producto: producto.value,
    cantidad: cantidad.value ?? 1,
    observaciones: observaciones.value.trim(),
  };

  // Integración pendiente con tu API:
  // await api.post('/pedidos', payload)
  console.log('Pedido a guardar:', payload);
  alert('Pedido preparado. Integra la llamada a la API para guardarlo.');
}
</script>
