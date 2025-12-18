import { defineStore } from 'pinia';
import api from '@/api';

type InventarioState = {
  gallinas: number;                 // total de gallinas
  sacos: number;                    // sacos disponibles
  kgPorSaco: number;                // peso de cada saco (kg)
  consumoGrPorGallinaDia: number;   // consumo promedio por gallina (g/día)
  diasSeguridad: number;            // colchón de seguridad (días)
};

export const STORAGE_KEY = 'inventario_agroconecta';

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
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state));
    },

    load() {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try {
        Object.assign(this, JSON.parse(raw));
      } catch {
        /* noop */
      }
    },

        // Sincronizar con el backend (Mi granja por usuaria)
    async saveToServer() {
      await api.put('/inventario', {
        gallinas: this.gallinas,
        sacos: this.sacos,
        kgPorSaco: this.kgPorSaco,
        consumoGrPorGallinaDia: this.consumoGrPorGallinaDia,
        diasSeguridad: this.diasSeguridad,
      });
    },

    async fetchFromServer() {
      const { data } = await api.get('/inventario');
      this.set({
        gallinas: data.gallinas ?? 0,
        sacos: data.sacos ?? 0,
        kgPorSaco: data.kgPorSaco ?? 40,
        consumoGrPorGallinaDia: data.consumoGrPorGallinaDia ?? 110,
        diasSeguridad: data.diasSeguridad ?? 5,
      });
    },

  },
});
