<template>
  <section class="max-w-7xl mx-auto space-y-6 pb-10">

    <header class="flex items-center gap-4 py-4 border-b border-gray-100">
      <div class="p-3 bg-brand/5 rounded-2xl border border-brand/10">
        <svg class="w-8 h-8 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m8-10h2M7 21h10a2 2 0 002-2v-6a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2zm0 0h2v-2h-2v2z" />
        </svg>
      </div>
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Mi Granja</h1>
        <p class="text-gray-500 text-sm font-medium">Gestiona tu inventario para calcular tus necesidades.</p>
      </div>
    </header>

    <div class="grid lg:grid-cols-12 gap-8">

      <div class="lg:col-span-7">
        <form @submit.prevent="onSave"
          class="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 space-y-8 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-900">Configuración Actual</h3>
            <span
              class="text-xs text-brand bg-brand/5 px-2.5 py-1 rounded-lg border border-brand/10 font-bold uppercase tracking-wide">Editable</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-2">
              <label class="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Total de Aves</label>
              <div class="relative group">
                <input v-model.number="form.gallinas" type="number" min="0"
                  class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 pl-11 text-gray-900 focus:bg-white focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all font-medium"
                  required />
                <div class="absolute left-0 inset-y-0 pl-3.5 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400 group-focus-within:text-brand transition-colors" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Sacos en Inventario</label>
              <div class="relative group">
                <input v-model.number="form.sacos" type="number" min="0"
                  class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 pl-11 text-gray-900 focus:bg-white focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all font-medium"
                  required />
                <div class="absolute left-0 inset-y-0 pl-3.5 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400 group-focus-within:text-brand transition-colors" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Consumo (g/día por
                ave)</label>
              <div class="relative group">
                <input v-model.number="form.consumoGrPorGallinaDia" type="number" min="1"
                  class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:bg-white focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all font-medium" />
                <div
                  class="absolute right-3.5 inset-y-0 flex items-center pointer-events-none text-xs text-gray-400 font-bold">
                  gr</div>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Peso por Saco</label>
              <div class="relative group">
                <input v-model.number="form.kgPorSaco" type="number" min="1"
                  class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:bg-white focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all font-medium" />
                <div
                  class="absolute right-3.5 inset-y-0 flex items-center pointer-events-none text-xs text-gray-400 font-bold">
                  kg</div>
              </div>
            </div>

            <div class="space-y-2 md:col-span-2">
              <label class="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Días de Seguridad
                (Colchón)</label>
              <input v-model.number="form.diasSeguridad" type="number" min="0"
                class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:bg-white focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all font-medium" />
              <p class="text-[10px] text-gray-400 ml-1 font-medium mt-1">Días extra que deseas cubrir además de las 2
                semanas base.</p>
            </div>
          </div>

          <div class="pt-6 flex items-center gap-4 border-t border-gray-100 mt-6">
            <button type="submit"
              class="flex-1 bg-brand hover:bg-red-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-brand/20 active:scale-[0.98] text-sm hover:-translate-y-0.5">
              Guardar Cambios
            </button>
            <button type="button"
              class="px-6 py-3.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors font-bold text-sm"
              @click="onReset">
              Restablecer
            </button>
          </div>
        </form>
      </div>

      <div class="lg:col-span-5 space-y-6">

        <article
          class="relative overflow-hidden bg-gradient-to-br from-brand to-red-600 rounded-2xl p-8 shadow-2xl text-white">
          <div
            class="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2">
          </div>
          <div
            class="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2">
          </div>

          <h3 class="text-xs font-bold text-white/90 uppercase tracking-wider mb-2">Sugerencia de Pedido</h3>
          <p class="text-white/70 text-xs mb-8 font-medium">Basado en consumo de 14 días + {{ form.diasSeguridad }} de
            seguridad.</p>

          <div class="flex items-baseline gap-3 mb-6">
            <span class="text-6xl font-black text-white tracking-tight">{{ inv.sugerirSacos }}</span>
            <span class="text-xl text-white/80 font-medium">sacos</span>
          </div>

          <div v-if="inv.sugerirSacos > 0"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-brand text-xs font-bold shadow-sm">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
            </svg>
            Recomendado pedir ahora
          </div>
          <div v-else
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white text-xs font-bold">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Inventario suficiente
          </div>
        </article>

        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Consumo Diario</p>
            <p class="text-2xl font-bold text-gray-900">{{ inv.consumoDiarioKg.toFixed(2) }} <span
                class="text-sm font-medium text-gray-400">kg</span></p>
          </div>

          <div class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Inventario Total</p>
            <p class="text-2xl font-bold text-gray-900">{{ inv.totalKg }} <span
                class="text-sm font-medium text-gray-400">kg</span></p>
          </div>

          <div
            class="col-span-2 bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div>
              <p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Cobertura Estimada</p>
              <div class="flex items-baseline gap-2">
                <p class="text-3xl font-black text-gray-900">{{ inv.diasCobertura }}</p>
                <p class="text-sm text-gray-500 font-medium">días restantes</p>
              </div>
            </div>
            <div class="p-3 bg-gray-50 rounded-full">
              <svg class="w-8 h-8 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import { useInventarioStore } from '@/stores/inventario';

const inv = useInventarioStore();

const form = reactive({
  gallinas: 0,
  sacos: 0,
  kgPorSaco: 40,
  consumoGrPorGallinaDia: 110,
  diasSeguridad: 5,
});

onMounted(async () => {
  try {
    await inv.fetchFromServer();
  } catch {
    inv.load();
  }

  form.gallinas = inv.gallinas;
  form.sacos = inv.sacos;
  form.kgPorSaco = inv.kgPorSaco;
  form.consumoGrPorGallinaDia = inv.consumoGrPorGallinaDia;
  form.diasSeguridad = inv.diasSeguridad;
});

async function onSave() {
  inv.set(form);
  await inv.saveToServer();
}

function onReset() {
  inv.$reset()
  form.gallinas = inv.gallinas
  form.sacos = inv.sacos
  form.kgPorSaco = inv.kgPorSaco
  form.consumoGrPorGallinaDia = inv.consumoGrPorGallinaDia
  form.diasSeguridad = inv.diasSeguridad
}
</script>

<style scoped>
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type=number] {
  -moz-appearance: textfield;
}
</style>