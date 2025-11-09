import { defineStore } from 'pinia';
import { usePedidosStore } from './pedidos';

export type RutaEstado = 'planificada' | 'en_ruta' | 'finalizada';

export interface Ruta {
  id: string;
  nombre: string;     // Operador / nombre de ruta
  fechaISO: string;   // yyyy-mm-dd
  pedidos: string[];  // ids de pedidos
  estado: RutaEstado;
}

type State = { items: Ruta[] };

const STORAGE_KEY = 'rutas_kikirutas';

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export const useRutasStore = defineStore('rutas', {
  state: (): State => ({ items: [] }),

  getters: {
    ordenadas: (s) => [...s.items].sort((a, b) => b.fechaISO.localeCompare(a.fechaISO)),
    byId: (s) => (id: string) => s.items.find(r => r.id === id),
  },

  actions: {
    persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items)); },
    load() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try { this.items = JSON.parse(raw) ?? []; } catch {}
    },

    create(payload?: { nombre?: string; fechaISO?: string }) {
      const ruta: Ruta = {
        id: newId(),
        nombre: (payload?.nombre || 'Ruta sin nombre').trim(),
        fechaISO: payload?.fechaISO || todayISO(),
        pedidos: [],
        estado: 'planificada',
      };
      this.items.unshift(ruta);
      this.persist();
      return ruta.id;
    },

    setEstado(id: string, estado: RutaEstado) {
      const r = this.items.find(i => i.id === id);
      if (!r) return;
      r.estado = estado;
      this.persist();
    },

    assignPedido(rutaId: string, pedidoId: string) {
      const r = this.items.find(i => i.id === rutaId);
      if (!r) return false;

      const pedidos = usePedidosStore();
      const ok = pedidos.assignToRoute(rutaId, pedidoId);
      if (!ok) return false;

      if (!r.pedidos.includes(pedidoId)) r.pedidos.push(pedidoId);
      if (r.estado === 'planificada') r.estado = 'en_ruta'; // opcional: pasa a "en_ruta"
      this.persist();
      return true;
    },

    removePedido(rutaId: string, pedidoId: string) {
      const r = this.items.find(i => i.id === rutaId);
      if (!r) return false;

      const pedidos = usePedidosStore();
      const ok = pedidos.removeFromRoute(pedidoId);
      if (!ok) return false;

      r.pedidos = r.pedidos.filter(id => id !== pedidoId);
      this.persist();
      return true;
    },
  },
});
