import { defineStore } from 'pinia';

export interface Producto {
  id: string;
  nombre: string;
  precio: number;     // MXN por saco
  activo: boolean;
}

type State = { items: Producto[] };

const STORAGE_KEY = 'productos_kikirutas';

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useProductosStore = defineStore('productos', {
  state: (): State => ({ items: [] }),

  getters: {
    sorted: (s) => [...s.items].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    activos: (s) => s.items.filter(p => p.activo),
    byId: (s) => (id: string) => s.items.find(p => p.id === id),
    existsByName: (s) => (nombre: string, ignoreId?: string) =>
      s.items.some(p => p.nombre.trim().toLowerCase() === nombre.trim().toLowerCase() && p.id !== ignoreId),
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
        { id: newId(), nombre: 'Alimento iniciador 40kg', precio: 410.00, activo: true },
      ];
      this.persist();
    },

    create(payload: { nombre: string; precio: number; activo?: boolean }) {
      const nombre = payload.nombre.trim();
      const precio = Number(payload.precio);
      if (!nombre) throw new Error('Nombre requerido');
      if (precio <= 0) throw new Error('Precio inválido');
      if (this.existsByName(nombre)) throw new Error('Ya existe un producto con ese nombre');

      const prod: Producto = { id: newId(), nombre, precio, activo: payload.activo ?? true };
      this.items.push(prod);
      this.persist();
      return prod.id;
    },

    update(id: string, changes: Partial<Omit<Producto, 'id'>>) {
      const p = this.items.find(x => x.id === id);
      if (!p) return false;

      if (changes.nombre !== undefined) {
        const nombre = changes.nombre.trim();
        if (!nombre) throw new Error('Nombre requerido');
        if (this.existsByName(nombre, id)) throw new Error('Ya existe un producto con ese nombre');
        p.nombre = nombre;
      }
      if (changes.precio !== undefined) {
        const precio = Number(changes.precio);
        if (precio <= 0) throw new Error('Precio inválido');
        p.precio = precio;
      }
      if (changes.activo !== undefined) p.activo = !!changes.activo;

      this.persist();
      return true;
    },

    remove(id: string) {
      const i = this.items.findIndex(x => x.id === id);
      if (i === -1) return false;
      this.items.splice(i, 1);
      this.persist();
      return true;
    },

    toggleActivo(id: string) {
      const p = this.items.find(x => x.id === id);
      if (!p) return false;
      p.activo = !p.activo;
      this.persist();
      return true;
    },
  },
});
