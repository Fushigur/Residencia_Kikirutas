<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useUsuariosStore, type RolUsuario, type Usuario } from '@/stores/usuarios';
import { useProductosStore } from '@/stores/productos';
import api from '@/api';

const store = useUsuariosStore();
const productos = useProductosStore();

onMounted(() => {
  store.load();
  productos.load();
});


/* -----------------------
   Modal Crear Pedido
------------------------*/
const showModalPedido = ref(false)
const usuarioPedido = ref<Usuario | null>(null)
const formPedido = ref({
  producto: '',
  cantidad: 1,
  notas: ''
})
const pedidoMsg = ref('')
const pedidoErr = ref('')
const isSavingPedido = ref(false)

function abrirModalPedido(u: Usuario) {
  usuarioPedido.value = u
  formPedido.value = { producto: '', cantidad: 1, notas: '' }
  pedidoMsg.value = ''
  pedidoErr.value = ''
  showModalPedido.value = true
}

async function guardarPedido() {
  if (!formPedido.value.producto) {
    pedidoErr.value = 'Selecciona un producto'
    return
  }
  if (formPedido.value.cantidad < 1) {
    pedidoErr.value = 'Cantidad inválida'
    return
  }

  isSavingPedido.value = true
  pedidoMsg.value = ''
  pedidoErr.value = ''

  try {
    const body = {
      producto: formPedido.value.producto,
      cantidad: formPedido.value.cantidad,
      fecha: new Date().toISOString().slice(0, 10),
      solicitante_nombre: usuarioPedido.value?.nombre,
      solicitante_comunidad: usuarioPedido.value?.comunidad,
      solicitante_municipio: usuarioPedido.value?.municipio,
      telefono: usuarioPedido.value?.telefono,
      notas: formPedido.value.notas
    }

    await api.post('/pedidos', body)

    pedidoMsg.value = 'Pedido creado exitosamente'
    setTimeout(() => {
      showModalPedido.value = false
    }, 1500)
  } catch (e: any) {
    console.error(e)
    pedidoErr.value = 'Error al crear pedido'
  } finally {
    isSavingPedido.value = false
  }
}


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

// Modal de eliminación
const showDeleteModal = ref(false);
const userToDelete = ref<string | null>(null);

const deleteErr = ref('');

function eliminar(id: string) {
  userToDelete.value = id;
  deleteErr.value = '';
  showDeleteModal.value = true;
}

async function confirmDelete() {
  if (!userToDelete.value) return;
  deleteErr.value = '';

  try {
    await store.remove(userToDelete.value);
    userToDelete.value = null;
    showDeleteModal.value = false;
  } catch (e: any) {
    deleteErr.value = e.response?.data?.message || 'No se pudo eliminar el usuario.';
  }
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
  <section class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Usuarios</h1>

    <!-- Filtros -->
    <div class="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
      <div class="flex flex-wrap items-end gap-4">
        <div class="flex-1 min-w-[220px]">
          <label class="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Buscar</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input v-model="q" type="text"
              class="w-full rounded-xl border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all"
              placeholder="Nombre, correo, comunidad..." />
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Rol</label>
          <select v-model="filRol"
            class="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all">
            <option value="todos">Todos</option>
            <option value="user">Usuarias</option>
            <option value="operador">Operadores</option>
            <option value="admin">Administradores</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Estado</label>
          <select v-model="filEstado"
            class="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all">
            <option value="todos">Todos</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Alta -->
    <div class="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
      <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nueva cuenta
      </h3>
      <div class="grid md:grid-cols-5 gap-4">
        <label class="block">
          <span class="text-xs font-bold text-gray-500 uppercase">Nombre</span>
          <input v-model.trim="nuevo.nombre" type="text"
            class="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5" />
        </label>
        <label class="block">
          <span class="text-xs font-bold text-gray-500 uppercase">Correo</span>
          <input v-model.trim="nuevo.email" type="email"
            class="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5" />
        </label>
        <label class="block">
          <span class="text-xs font-bold text-gray-500 uppercase">Teléfono</span>
          <input v-model.trim="nuevo.telefono" type="text"
            class="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5" />
        </label>
        <label class="block">
          <span class="text-xs font-bold text-gray-500 uppercase">Comunidad</span>
          <input v-model.trim="nuevo.comunidad" type="text"
            class="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5" />
        </label>
        <label class="block">
          <span class="text-xs font-bold text-gray-500 uppercase">Rol</span>
          <select v-model="nuevo.rol"
            class="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5">
            <option value="user">Usuaria</option>
            <option value="operador">Operador</option>
            <option value="admin">Administrador</option>
          </select>
        </label>
      </div>
      <div class="flex items-center gap-3 mt-4">
        <button
          class="rounded-xl bg-brand font-bold text-white px-5 py-2 hover:bg-red-800 shadow-md shadow-brand/20 transition-all"
          @click="crear">Crear Miembra</button>
        <span v-if="altaMsg" class="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{{ altaMsg
        }}</span>
        <span v-if="altaErr" class="text-sm font-medium text-red-600 bg-red-50 px-2 py-1 rounded">{{ altaErr }}</span>
      </div>
    </div>

    <!-- Tabla -->
    <div class="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div class="p-5 border-b border-gray-100">
        <h3 class="font-bold text-gray-900">Listado ({{ lista.length }})</h3>
      </div>
      <div v-if="lista.length" class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
            <tr>
              <th class="py-3 px-4">Nombre / Tel</th>
              <th class="px-4">Correo</th>
              <th class="px-4">Comunidad</th>
              <th class="px-4">Rol</th>
              <th class="px-4">Estado</th>
              <th class="px-4">Alta</th>
              <th class="px-4">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="u in lista" :key="u.id" class="hover:bg-gray-50 transition-colors"
              :class="editId === u.id ? 'bg-amber-50/50' : ''">
              <!-- Nombre / Teléfono -->
              <td class="py-3 px-4 align-middle">
                <template v-if="editId === u.id">
                  <div class="flex flex-col gap-1.5">
                    <input v-model.trim="form.nombre"
                      class="w-full rounded bg-white border border-gray-200 px-2 py-1 text-sm focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none" />
                    <input v-model.trim="form.telefono"
                      class="w-full rounded bg-white border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none"
                      placeholder="Teléfono" />
                  </div>
                </template>
                <template v-else>
                  <div class="font-bold text-gray-900">{{ u.nombre }}</div>
                  <div v-if="u.telefono" class="text-xs text-gray-500">{{ u.telefono }}</div>
                </template>
              </td>

              <!-- Email -->
              <td class="px-4 align-middle">
                <template v-if="editId === u.id">
                  <input v-model.trim="form.email" type="email"
                    class="w-full rounded bg-white border border-gray-200 px-2 py-1 text-sm focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none" />
                </template>
                <template v-else>
                  <div class="truncate max-w-[200px] text-gray-600">{{ u.email }}</div>
                </template>
              </td>

              <!-- Comunidad -->
              <td class="px-4 align-middle">
                <template v-if="editId === u.id">
                  <input v-model.trim="form.comunidad"
                    class="w-full rounded bg-white border border-gray-200 px-2 py-1 text-sm focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none" />
                </template>
                <template v-else>
                  <span class="text-gray-700">{{ u.comunidad || '—' }}</span>
                </template>
              </td>

              <!-- Rol -->
              <td class="px-4 align-middle">
                <template v-if="editId === u.id">
                  <select v-model="form.rol" class="rounded bg-white border border-gray-200 px-2 py-1 text-sm">
                    <option value="user">Usuaria</option>
                    <option value="operador">Operador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </template>
                <template v-else>
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border" :class="{
                    'bg-purple-50 text-purple-700 border-purple-200': String(u.rol) === 'admin',
                    'bg-sky-50 text-sky-700 border-sky-200': String(u.rol) === 'operador',
                    'bg-gray-50 text-gray-600 border-gray-200': String(u.rol) !== 'admin' && String(u.rol) !== 'operador'
                  }">
                    {{ String(u.rol) === 'admin' ? 'Admin' : String(u.rol) === 'operador' ? 'Operador' : 'Usuaria' }}
                  </span>
                </template>
              </td>

              <!-- Estado -->
              <td class="px-4 align-middle">
                <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border" :class="u.activo
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-gray-100 text-gray-500 border-gray-200'">
                  {{ u.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>

              <!-- Alta -->
              <td class="px-4 align-middle text-xs text-gray-500 whitespace-nowrap">
                {{ fmtFecha(u.createdAt) }}
              </td>

              <!-- Acciones -->
              <td class="px-4 align-middle">
                <!-- MODO EDICIÓN -->
                <template v-if="editId === u.id">
                  <div class="flex flex-wrap gap-2">
                    <button
                      class="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
                      @click="saveEdit">
                      Guardar
                    </button>
                    <button
                      class="inline-flex items-center rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-300 transition-colors"
                      @click="cancelEdit">
                      Cancelar
                    </button>
                    <span v-if="editErr" class="block w-full text-[10px] text-red-500 mt-1">
                      {{ editErr }}
                    </span>
                  </div>
                </template>

                <!-- MODO NORMAL -->
                <template v-else>
                  <div class="flex flex-wrap gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button v-if="u.rol === 'user'"
                      class="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                      title="Crear Pedido" @click="abrirModalPedido(u)">
                      + Pedido
                    </button>
                    <button
                      class="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                      @click="startEdit(u.id)">
                      Editar
                    </button>

                    <button
                      class="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors"
                      :class="u.activo ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'"
                      @click="toggleActivo(u.id)">
                      {{ u.activo ? 'Desactivar' : 'Activar' }}
                    </button>

                    <!-- <button class="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
                      @click="eliminar(u.id)">
                      Eliminar
                    </button> -->
                  </div>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="p-8 text-center text-gray-400 font-medium">No hay usuarios con esos filtros.</div>
    </div>

    <!-- Modal de Confirmación -->
    <div v-if="showDeleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
        <h3 class="text-xl font-bold text-gray-900 mb-2">Confirmar eliminación</h3>
        <p class="text-gray-500 mb-6 font-medium">
          ¿Estás seguro de que deseas eliminar este usuario? Esta acción es irreversible.
        </p>

        <div v-if="deleteErr" class="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
          {{ deleteErr }}
        </div>

        <div class="flex justify-end gap-3">
          <button class="rounded-xl px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            @click="showDeleteModal = false">
            Cancelar
          </button>
          <button
            class="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-200"
            @click="confirmDelete">
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- Modal Crear Pedido -->
  <div v-if="showModalPedido"
    class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
    <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
      <h3 class="text-xl font-bold text-gray-900 mb-2">Nuevo Pedido</h3>
      <p class="text-sm text-gray-500 mb-4">
        Creando pedido para <span class="font-bold text-gray-800">{{ usuarioPedido?.nombre }}</span>
      </p>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Producto</label>
          <select v-model="formPedido.producto"
            class="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5">
            <option disabled value="">Selecciona un producto...</option>
            <option v-for="p in productos.activos" :key="p.id" :value="p.nombre">{{ p.nombre }}</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Cantidad (Sacos)</label>
          <input v-model.number="formPedido.cantidad" type="number" min="1"
            class="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5" />
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Notas (Opcional)</label>
          <textarea v-model="formPedido.notas" rows="2"
            class="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5"></textarea>
        </div>

        <div v-if="pedidoMsg" class="p-2 rounded bg-emerald-50 text-emerald-700 text-sm font-bold text-center">
          {{ pedidoMsg }}
        </div>
        <div v-if="pedidoErr" class="p-2 rounded bg-red-50 text-red-700 text-sm font-bold text-center">
          {{ pedidoErr }}
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-6">
        <button class="rounded-xl px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          @click="showModalPedido = false">
          Cancelar
        </button>
        <button
          class="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-red-800 transition-colors shadow-lg shadow-brand/20 disabled:opacity-50"
          :disabled="isSavingPedido" @click="guardarPedido">
          {{ isSavingPedido ? 'Guardando...' : 'Crear Pedido' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Modal Crear Pedido -->
  <div v-if="showModalPedido"
    class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
    <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
      <h3 class="text-xl font-bold text-gray-900 mb-2">Nuevo Pedido</h3>
      <p class="text-sm text-gray-500 mb-4">
        Creando pedido para <span class="font-bold text-gray-800">{{ usuarioPedido?.nombre }}</span>
      </p>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Producto</label>
          <select v-model="formPedido.producto"
            class="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5">
            <option disabled value="">Selecciona un producto...</option>
            <option v-for="p in productos.activos" :key="p.id" :value="p.nombre">{{ p.nombre }}</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Cantidad (Sacos)</label>
          <input v-model.number="formPedido.cantidad" type="number" min="1"
            class="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5" />
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Notas (Opcional)</label>
          <textarea v-model="formPedido.notas" rows="2"
            class="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5"></textarea>
        </div>

        <div v-if="pedidoMsg" class="p-2 rounded bg-emerald-50 text-emerald-700 text-sm font-bold text-center">
          {{ pedidoMsg }}
        </div>
        <div v-if="pedidoErr" class="p-2 rounded bg-red-50 text-red-700 text-sm font-bold text-center">
          {{ pedidoErr }}
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-6">
        <button class="rounded-xl px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          @click="showModalPedido = false">
          Cancelar
        </button>
        <button
          class="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-red-800 transition-colors shadow-lg shadow-brand/20 disabled:opacity-50"
          :disabled="isSavingPedido" @click="guardarPedido">
          {{ isSavingPedido ? 'Guardando...' : 'Crear Pedido' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
td,
th {
  font-size: 0.85rem;
}
</style>
