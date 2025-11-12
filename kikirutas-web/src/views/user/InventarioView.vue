<template>
  <section class="space-y-6">
    <header>
      <h1 class="text-2xl md:text-3xl font-semibold">Mi granja</h1>
      <p class="text-white/70 text-sm mt-1">Actualiza tu inventario y obtén sugerencias de pedido.</p>
    </header>

    <div class="grid md:grid-cols-2 gap-4">
      <!-- Formulario -->
      <form class="card space-y-4" @submit.prevent="onSave">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="lbl">Gallinas</label>
            <input v-model.number="form.gallinas" type="number" min="0" class="inp" required />
          </div>

          <div>
            <label class="lbl">Sacos disponibles</label>
            <input v-model.number="form.sacos" type="number" min="0" class="inp" required />
          </div>

          <div>
            <label class="lbl">Kg por saco</label>
            <input v-model.number="form.kgPorSaco" type="number" min="1" class="inp" />
          </div>

          <div>
            <label class="lbl">Consumo por gallina (g/día)</label>
            <input v-model.number="form.consumoGrPorGallinaDia" type="number" min="1" class="inp" />
          </div>

          <div>
            <label class="lbl">Días de seguridad</label>
            <input v-model.number="form.diasSeguridad" type="number" min="0" class="inp" />
          </div>
        </div>

        <div class="flex gap-2">
          <button type="submit" class="btn-primary">Guardar</button>
          <button type="button" class="btn-secondary" @click="onReset">Restablecer</button>
        </div>
      </form>

      <!-- Resumen -->
      <div class="card space-y-3">
        <h3 class="card-title">Resumen</h3>
        <div class="grid grid-cols-2 gap-3 mt-2">
          <div class="stat">
            <p class="stat-label">Consumo diario</p>
            <p class="stat-value">{{ inv.consumoDiarioKg.toFixed(2) }} kg</p>
          </div>
          <div class="stat">
            <p class="stat-label">Inventario</p>
            <p class="stat-value">{{ inv.totalKg }} kg ({{ inv.sacos }} sacos)</p>
          </div>
          <div class="stat">
            <p class="stat-label">Cobertura estimada</p>
            <p class="stat-value">{{ inv.diasCobertura }} días</p>
          </div>
          <div class="stat">
            <p class="stat-label">Sugerencia de pedido</p>
            <p class="stat-value">{{ inv.sugerirSacos }} sacos</p>
          </div>
        </div>

        <p class="muted">
          La sugerencia busca cubrir 14 días + {{ inv.diasSeguridad }} de seguridad.
          Puedes ajustar los valores en el formulario.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useInventarioStore } from '@/stores/inventario';

const inv = useInventarioStore();
inv.load();

const form = reactive({
  gallinas: inv.gallinas,
  sacos: inv.sacos,
  kgPorSaco: inv.kgPorSaco,
  consumoGrPorGallinaDia: inv.consumoGrPorGallinaDia,
  diasSeguridad: inv.diasSeguridad,
});

function onSave() {
  inv.set(form);
  // await inv.saveToServer()  // si conectas con tu API
}

function onReset() {
  form.gallinas = 0;
  form.sacos = 0;
  form.kgPorSaco = 40;
  form.consumoGrPorGallinaDia = 110;
  form.diasSeguridad = 5;
}
</script>

<style scoped>
.card{
  background: rgba(255,255,255,.03);
  border:1px solid rgba(255,255,255,.08);
  border-radius:1rem; padding:1rem;
}
.card-title{ font-weight:600; }
.lbl{ display:block; font-size:.85rem; color:#cbd5ce; margin-bottom:.35rem; }
.inp{
  width:100%; background:#0f1010; color:#e5f3ee; border:1px solid #2b2f2d;
  border-radius:.7rem; padding:.6rem .8rem;
}
.inp:focus{ outline: none; border-color: rgba(34,167,136,.6); }

.btn-primary{
  background:#22A788; color:#0c2b25; font-weight:700;
  padding:.65rem 1rem; border-radius:.8rem;
}
.btn-secondary{
  background: rgba(34,167,136,.15); color:#d6e6df;
  padding:.65rem 1rem; border-radius:.8rem; border:1px solid rgba(34,167,136,.35);
}
.stat{ background:#0f1010; border:1px solid rgba(255,255,255,.06); border-radius:.7rem; padding:.75rem; }
.stat-label{ font-size:.8rem; color:#b7c4bf; }
.stat-value{ font-weight:700; margin-top:.25rem; }
.muted{ color: rgba(255,255,255,.7); font-size:.95rem; }
</style>
