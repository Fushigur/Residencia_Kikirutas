import { defineStore } from 'pinia';
import { useInventarioStore } from './inventario';
import api from '@/api';

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
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ filtros: this.filtros })
      );
    },

    async load() {
      // 1. Cargar filtros guardados
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const data = JSON.parse(raw);
          this.filtros = data.filtros ?? this.filtros;
        } catch { }
      }

      // 2. Cargar notificaciones del backend
      try {
        const { data } = await api.get('/notifications');
        // Backend devuelve array de objetos con estructura compatible
        // Aseguramos que se mezclen o reemplacen
        this.items = data;
      } catch (e) {
        console.error('Error cargando notificaciones:', e);
      }

      // 3. Refrescar alertas locales del sistema (inventario, etc)
      this.refreshSystemAlerts();
    },

    // Añadir alerta local (sin guardar en backend)
    addLocal(alerta: Omit<Alerta, 'id' | 'createdAt' | 'leida'>) {
      const item: Alerta = {
        id: newId(),
        createdAt: Date.now(),
        leida: false,
        ...alerta,
      };
      this.items.unshift(item);
      return item.id;
    },

    upsertByKey(key: string, alerta: Omit<Alerta, 'id' | 'createdAt' | 'leida' | 'key'>) {
      const idx = this.items.findIndex((a) => a.key === key);
      if (idx === -1) return this.addLocal({ ...alerta, key });

      // Si existe, actualizamos
      const prev = this.items[idx];
      this.items[idx] = {
        ...prev,
        ...alerta,
        key,
        leida: prev.leida,
        createdAt: Date.now(),
      };
      return this.items[idx].id;
    },

    async remove(id: string, { force = false }: { force?: boolean } = {}) {
      const idx = this.items.findIndex(a => a.id === id);
      if (idx === -1) return false;

      const item = this.items[idx];
      if (!force && !item.leida) {
        return false;
      }

      // Si es una alerta local (tiene key o ID generado por nosotros que no es UUID v4 estricto... 
      // pero Laravel usa UUID. Asumiremos que si tiene 'key' es local, o si falla la API es local)
      if (item.key) {
        this.items.splice(idx, 1);
        return true;
      }

      // Backend
      try {
        await api.delete(`/notifications/${id}`);
        this.items.splice(idx, 1);
        return true;
      } catch (e) {
        console.error('Error eliminando notificación:', e);
        return false;
      }
    },

    async markRead(id: string, value = true) {
      const idx = this.items.findIndex((a) => a.id === id);
      if (idx === -1) return;

      const item = this.items[idx];
      item.leida = value; // Optimistic update

      if (item.key) return; // Local, no call API

      try {
        await api.put(`/notifications/${id}/read`);
      } catch (e) {
        console.error('Error marcando lectura:', e);
        // revertir si falla?
      }
    },

    async markAllRead() {
      this.items.forEach((a) => { a.leida = true; }); // Optimistic
      try {
        await api.put('/notifications/read-all');
      } catch (e) {
        console.error('Error marcando todo leído:', e);
      }
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
      // Deprecated in favor of real backend data
    },

    refreshSystemAlerts() {
      const inv = useInventarioStore();
      const key = 'inventario-bajo';
      const dias = inv.diasCobertura;
      const sugeridos = inv.sugerirSacos;

      if (dias > 0 && dias <= 4) {
        this.upsertByKey(key, {
          titulo: 'Inventario bajo',
          mensaje: `Te quedan ${dias} día(s) de alimento. Sugerimos pedir ${sugeridos} saco(s).`,
          tipo: 'inventario',
          severidad: dias <= 2 ? 'urgent' : 'warning',
          ctaPrimaria: { label: 'Pedir ahora', routeName: 'u.pedido.nuevo' },
          ctaSecundaria: { label: 'Mi granja', routeName: 'u.inventario' },
          meta: { diasCobertura: dias, sugeridos },
        });
      } else {
        const idx = this.items.findIndex(a => a.key === key);
        if (idx !== -1) {
          // Es local, hacemos splice directo
          this.items.splice(idx, 1);
        }
      }
    },
  },
});
