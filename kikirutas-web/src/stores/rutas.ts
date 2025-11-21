// src/stores/rutas.ts
import { defineStore } from 'pinia';
import api from '@/api'; 
import { usePedidosStore } from './pedidos';

export type RutaEstado = 'planificada' | 'en_ruta' | 'finalizada';

export interface Ruta {
  id: string;
  nombre: string;        
  fechaISO: string;
  pedidos: string[];
  estado: RutaEstado;
  inicioISO?: string | null;
  finISO?: string | null;
  // NUEVO: id del operador
  choferId?: number | null;
  choferNombre?: string | null;
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

// Función para formatear fecha ISO a "día mes año"
function formatearFecha(fechaISO: string): string {
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  
  const [año, mes, dia] = fechaISO.split('-');
  const mesTexto = meses[parseInt(mes) - 1];
  
  return `${parseInt(dia)} ${mesTexto} ${año}`;
}

function mapRutaFromApi(r: any): Ruta {
  const fecha = (r.fecha ?? new Date().toISOString()).slice(0, 10);

  let estado: RutaEstado = 'planificada';
  if (r.estado === 'en_curso') estado = 'en_ruta';
  if (r.estado === 'cerrada') estado = 'finalizada';

  const choferNombre =
    r.chofer && typeof r.chofer.name === 'string' ? r.chofer.name : null;

  const choferId =
    typeof r.chofer_id !== 'undefined' && r.chofer_id !== null
      ? Number(r.chofer_id)
      : r.chofer && r.chofer.id
      ? Number(r.chofer.id)
      : null;

  return {
    id: String(r.id),
    nombre: String(r.nombre ?? choferNombre ?? `Ruta ${r.id}`),
    fechaISO: fecha,
    pedidos: Array.isArray(r.pedidos)
      ? r.pedidos.map((p: any) => String(p.id))
      : [],
    estado,
    inicioISO: r.inicio ?? null,
    finISO: r.fin ?? null,
    choferId,
    choferNombre,
    templateId: null,
  };
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
    
    // Getter que retorna rutas con fecha formateada
    rutasConFechaFormateada: (s) => {
      return s.items.map(ruta => ({
        ...ruta,
        fechaFormateada: formatearFecha(ruta.fechaISO)
      }));
    },
  },

  actions: {
    persist() {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
      } catch {
        // por si el navegador bloquea sessionStorage
      }
    },

    async load(opts?: { fecha?: string; desde?: string; hasta?: string; estado?: RutaEstado }) {
      const params: Record<string, any> = {}

      if (opts?.fecha) params.fecha = opts.fecha
      if (opts?.desde) params.desde = opts.desde
      if (opts?.hasta) params.hasta = opts.hasta

      if (opts?.estado) {
        // Mapeo de tu estado del front → estado del back
        params.estado =
          opts.estado === 'en_ruta'
            ? 'en_curso'
            : opts.estado === 'finalizada'
            ? 'cerrada'
            : 'borrador'
      }

      const res = await api.get('/rutas', { params })

      const data = Array.isArray((res.data as any).data)
        ? (res.data as any).data
        : res.data

      this.items = data.map(mapRutaFromApi)
      this.persist()
    },


    async create(payload?: {
      nombre?: string;
      fechaISO?: string;
      templateId?: string | null;
      choferId?: number | null;
    }) {
      const body: Record<string, any> = {
        fecha: payload?.fechaISO || todayISO(),
        estado: 'borrador',
        nombre: (payload?.nombre || 'Ruta sin nombre').trim() || null,
      };

      if (payload?.choferId) {
        body.chofer_id = payload.choferId;
      }

      const res = await api.post('/rutas', body);
      const ruta = mapRutaFromApi(res.data);

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

    async assignPedido(rutaId: string, pedidoId: string) {
      const r = this.items.find((i) => i.id === rutaId);
      if (!r) return false;

      // 1) Backend: crea el vínculo ruta <-> pedido
      try {
        await api.post(`/rutas/${rutaId}/pedidos/${pedidoId}`);
      } catch (error) {
        console.error('No se pudo asignar el pedido a la ruta en el backend', error);
        return false;
      }

      // 2) Store de pedidos (para que el pedido “sepa” su ruta)
      const pedidos = usePedidosStore();
      const ok = pedidos.assignToRoute(rutaId, pedidoId);
      if (!ok) return false;

      // 3) Actualizar la lista de ids de pedidos en la ruta
      if (!r.pedidos.includes(pedidoId)) r.pedidos.push(pedidoId);
      this.persist();
      return true;
    },


    async removePedido(rutaId: string, pedidoId: string) {
      const r = this.items.find((i) => i.id === rutaId);
      if (!r) return false;

      // 1) Backend: eliminar vínculo en pivote pedido_ruta
      try {
        await api.delete(`/rutas/${rutaId}/pedidos/${pedidoId}`);
      } catch (error) {
        console.error('No se pudo desasignar el pedido de la ruta en el backend', error);
        return false;
      }

      // 2) Store de pedidos
      const pedidos = usePedidosStore();
      const ok = pedidos.removeFromRoute(pedidoId);
      if (!ok) return false;

      // 3) Quitar del arreglo local
      r.pedidos = r.pedidos.filter((id) => id !== pedidoId);
      this.persist();
      return true;
    },

    async remove(id: string) {
      const idx = this.items.findIndex((r) => r.id === id);
      if (idx === -1) return false;

      // Si tiene pedidos, usamos removeAndUnassign mejor
      if (this.items[idx].pedidos.length) return false;

      // 1) Eliminar la ruta en el backend
      try {
        await api.delete(`/rutas/${id}`);
      } catch (error) {
        console.error('No se pudo eliminar la ruta en el backend', error);
        return false;
      }

      // 2) Eliminarla del store
      this.items.splice(idx, 1);
      this.persist();
      return true;
    },

    async removeAndUnassign(id: string) {
      const r = this.items.find((x) => x.id === id);
      if (!r) return false;

      const pedidos = usePedidosStore();

      // 1) Desasignar cada pedido en backend y frontend
      for (const pid of r.pedidos) {
        try {
          await api.delete(`/rutas/${id}/pedidos/${pid}`);
          pedidos.removeFromRoute(pid);
          // opcional: regresar el pedido a pendiente
          pedidos.setEstado(pid, 'pendiente');
        } catch (error) {
          console.error(`No se pudo desasignar el pedido ${pid} de la ruta ${id}`, error);
        }
      }

      // 2) Eliminar la ruta en el backend
      try {
        await api.delete(`/rutas/${id}`);
      } catch (error) {
        console.error('No se pudo eliminar la ruta en el backend', error);
        return false;
      }

      // 3) Eliminarla del store
      this.items = this.items.filter((x) => x.id !== id);
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

    async createFromTemplate(
      tid: string,
      operador: string,
      fechaISO: string,
      choferId?: number | null,
    ) {
      const t = templates.find((x) => x.id === tid);
      if (!t) return null;

      const id = await this.create({
        nombre: operador || 'Operador',
        fechaISO,
        templateId: tid,
        choferId: choferId ?? null,
      });

      if (!id) return null;

      const pedidosStore = usePedidosStore();
      const pendientes =
        pedidosStore.pendientes ??
        pedidosStore.items?.filter((p: any) => p.estado === 'pendiente') ??
        [];

      for (const p of pendientes) {
        const cslug = slug(p.solicitanteComunidad || '');
        if (t.comunidades.includes(cslug)) {
          await this.assignPedido(id, p.id);
        }
      }

      return id;
    },

    
    // Función helper para formatear fechas (también disponible como action)
    formatearFecha(fechaISO: string): string {
      return formatearFecha(fechaISO);
    },
  },
});

// Exportar la función para uso fuera del store si es necesario
export { formatearFecha };