import { defineStore } from 'pinia';
import { useInventarioStore } from './inventario';

export type AlertaTipo = 'entrega' | 'inventario' | 'pedido' | 'convocatoria' | 'asesor';
export type AlertaSeveridad = 'info' | 'warning' | 'urgent';

export interface AlertaCTA {
  label: string;
  routeName?: string;
  routeParams?: Record<string, any>;
  href?: string;
}

export interface Alerta {
  id: string;
  key?: string;
  titulo: string;
  mensaje: string;
  tipo: AlertaTipo;
  severidad: AlertaSeveridad;
  createdAt: number;
  leida: boolean;
  ctaPrimaria?: AlertaCTA;
  ctaSecundaria?: AlertaCTA;
  meta?: Record<string, any>;
}

type Filtros = {
  categoria: 'todos' | AlertaTipo;
  soloNoLeidas: boolean;
};

type State = {
  items: Alerta[];
  filtros: Filtros;
};

const STORAGE_KEY = 'alertas_agroconecta';

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useAlertasStore = defineStore('alertas', {
  state: (): State => ({
    items: [],
    filtros: { categoria: 'todos', soloNoLeidas: false },
  }),

  getters: {
    ordenadas: (s) => [...s.items].sort((a, b) => b.createdAt - a.createdAt),
    visibles(): Alerta[] {
      const { categoria, soloNoLeidas } = this.filtros;
      return this.ordenadas.filter((a) => {
        if (soloNoLeidas && a.leida) return false;
        if (categoria !== 'todos' && a.tipo !== categoria) return false;
        return true;
      });
    },
    noLeidasCount: (s) => s.items.filter((a) => !a.leida).length,
  },

  actions: {
    persist() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ items: this.items, filtros: this.filtros })
      );
    },
    load() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try {
        const data = JSON.parse(raw);
        this.items = data.items ?? [];
        this.filtros = data.filtros ?? this.filtros;
      } catch {}
    },

    add(alerta: Omit<Alerta, 'id' | 'createdAt' | 'leida'>) {
      const item: Alerta = {
        id: newId(),
        createdAt: Date.now(),
        leida: false,
        ...alerta,
      };
      this.items.unshift(item);
      this.persist();
      return item.id;
    },

    upsertByKey(key: string, alerta: Omit<Alerta, 'id' | 'createdAt' | 'leida' | 'key'>) {
      const idx = this.items.findIndex((a) => a.key === key);
      if (idx === -1) return this.add({ ...alerta, key });
      const prev = this.items[idx];
      this.items[idx] = {
        ...prev,
        ...alerta,
        key,
        leida: prev.leida,
        createdAt: Date.now(),
      };
      this.persist();
      return this.items[idx].id;
    },

    // Eliminar usando splice para reactividad garantizada
    remove(id: string) {
    const idx = this.items.findIndex(a => a.id === id);
    if (idx === -1) return;
    this.items.splice(idx, 1);
    this.persist();
    },

    markRead(id: string, value = true) {
      const it = this.items.find((a) => a.id === id);
      if (!it) return;
      it.leida = value;
      this.persist();
    },
    markAllRead() {
      this.items.forEach((a) => { a.leida = true; });
      this.persist();
    },

    setCategoria(categoria: Filtros['categoria']) {
      this.filtros.categoria = categoria;
      this.persist();
    },
    setSoloNoLeidas(v: boolean) {
      this.filtros.soloNoLeidas = v;
      this.persist();
    },

    seedDemo() {
      if (this.items.length) return;
      this.add({
        titulo: 'Entrega programada',
        mensaje: 'Tu entrega está prevista para mañana 10:00–12:00.',
        tipo: 'entrega',
        severidad: 'info',
        ctaPrimaria: { label: 'Ver ruta', routeName: 'u.alertas' },
      });
    },

    refreshSystemAlerts() {
      const inv = useInventarioStore();

      const key = 'inventario-bajo';
      const dias = inv.diasCobertura;
      const sugeridos = inv.sugerirSacos;

      if (dias > 0 && dias <= 4) {
        this.upsertByKey(key, {
          titulo: 'Inventario bajo',
          mensaje: `Te quedan ${dias} día(s) de alimento. Sugerimos pedir ${sugeridos} saco(s) para cubrir 2 semanas.`,
          tipo: 'inventario',
          severidad: dias <= 2 ? 'urgent' : 'warning',
          ctaPrimaria: { label: 'Pedir ahora', routeName: 'u.pedido.nuevo' },
          ctaSecundaria: { label: 'Mi granja', routeName: 'u.inventario' },
          meta: { diasCobertura: dias, sugeridos },
        });
      } else {
        const idx = this.items.findIndex(a => a.key === key);
        if (idx !== -1) this.remove(this.items[idx].id);
      }
    },
  },
});
