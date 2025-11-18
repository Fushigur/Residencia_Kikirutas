<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useUsuariosStore, type RolUsuario } from '@/stores/usuarios';

const store = useUsuariosStore();

onMounted(() => {
  store.load();
});


/* -----------------------
   Filtros y búsqueda
------------------------*/
const q = ref('');
const filRol = ref<'todos' | RolUsuario>('todos');

const filEstado = ref<'todos' | 'activos' | 'inactivos'>('todos');

const lista = computed(() => {
  const term = q.value.trim().toLowerCase();
  return store.sorted.filter((u) => {
    if (filRol.value !== 'todos' && u.rol !== filRol.value) return false;
    if (filEstado.value === 'activos' && !u.activo) return false;
    if (filEstado.value === 'inactivos' && u.activo) return false;
    if (!term) return true;
    return (
      u.nombre.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.comunidad?.toLowerCase().includes(term) ?? false) ||
      (u.telefono?.toLowerCase().includes(term) ?? false)
    );
  });
});

/* -----------------------
   Alta de usuario
------------------------*/
const nuevo = ref({
  nombre: '',
  email: '',
  telefono: '',
  comunidad: '',
  rol: 'user' as RolUsuario,
});
const altaMsg = ref('');
const altaErr = ref('');

function crear() {
  altaMsg.value = '';
  altaErr.value = '';
  try {
    store.create(nuevo.value);
    altaMsg.value = 'Cuenta creada';
    nuevo.value = { nombre: '', email: '', telefono: '', comunidad: '', rol: 'user' };
  } catch (e: any) {
    altaErr.value = e?.message ?? 'No se pudo crear';
  }
}

/* -----------------------
   Edición inline
------------------------*/
const editId = ref<string | null>(null);
const form = ref({
  nombre: '',
  email: '',
  telefono: '',
  comunidad: '',
  rol: 'user' as RolUsuario,
});
const editErr = ref('');

function startEdit(id: string) {
  const u = store.byId(id);
  if (!u) return;
  editId.value = id;
  form.value = {
    nombre: u.nombre,
    email: u.email,
    telefono: u.telefono ?? '',
    comunidad: u.comunidad ?? '',
    rol: u.rol,
  };
  editErr.value = '';
}

function cancelEdit() {
  editId.value = null;
  editErr.value = '';
}

function saveEdit() {
  if (!editId.value) return;
  editErr.value = '';
  try {
    store.update(editId.value, { ...form.value });
    editId.value = null;
  } catch (e: any) {
    editErr.value = e?.message ?? 'No se pudo guardar';
  }
}

/* -----------------------
   Acciones
------------------------*/
function toggleActivo(id: string) {
  store.toggleActivo(id);
}

function setRol(id: string, rol: RolUsuario) {
  store.setRol(id, rol);
}

/* const resetMsg = ref('');
function resetPassword(id: string) {
  const temp = store.resetPassword(id);
  if (temp) {
    resetMsg.value = `Contraseña temporal: ${temp}`;
    setTimeout(() => (resetMsg.value = ''), 7000);
  }
}
 */
/* -----------------------
   Helpers
------------------------*/
function fmtFecha(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-semibold">Usuarios</h1>

    <!-- Filtros -->
    <div class="rounded-xl bg-white/5 border border-white/10 p-4">
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex-1 min-w-[220px]">
          <label class="block text-sm mb-1">Buscar</label>
          <input
            v-model="q"
            type="text"
            class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2"
            placeholder="Nombre, correo, comunidad..."
          />
        </div>
        <div>
          <label class="block text-sm mb-1">Rol</label>
          <select v-model="filRol" class="rounded bg-neutral-900 border border-white/10 px-3 py-2">
            <option value="todos">Todos</option>
            <option value="user">Usuarias</option>
            <option value="operador">Operadores</option>
            <option value="admin">Administradores</option>
          </select>

        </div>
        <div>
          <label class="block text-sm mb-1">Estado</label>
          <select v-model="filEstado" class="rounded bg-neutral-900 border border-white/10 px-3 py-2">
            <option value="todos">Todos</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>
        </div>
<!--         <div v-if="resetMsg" class="ml-auto text-sm text-amber-300">
          {{ resetMsg }}
        </div> -->
      </div>
    </div>

    <!-- Alta -->
    <div class="rounded-xl bg-white/5 border border-white/10 p-4">
      <h3 class="font-semibold mb-3">Nueva cuenta</h3>
      <div class="grid md:grid-cols-3 gap-3">
        <div>
          <label class="block text-sm mb-1">Nombre</label>
          <input v-model.trim="nuevo.nombre" type="text" class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm mb-1">Correo</label>
          <input v-model.trim="nuevo.email" type="email" class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm mb-1">Teléfono</label>
          <input v-model.trim="nuevo.telefono" type="text" class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm mb-1">Comunidad</label>
          <input v-model.trim="nuevo.comunidad" type="text" class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm mb-1">Rol</label>
          <select v-model="nuevo.rol" class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2">
            <option value="user">Usuaria</option>
            <option value="operador">Operador</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
      </div>
      <div class="flex items-center gap-3 mt-3">
        <button class="rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-500" @click="crear">Crear</button>
        <span v-if="altaMsg" class="text-sm text-emerald-300">{{ altaMsg }}</span>
        <span v-if="altaErr" class="text-sm text-rose-300">{{ altaErr }}</span>
      </div>
    </div>

    <!-- Tabla -->
    <div class="rounded-xl bg-white/5 border border-white/10 p-4">
      <h3 class="font-semibold mb-3">Listado ({{ lista.length }})</h3>

      <div v-if="lista.length" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-white/60">
              <th class="text-left py-2">Nombre</th>
              <th class="text-left">Correo</th>
              <th class="text-left">Comunidad</th>
              <th class="text-left">Rol</th>
              <th class="text-left">Estado</th>
              <th class="text-left">Alta</th>
              <th class="text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
          <tr
            v-for="u in lista"
            :key="u.id"
            class="border-t border-white/10 hover:bg-white/5 transition-colors"
            :class="editId === u.id ? 'bg-white/5' : ''"
          >
            <!-- Nombre / Teléfono -->
            <td class="py-3 align-middle">
              <template v-if="editId === u.id">
                <div class="flex flex-col gap-1">
                  <input
                    v-model.trim="form.nombre"
                    class="w-full rounded-lg bg-neutral-900 border border-white/15 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <input
                    v-model.trim="form.telefono"
                    class="w-full rounded-lg bg-neutral-900 border border-white/15 px-2 py-1.5 text-xs text-white/80 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Teléfono"
                  />
                </div>
              </template>
              <template v-else>
                <div class="font-medium">{{ u.nombre }}</div>
                <div v-if="u.telefono" class="text-xs text-white/60">{{ u.telefono }}</div>
              </template>
            </td>

            <!-- Email -->
            <td class="py-3 align-middle">
              <template v-if="editId === u.id">
                <input
                  v-model.trim="form.email"
                  type="email"
                  class="w-full rounded-lg bg-neutral-900 border border-white/15 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </template>
              <template v-else>
                <div class="truncate max-w-[220px]">{{ u.email }}</div>
              </template>
            </td>

            <!-- Comunidad -->
            <td class="py-3 align-middle">
              <template v-if="editId === u.id">
                <input
                  v-model.trim="form.comunidad"
                  class="w-full rounded-lg bg-neutral-900 border border-white/15 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </template>
              <template v-else>
                {{ u.comunidad || '—' }}
              </template>
            </td>

            <!-- Rol -->
            <td class="py-3 align-middle">
              <template v-if="editId === u.id">
                <select v-model="form.rol" class="rounded bg-neutral-900 border border-white/10 px-2 py-1">
                  <option value="user">Usuaria</option>
                  <option value="operador">Operador</option>
                  <option value="admin">Administrador</option>
                </select>
              </template>
              <template v-else>
                <span
                  class="px-2 py-1 rounded text-xs font-medium"
                  :class="String(u.rol) === 'admin'
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                    : String(u.rol) === 'operador'
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'"
                >
                  {{
                    String(u.rol) === 'admin'
                      ? 'Admin'
                      : String(u.rol) === 'operador'
                        ? 'Operador'
                        : 'Usuaria'
                  }}
                </span>
              </template>
            </td>

            <!-- Estado -->
            <td class="py-3 align-middle">
              <span
                class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border"
                :class="u.activo
                  ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40'
                  : 'bg-slate-500/15 text-slate-200 border-slate-500/40'"
              >
                {{ u.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>

            <!-- Alta -->
            <td class="py-3 align-middle text-sm text-white/70 whitespace-nowrap">
              {{ fmtFecha(u.createdAt) }}
            </td>
            <!-- Acciones (EN UsersView.vue) -->
            <td class="py-3 align-middle">
              <!-- MODO EDICIÓN -->
              <template v-if="editId === u.id">
                <div class="flex flex-wrap gap-2">
                  <button
                    class="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                    @click="saveEdit"
                  >
                    Guardar
                  </button>
                  <button
                    class="inline-flex items-center rounded-full bg-neutral-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-600"
                    @click="cancelEdit"
                  >
                    Cancelar
                  </button>

                  <span v-if="editErr" class="block w-full text-[11px] text-rose-300 mt-1">
                    {{ editErr }}
                  </span>
                </div>
              </template>

              <!-- MODO NORMAL -->
              <template v-else>
                <div class="flex flex-wrap gap-2">
                  <button
                    class="inline-flex items-center rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
                    @click="startEdit(u.id)"
                  >
                    Editar
                  </button>

                  <button
                    class="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-white"
                    :class="u.activo
                      ? 'bg-red-600 hover:bg-red-500'
                      : 'bg-emerald-600 hover:bg-emerald-500'"
                    @click="toggleActivo(u.id)"
                  >
                    {{ u.activo ? 'Desactivar' : 'Activar' }}
                  </button>

                  <button
                    class="inline-flex items-center rounded-full bg-violet-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-600"
                    @click="setRol(u.id, u.rol === 'admin' ? 'user' : 'admin')"
                  >
                    Hacer {{ u.rol === 'admin' ? 'Usuaria' : 'Admin' }}
                  </button>
                </div>
              </template>
            </td>
          </tr>
        </tbody>
        </table>
      </div>
      <p v-else class="text-white/70 text-sm">No hay usuarios con esos filtros.</p>
    </div>
  </section>
</template>

<style scoped>
td, th {
  font-size: 0.85rem;
}
@media (max-width: 768px) {
  table { font-size: 0.8rem; }
}
</style>

