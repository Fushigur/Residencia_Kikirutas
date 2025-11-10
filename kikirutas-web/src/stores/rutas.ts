// src/stores/rutas.ts
import { defineStore } from 'pinia';
import { usePedidosStore } from './pedidos';

export type RutaEstado = 'planificada' | 'en_ruta' | 'finalizada';

export interface Ruta {
  id: string;
  nombre: string;        // Operador / nombre de ruta
  fechaISO: string;      // yyyy-mm-dd
  pedidos: string[];     // ids de pedidos en orden
  estado: RutaEstado;
  inicioISO?: string | null;
  finISO?: string | null;

  templateId?: string | null;
}

type State = { items: Ruta[] };

const STORAGE_KEY = 'rutas_kikirutas';

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
const slug = (s: string) => s.toLowerCase().trim().replace(/\s+/g, '-');

// -------- Plantillas (residencia) --------
export type RutaTemplate = {
  id: string;
  nombre: string;         // Ej. "JMM - Norte"
  comunidades: string[];  // slugs de comunidades en orden
};

export const templates: RutaTemplate[] = [
  // Ajusta estas plantillas a tus comunidades reales
  { id: 'jmm-norte',   nombre: 'José María Morelos',   comunidades: [
  'dziuche',
  'kancabchen',
  'cafetalito',
  'cafetal-grande',
  'benito-juarez',
  'pozo-pirata',
  'san-carlos',
  'chunhuhub',
  'polyuc',
  'dos-aguadas',
  'el-naranjal',
  'othon-p-blanco',
  'puerto-arturo'
]
 },
  { id: 'fc-poniente', nombre: 'Felipe Carrillo Puerto', comunidades: [
  'dzula',
  'x-yatil',
  'el-senor',
  'tihosuco'
]
 },
];

export const useRutasStore = defineStore('rutas', {
  state: (): State => ({ items: [] }),

  getters: {
    ordenadas: (s) => [...s.items].sort((a, b) => b.fechaISO.localeCompare(a.fechaISO)),
    byId:      (s) => (id: string) => s.items.find(r => r.id === id),
  },

  actions: {
    persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items)); },
    load() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try { this.items = JSON.parse(raw) ?? []; } catch {}
    },

    create(payload?: { nombre?: string; fechaISO?: string; templateId?: string | null }) {
      const ruta: Ruta = {
        id: newId(),
        nombre: (payload?.nombre || 'Ruta sin nombre').trim(),
        fechaISO: payload?.fechaISO || todayISO(),
        pedidos: [],
        estado: 'planificada',
        inicioISO: null,
        finISO: null,
        templateId: payload?.templateId ?? null,
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

    remove(id: string) {
      const idx = this.items.findIndex(r => r.id === id);
      if (idx === -1) return false;
      if (this.items[idx].pedidos.length) return false;
      this.items.splice(idx, 1);
      this.persist();
      return true;
    },

    removeAndUnassign(id: string) {
      const r = this.items.find(x => x.id === id);
      if (!r) return false;
      const pedidos = usePedidosStore();
      for (const pid of r.pedidos) pedidos.removeFromRoute(pid);
      this.items = this.items.filter(x => x.id !== id);
      this.persist();
      return true;
    },

    startRun(id: string) {
      const r = this.byId(id);
      if (!r) return false;
      r.estado = 'en_ruta';
      r.inicioISO = new Date().toISOString();
      this.persist();
      return true;
    },

    finishRun(id: string) {
      const r = this.byId(id);
      if (!r) return false;
      r.estado = 'finalizada';
      r.finISO = new Date().toISOString();
      this.persist();
      return true;
    },

    createFromTemplate(tid: string, operador: string, fechaISO: string) {
      const t = templates.find(x => x.id === tid);
      if (!t) return null;

      const id = this.create({ nombre: operador || 'Operador', fechaISO, templateId: tid });

      const pedidosStore = usePedidosStore();
      const pendientes = pedidosStore.pendientes ?? pedidosStore.items?.filter((p: any) => p.estado === 'pendiente') ?? [];

      for (const p of pendientes) {
        const cslug = slug(p.solicitanteComunidad || '');
        if (t.comunidades.includes(cslug)) this.assignPedido(id, p.id);
      }
      return id;
    },
  },
});
