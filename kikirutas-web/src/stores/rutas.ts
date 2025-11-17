// src/stores/rutas.ts
import { defineStore } from 'pinia';
import api from '@/api'; 
import { usePedidosStore } from './pedidos';

export type RutaEstado = 'planificada' | 'en_ruta' | 'finalizada';

export interface Ruta {
  id: string;
  nombre: string;        
  fechaISO: string;      // yyyy-mm-dd
  pedidos: string[];     // ids de pedidos en orden
  estado: RutaEstado;
  inicioISO?: string | null;
  finISO?: string | null;

  choferNombre?: string | null; // nombre del operador (si viene del back)
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

  // Mapeo de estado Laravel → Front
  let estado: RutaEstado = 'planificada';
  if (r.estado === 'en_curso') estado = 'en_ruta';
  if (r.estado === 'cerrada') estado = 'finalizada';

  const choferNombre =
    r.chofer && typeof r.chofer.name === 'string' ? r.chofer.name : null;

  return {
    id: String(r.id),
    nombre: String(r.nombre ?? choferNombre ?? `Ruta ${r.id}`),
    fechaISO: fecha,
    pedidos: Array.isArray(r.pedidos) ? r.pedidos.map((p: any) => String(p.id)) : [],
    estado,
    inicioISO: r.inicio ?? null,
    finISO: r.fin ?? null,
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
      } catch {
        // por si el navegador bloquea localStorage
      }
    },

    async load(opts?: { fecha?: string; estado?: RutaEstado }) {
      const params: Record<string, any> = {};

      if (opts?.fecha) params.fecha = opts.fecha;
      if (opts?.estado) {
        // Mapeo de tu estado del front → estado del back
        params.estado =
          opts.estado === 'en_ruta'
            ? 'en_curso'
            : opts.estado === 'finalizada'
            ? 'cerrada'
            : 'borrador';
      }

      const res = await api.get('/rutas', { params });

      const data = Array.isArray((res.data as any).data)
        ? (res.data as any).data
        : res.data;

      this.items = data.map(mapRutaFromApi);
      this.persist();
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
      const pendientes =
        pedidosStore.pendientes ??
        pedidosStore.items?.filter((p: any) => p.estado === 'pendiente') ??
        [];

      for (const p of pendientes) {
        const cslug = slug(p.solicitanteComunidad || '');
        if (t.comunidades.includes(cslug)) this.assignPedido(id, p.id);
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