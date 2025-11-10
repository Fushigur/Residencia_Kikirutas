import { defineStore } from 'pinia';

export type RolUsuario = 'admin' | 'user';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  comunidad?: string;
  rol: RolUsuario;
  activo: boolean;
  createdAt: number; // epoch ms
}

type State = {
  items: Usuario[];
};

const STORAGE_KEY = 'usuarios_kikirutas';

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useUsuariosStore = defineStore('usuarios', {
  state: (): State => ({
    items: [],
  }),

  getters: {
    sorted: (s) =>
      [...s.items].sort((a, b) => {
        // admins arriba, luego por nombre
        if (a.rol !== b.rol) return a.rol === 'admin' ? -1 : 1;
        return a.nombre.localeCompare(b.nombre);
      }),
    byId: (s) => (id: string) => s.items.find((u) => u.id === id),
    existsEmail: (s) => (email: string, ignoreId?: string) =>
      s.items.some(
        (u) =>
          u.email.trim().toLowerCase() === email.trim().toLowerCase() &&
          u.id !== ignoreId
      ),
  },

  actions: {
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    },
    load() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try {
        this.items = JSON.parse(raw) ?? [];
      } catch {}
    },
    seedDefaults() {
      if (this.items.length) return;
      const now = Date.now();
      this.items = [
        {
          id: newId(),
          nombre: 'Admin Principal',
          email: 'admin@kikirutas.local',
          rol: 'admin',
          activo: true,
          createdAt: now - 86400000 * 15,
        },
        {
          id: newId(),
          nombre: 'Maribel Poot',
          email: 'maribel@kikirutas.local',
          telefono: '983-000-1111',
          comunidad: 'Kancabchén',
          rol: 'user',
          activo: true,
          createdAt: now - 86400000 * 10,
        },
        {
          id: newId(),
          nombre: 'Lupita Chan',
          email: 'lupita@kikirutas.local',
          telefono: '983-000-2222',
          comunidad: 'Dziuché',
          rol: 'user',
          activo: true,
          createdAt: now - 86400000 * 7,
        },
      ];
      this.persist();
    },

    create(payload: {
      nombre: string;
      email: string;
      telefono?: string;
      comunidad?: string;
      rol: RolUsuario;
    }) {
      const nombre = payload.nombre?.trim();
      const email = payload.email?.trim();
      if (!nombre) throw new Error('Nombre requerido');
      if (!email) throw new Error('Correo requerido');
      if (this.existsEmail(email)) throw new Error('Ya existe una cuenta con ese correo');

      const u: Usuario = {
        id: newId(),
        nombre,
        email,
        telefono: payload.telefono?.trim() || undefined,
        comunidad: payload.comunidad?.trim() || undefined,
        rol: payload.rol ?? 'user',
        activo: true,
        createdAt: Date.now(),
      };
      this.items.push(u);
      this.persist();
      return u.id;
    },

    update(id: string, changes: Partial<Omit<Usuario, 'id' | 'createdAt'>>) {
      const u = this.items.find((x) => x.id === id);
      if (!u) return false;

      if (changes.email !== undefined) {
        const email = changes.email.trim();
        if (!email) throw new Error('Correo requerido');
        if (this.existsEmail(email, id)) throw new Error('Ya existe una cuenta con ese correo');
        u.email = email;
      }
      if (changes.nombre !== undefined) {
        const nombre = changes.nombre.trim();
        if (!nombre) throw new Error('Nombre requerido');
        u.nombre = nombre;
      }
      if (changes.telefono !== undefined) u.telefono = changes.telefono?.trim() || undefined;
      if (changes.comunidad !== undefined) u.comunidad = changes.comunidad?.trim() || undefined;
      if (changes.rol !== undefined) u.rol = changes.rol;
      if (changes.activo !== undefined) u.activo = !!changes.activo;

      this.persist();
      return true;
    },

    toggleActivo(id: string) {
      const u = this.items.find((x) => x.id === id);
      if (!u) return false;
      u.activo = !u.activo;
      this.persist();
      return true;
    },

    setRol(id: string, rol: RolUsuario) {
      const u = this.items.find((x) => x.id === id);
      if (!u) return false;
      u.rol = rol;
      this.persist();
      return true;
    },

    // "Reset" local simulado: retorna una contraseña temporal
    resetPassword(id: string) {
      const u = this.items.find((x) => x.id === id);
      if (!u) return null;
      const temp = Math.random().toString(36).slice(2, 10);
      // En un backend real, aquí disparas correo con token o actualizas hash.
      return temp;
    },
  },
});
