<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useProductosStore } from '@/stores/productos'

const store = useProductosStore()

/* --- estado de carga general --- */
const loading = ref(false)
const loadErr = ref('')

onMounted(async () => {
  loading.value = true
  loadErr.value = ''
  try {
    await store.load()
  } catch (e: any) {
    console.error('Error cargando productos', e)
    loadErr.value = 'No se pudo cargar la lista de productos.'
  } finally {
    loading.value = false
  }
})

const productos = computed(() => store.ordenados)

/* --- Alta de producto --- */
const nuevoNombre = ref('')
const nuevoPrecio = ref<number | null>(null)
const formMsg = ref('')
const formErr = ref('')

function resetForm() {
  nuevoNombre.value = ''
  nuevoPrecio.value = null
  formMsg.value = ''
  formErr.value = ''
}

async function crearProducto() {
  formMsg.value = ''
  formErr.value = ''
  try {
    await store.create({
      nombre: nuevoNombre.value,
      precio: nuevoPrecio.value ?? 0,
    })
    formMsg.value = 'Producto creado'
    resetForm()
  } catch (e: any) {
    console.error('Error creando producto', e)
    formErr.value = e?.message ?? 'No se pudo crear el producto'
  }
}

/* --- Edición inline --- */
const editingId = ref<string | null>(null)
const editNombre = ref('')
const editPrecio = ref<number | null>(null)
const editErr = ref('')

function startEdit(id: string) {
  const p = store.byId(id)
  if (!p) return
  editingId.value = id
  editNombre.value = p.nombre
  editPrecio.value = p.precio
  editErr.value = ''
}

function cancelEdit() {
  editingId.value = null
  editNombre.value = ''
  editPrecio.value = null
  editErr.value = ''
}

async function saveEdit() {
  if (!editingId.value) return
  editErr.value = ''
  try {
    await store.update(editingId.value, {
      nombre: editNombre.value,
      precio: editPrecio.value ?? 0,
    })
    editingId.value = null
  } catch (e: any) {
    console.error('Error actualizando producto', e)
    editErr.value = e?.message ?? 'No se pudo guardar los cambios'
  }
}

/* --- Eliminar producto --- */
async function remove(id: string) {
  const p = store.byId(id)
  if (!p) return
  if (!confirm(`¿Eliminar "${p.nombre}"?`)) return

  try {
    await store.remove(id)
  } catch (e: any) {
    console.error('Error eliminando producto', e)
    alert(e?.message ?? 'No se pudo eliminar el producto')
  }
}
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Productos</h1>
    </div>

    <!-- Error de carga -->
    <div v-if="loadErr"
      class="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3 flex items-center gap-2">
      <svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
      {{ loadErr }}
    </div>

    <!-- Alta -->
    <div class="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 max-w-xl">
      <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Nuevo producto
      </h3>

      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Nombre</label>
          <input
            v-model.trim="nuevoNombre"
            type="text"
            class="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all"
            placeholder="Ej. Alimento ponedoras 40kg"
          />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Precio (MXN)</label>
          <input
            v-model.number="nuevoPrecio"
            type="number"
            min="0.01"
            step="0.01"
            class="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all"
            placeholder="0.00"
          />
        </div>
      </div>

      <div class="flex items-center gap-3 mt-4">
        <button
          class="rounded-xl bg-brand font-bold text-white px-5 py-2 hover:bg-red-800 shadow-lg shadow-brand/20 transition-all hover:-translate-y-0.5"
          @click="crearProducto"
        >
          Guardar Producto
        </button>
        <span v-if="formMsg" class="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{{ formMsg }}</span>
        <span v-if="formErr" class="text-sm font-medium text-red-600 bg-red-50 px-2 py-1 rounded">{{ formErr }}</span>
      </div>
    </div>

    <!-- Tabla -->
    <div class="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div class="p-5 border-b border-gray-100 flex items-center justify-between">
        <h3 class="font-bold text-gray-900">
          Inventario <span class="text-gray-400 text-sm font-normal ml-1">({{ productos.length }} items)</span>
        </h3>
      </div>

      <!-- Estado de carga -->
      <div v-if="loading" class="p-8 text-center text-sm text-gray-500">
        <svg class="animate-spin h-6 w-6 text-brand mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        Cargando productos...
      </div>

      <div v-else-if="productos.length" class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
            <tr>
              <th class="py-3 px-5 text-left w-1/3">Nombre</th>
              <th class="px-5 text-right w-32">Precio</th>
              <th class="px-5 text-center w-32">Estado</th>
              <th class="px-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="p in productos"
              :key="p.id"
              class="hover:bg-gray-50 transition-colors"
              :class="editingId === p.id ? 'bg-amber-50/50' : ''"
            >
              <!-- Nombre -->
              <td class="py-3 px-5 font-medium text-gray-900">
                <template v-if="editingId === p.id">
                  <input
                    v-model.trim="editNombre"
                    type="text"
                    class="w-full rounded bg-white border border-gray-200 px-2 py-1.5 focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none transition-all"
                  />
                </template>
                <template v-else>
                  {{ p.nombre }}
                </template>
              </td>

              <!-- Precio -->
              <td class="px-5 text-right font-medium text-gray-600 tabular-nums">
                <template v-if="editingId === p.id">
                  <input
                    v-model.number="editPrecio"
                    type="number"
                    min="0.01"
                    step="0.01"
                    class="w-24 text-right rounded bg-white border border-gray-200 px-2 py-1.5 focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none transition-all"
                  />
                </template>
                <template v-else>
                  ${{ p.precio.toFixed(2) }}
                </template>
              </td>

              <!-- Estado -->
              <td class="px-5 text-center">
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-bold border"
                  :class="
                    p.activo
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  "
                >
                  {{ p.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>

              <!-- Acciones -->
              <td class="px-5 text-right">
                <template v-if="editingId === p.id">
                   <div class="flex items-center justify-end gap-2">
                    <button
                        class="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
                        @click="saveEdit"
                    >
                        Guardar
                    </button>
                    <button
                        class="inline-flex items-center rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-300 transition-colors"
                        @click="cancelEdit"
                    >
                        Cancelar
                    </button>
                   </div>
                   <div v-if="editErr" class="text-red-500 text-xs mt-1">{{ editErr }}</div>
                </template>

                <template v-else>
                  <div class="flex items-center justify-end gap-2 opacity-60 hover:opacity-100 transition-opacity">
                    <button
                      class="inline-flex items-center rounded-lg bg-white border border-gray-200 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-brand hover:border-brand/30 transition-all"
                      @click="startEdit(p.id)"
                    >
                      Editar
                    </button>

                    <button
                      class="inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors"
                      :class="
                        p.activo
                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      "
                      @click="store.toggleActivo(p.id)"
                    >
                      {{ p.activo ? 'Desactivar' : 'Activar' }}
                    </button>

                    <button
                      class="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Eliminar"
                      @click="remove(p.id)"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="p-10 text-center text-gray-400">
         No hay productos registrados.
      </div>
    </div>
  </section>
</template>