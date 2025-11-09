import { defineStore } from 'pinia';

export interface Producto {
  id: string;
  nombre: string;          // Ej: "Alimento ponedoras 40kg"
  precio: number;          // Precio por saco
  activo: boolean;         // Mostrar a las usuarias
}

type State = { items: Producto[] };

const STORAGE_KEY = 'productos_kikirutas';

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useProductosStore = defineStore('productos', {
  state: (): State => ({ items: [] }),

  getters: {
    activos: (s) => s.items.filter(p => p.activo),
    byId: (s) => (id: string) => s.items.find(p => p.id === id),
  },

  actions: {
    persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items)); },
    load() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try { this.items = JSON.parse(raw) ?? []; } catch {}
    },
    seedDefaults() {
      if (this.items.length) return;
      this.items = [
        { id: newId(), nombre: 'Alimento ponedoras 40kg', precio: 380.00, activo: true },
        { id: newId(), nombre: 'Alimento iniciador 40kg', precio: 395.00, activo: true },
      ];
      this.persist();
    },

    add(payload: Omit<Producto, 'id'>) {
      const p: Producto = { id: newId(), ...payload };
      this.items.unshift(p);
      this.persist();
      return p.id;
    },
    update(id: string, partial: Partial<Producto>) {
      const p = this.items.find(i => i.id === id);
      if (!p) return;
      Object.assign(p, partial);
      this.persist();
    },
    remove(id: string) {
      const idx = this.items.findIndex(i => i.id === id);
      if (idx === -1) return;
      this.items.splice(idx, 1);
      this.persist();
    },
    toggleActivo(id: string) {
      const p = this.items.find(i => i.id === id);
      if (!p) return;
      p.activo = !p.activo;
      this.persist();
    },
  },
});
