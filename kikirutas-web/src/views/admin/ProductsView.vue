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
  <section class="space-y-4">
    <h1 class="text-2xl font-semibold">Productos</h1>

    <!-- Error de carga -->
    <div
      v-if="loadErr"
      class="rounded-lg border border-rose-500/40 bg-rose-900/30 text-rose-100 text-sm px-3 py-2"
    >
      {{ loadErr }}
    </div>

    <!-- Alta -->
    <div class="rounded-xl bg-white/5 border border-white/10 p-4 max-w-xl">
      <h3 class="font-semibold mb-3">Nuevo producto</h3>

      <div class="grid md:grid-cols-2 gap-3">
        <div>
          <label class="block text-sm mb-1">Nombre</label>
          <input
            v-model.trim="nuevoNombre"
            type="text"
            class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2"
            placeholder="Ej. Alimento ponedoras 40kg"
          />
        </div>
        <div>
          <label class="block text-sm mb-1">Precio (MXN)</label>
          <input
            v-model.number="nuevoPrecio"
            type="number"
            min="0.01"
            step="0.01"
            class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2"
            placeholder="380.00"
          />
        </div>
      </div>

      <div class="flex items-center gap-3 mt-3">
        <button
          class="rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-500"
          @click="crearProducto"
        >
          Guardar
        </button>
        <span v-if="formMsg" class="text-sm text-emerald-300">{{ formMsg }}</span>
        <span v-if="formErr" class="text-sm text-rose-300">{{ formErr }}</span>
      </div>
    </div>

    <!-- Tabla -->
    <div class="rounded-xl bg-white/5 border border-white/10 p-4">
      <h3 class="font-semibold mb-3">
        Lista <span class="text-white/60 text-sm">({{ productos.length }})</span>
      </h3>

      <!-- Estado de carga -->
      <div v-if="loading" class="py-6 text-sm text-white/70">
        Cargando productos…
      </div>

      <div v-else-if="productos.length" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-white/60">
              <th class="text-left py-2">Nombre</th>
              <th class="text-left">Precio</th>
              <th class="text-left">Estado</th>
              <th class="text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in productos"
              :key="p.id"
              class="border-t border-white/10"
            >
              <!-- Nombre -->
              <td class="py-2">
                <template v-if="editingId === p.id">
                  <input
                    v-model.trim="editNombre"
                    type="text"
                    class="rounded bg-neutral-900 border border-white/10 px-2 py-1 w-full"
                  />
                </template>
                <template v-else>
                  {{ p.nombre }}
                </template>
              </td>

              <!-- Precio -->
              <td>
                <template v-if="editingId === p.id">
                  <input
                    v-model.number="editPrecio"
                    type="number"
                    min="0.01"
                    step="0.01"
                    class="rounded bg-neutral-900 border border-white/10 px-2 py-1 w-32"
                  />
                </template>
                <template v-else>
                  ${{ p.precio.toFixed(2) }}
                </template>
              </td>

              <!-- Estado -->
              <td>
                <span
                  class="px-2 py-1 rounded text-xs font-medium"
                  :class="
                    p.activo
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-500/15 text-slate-300 border border-slate-500/30'
                  "
                >
                  {{ p.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>

              <!-- Acciones -->
              <td class="space-x-2">
                <template v-if="editingId === p.id">
                  <button
                    class="rounded px-3 py-1 text-white bg-emerald-600 hover:bg-emerald-500"
                    @click="saveEdit"
                  >
                    Guardar
                  </button>
                  <button
                    class="rounded px-3 py-1 text-white bg-gray-600 hover:bg-gray-500"
                    @click="cancelEdit"
                  >
                    Cancelar
                  </button>
                  <span
                    v-if="editErr"
                    class="text-rose-300 text-xs ml-2"
                  >{{ editErr }}</span>
                </template>

                <template v-else>
                  <button
                    class="rounded px-3 py-1 text-white bg-blue-600 hover:bg-blue-500"
                    @click="startEdit(p.id)"
                  >
                    Editar
                  </button>

                  <button
                    class="rounded px-3 py-1 text-white"
                    :class="
                      p.activo
                        ? 'bg-red-600 hover:bg-red-500'
                        : 'bg-emerald-600 hover:bg-emerald-500'
                    "
                    @click="store.toggleActivo(p.id)"
                  >
                    {{ p.activo ? 'Desactivar' : 'Activar' }}
                  </button>

                  <button
                    class="rounded px-3 py-1 text-white bg-rose-700 hover:bg-rose-600"
                    @click="remove(p.id)"
                  >
                    Eliminar
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-else class="text-white/70 text-sm">No hay productos.</p>
    </div>
  </section>
</template>