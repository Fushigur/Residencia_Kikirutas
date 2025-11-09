import { defineStore } from 'pinia';

export type PerfilState = {
  avatar: string | null;     // DataURL o URL
  nombre: string;
  telefono: string;          // 10 dígitos MX p.ej.
  email: string;
  comunidad: string;         // solo lectura en perfil
  municipio: string;         // solo lectura en perfil
  asesorNombre: string;
  asesorTelefono: string;
};

const STORAGE_KEY = 'perfil_agroconecta';

export const usePerfilStore = defineStore('perfil', {
  state: (): PerfilState => ({
    avatar: null,
    nombre: '',
    telefono: '',
    email: '',
    comunidad: '',
    municipio: '',
    asesorNombre: '',
    asesorTelefono: '',
  }),

  actions: {
    set(partial: Partial<PerfilState>) {
      Object.assign(this, partial);
      this.persist();
    },
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state));
    },
    load() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try { Object.assign(this, JSON.parse(raw)); } catch {}
    },
    clear() {
      localStorage.removeItem(STORAGE_KEY);
    },
  },
});
