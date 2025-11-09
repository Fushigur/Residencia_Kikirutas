import { defineStore } from 'pinia';

type InventarioState = {
  gallinas: number;                 // total de gallinas
  sacos: number;                    // sacos disponibles
  kgPorSaco: number;                // peso de cada saco (kg)
  consumoGrPorGallinaDia: number;   // consumo promedio por gallina (g/día)
  diasSeguridad: number;            // colchón de seguridad (días)
};

const STORAGE_KEY = 'inventario_agroconecta';

export const useInventarioStore = defineStore('inventario', {
  state: (): InventarioState => ({
    gallinas: 0,
    sacos: 0,
    kgPorSaco: 40,
    consumoGrPorGallinaDia: 110,
    diasSeguridad: 5,
  }),

  getters: {
    // kg totales disponibles
    totalKg: (s) => s.sacos * s.kgPorSaco,

    // consumo diario en kg
    consumoDiarioKg: (s) => (s.gallinas * s.consumoGrPorGallinaDia) / 1000,

    // días de cobertura con el inventario actual
    // (usa otros getters, por eso va como método con "this")
    diasCobertura(): number {
      const c = this.consumoDiarioKg;
      return c > 0 ? Math.floor(this.totalKg / c) : 0;
    },

    // sugerencia para cubrir 14 días + seguridad
    // (usa otros getters y estado, por eso va como método con "this")
    sugerirSacos(): number {
      const horizonteDias = 14;
      const objetivoDias = horizonteDias + this.diasSeguridad;
      const requeridoKg = Math.max(0, objetivoDias * this.consumoDiarioKg - this.totalKg);
      return Math.ceil(requeridoKg / this.kgPorSaco);
    },
  },

  actions: {
    set(partial: Partial<InventarioState>) {
      Object.assign(this, partial);
      this.persist();
    },

    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state));
    },

    load() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try {
        Object.assign(this, JSON.parse(raw));
      } catch {
        /* noop */
      }
    },

    // Puntos de extensión para API real:
    // async saveToServer() { await api.post('/inventario', this.$state); }
    // async fetchFromServer() { const { data } = await api.get('/inventario'); this.set(data); }
  },
});
