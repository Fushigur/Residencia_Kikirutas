import { defineStore } from 'pinia';
import { useRutasStore } from '@/stores/rutas';

export interface RouteTemplate {
  id: string;
  nombre: string;               // cómo se muestra en el select
  base: 'morelos' | 'carrillo';
  comunidades: string[];        // orden sugerido (opcional por ahora)
}

export const useRouteTemplatesStore = defineStore('routeTemplates', {
  state: () => ({
    items: [] as RouteTemplate[],
  }),
  actions: {
    seedDefaults() {
      if (this.items.length) return;
      this.items = [
        {
            id: 'morelos-base',
            nombre: 'Base José María Morelos',
            base: 'morelos',
            comunidades: [
            'José María Morelos',
            'La Presumida',
            'Santa Gertrudis',
            'Candelaria',
            'Dziuché',
            'Kancabchén',
            'Cafetalito',
            'Cafetal Grande',
            'Benito Juárez',
            'Pozo Pirata',
            'San Carlos',
            'Chunhuhub',
            'Polyuc',
            'Dos Aguadas',
            'El Naranjal',
            'Othón P. Blanco',
            'Puerto Arturo'
            ],
        },
        {
            id: 'carrillo-base',
            nombre: 'Base Felipe Carrillo Puerto',
            base: 'carrillo',
            comunidades: [
            'Felipe Carrillo Puerto',
            'X-Hazil',
            'Chumpón',
            'Uh May',
            'Dzula',
            'X-Yatil',
            'El Señor',
            'Tihosuco'
            ],
        },
        ];
    },

    createRouteFromTemplate(opts: { templateId: string; operador: string; fechaISO: string }) {
      const rutas = useRutasStore();
      const tpl = this.items.find(t => t.id === opts.templateId);
      if (!tpl) return null;

      // por ahora usamos "nombre" para guardar el operador (sin romper tu store actual)
      const rutaId = rutas.create({
        nombre: (opts.operador || 'Operador').trim(),
        fechaISO: opts.fechaISO,
      });

      // si luego quieres guardar el itinerario: añade un campo opcional "stops" en tu store de rutas

      return rutaId;
    },
  },
});
