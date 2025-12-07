<template>
  <section class="max-w-7xl mx-auto space-y-6 pb-10">
    
    <header class="flex items-center gap-3 py-4 border-b border-white/5">
      <div class="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
        <svg class="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m8-10h2M7 21h10a2 2 0 002-2v-6a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2zm0 0h2v-2h-2v2z" />
        </svg>
      </div>
      <div>
        <h1 class="text-2xl font-bold text-white">Mi Granja</h1>
        <p class="text-white/50 text-sm">Gestiona tu inventario para calcular tus necesidades.</p>
      </div>
    </header>

    <div class="grid lg:grid-cols-12 gap-8">
      
      <div class="lg:col-span-7">
        <form @submit.prevent="onSave" class="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-semibold text-white">Configuración Actual</h3>
            <span class="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">Editable</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-xs font-medium text-white/60 uppercase tracking-wide ml-1">Total de Aves</label>
              <div class="relative group">
                <input 
                  v-model.number="form.gallinas" 
                  type="number" 
                  min="0" 
                  class="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 pl-11 text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  required 
                />
                <div class="absolute left-0 inset-y-0 pl-3 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-white/30 group-focus-within:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-medium text-white/60 uppercase tracking-wide ml-1">Sacos en Inventario</label>
              <div class="relative group">
                <input 
                  v-model.number="form.sacos" 
                  type="number" 
                  min="0" 
                  class="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 pl-11 text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  required 
                />
                <div class="absolute left-0 inset-y-0 pl-3 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-white/30 group-focus-within:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-medium text-white/60 uppercase tracking-wide ml-1">Consumo (g/día por ave)</label>
              <div class="relative group">
                <input 
                  v-model.number="form.consumoGrPorGallinaDia" 
                  type="number" 
                  min="1" 
                  class="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
                <div class="absolute right-3 inset-y-0 flex items-center pointer-events-none text-xs text-white/30">gr</div>
              </div>
            </div>

             <div class="space-y-2">
              <label class="text-xs font-medium text-white/60 uppercase tracking-wide ml-1">Peso por Saco</label>
              <div class="relative group">
                <input 
                  v-model.number="form.kgPorSaco" 
                  type="number" 
                  min="1" 
                  class="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
                <div class="absolute right-3 inset-y-0 flex items-center pointer-events-none text-xs text-white/30">kg</div>
              </div>
            </div>

            <div class="space-y-2 md:col-span-2">
              <label class="text-xs font-medium text-white/60 uppercase tracking-wide ml-1">Días de Seguridad (Colchón)</label>
              <input 
                v-model.number="form.diasSeguridad" 
                type="number" 
                min="0" 
                class="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
              <p class="text-[10px] text-white/40 ml-1">Días extra que deseas cubrir además de las 2 semanas base.</p>
            </div>
          </div>

          <div class="pt-4 flex items-center gap-4 border-t border-white/5 mt-4">
            <button 
              type="submit" 
              class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
            >
              Guardar Cambios
            </button>
            <button 
              type="button" 
              class="px-6 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium" 
              @click="onReset"
            >
              Restablecer
            </button>
          </div>
        </form>
      </div>

      <div class="lg:col-span-5 space-y-6">
        
        <article class="relative overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 rounded-2xl p-6 shadow-xl">
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <h3 class="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-1">Sugerencia de Pedido</h3>
          <p class="text-white/50 text-xs mb-6">Basado en consumo de 14 días + {{ form.diasSeguridad }} de seguridad.</p>
          
          <div class="flex items-baseline gap-2">
            <span class="text-5xl font-bold text-white">{{ inv.sugerirSacos }}</span>
            <span class="text-lg text-white/60 font-medium">sacos</span>
          </div>
          
          <div v-if="inv.sugerirSacos > 0" class="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" /></svg>
            Recomendado pedir ahora
          </div>
          <div v-else class="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-xs font-medium">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            Inventario suficiente
          </div>
        </article>

        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white/5 border border-white/10 rounded-xl p-4">
            <p class="text-xs text-white/50 mb-1">Consumo Diario</p>
            <p class="text-xl font-semibold text-white">{{ inv.consumoDiarioKg.toFixed(2) }} <span class="text-sm font-normal text-white/40">kg</span></p>
          </div>
          
          <div class="bg-white/5 border border-white/10 rounded-xl p-4">
            <p class="text-xs text-white/50 mb-1">Inventario Total</p>
            <p class="text-xl font-semibold text-white">{{ inv.totalKg }} <span class="text-sm font-normal text-white/40">kg</span></p>
          </div>
          
          <div class="col-span-2 bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p class="text-xs text-white/50 mb-1">Cobertura Estimada</p>
              <div class="flex items-baseline gap-2">
                <p class="text-2xl font-bold text-white">{{ inv.diasCobertura }}</p>
                <p class="text-sm text-white/40">días restantes</p>
              </div>
            </div>
            <div class="relative w-10 h-10 rounded-full border-4 border-white/10 flex items-center justify-center">
              <div class="w-full h-full rounded-full border-4 border-emerald-500 border-t-transparent absolute top-[-4px] left-[-4px]" style="transform: rotate(45deg);"></div>
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