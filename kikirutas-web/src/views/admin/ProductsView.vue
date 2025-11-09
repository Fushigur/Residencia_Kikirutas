<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useProductosStore, type Producto } from '@/stores/productos';

const productos = useProductosStore();

onMounted(() => {
  productos.load();
  productos.seedDefaults();
});

const form = ref<{ nombre: string; precio: number; activo: boolean }>({
  nombre: '',
  precio: 0,
  activo: true,
});
const editingId = ref<string | null>(null);
const search = ref('');

const lista = computed(() => {
  const q = search.value.trim().toLowerCase();
  const base = [...productos.items].sort((a, b) => a.nombre.localeCompare(b.nombre));
  return q ? base.filter(p => p.nombre.toLowerCase().includes(q)) : base;
});

function resetForm() {
  form.value = { nombre: '', precio: 0, activo: true };
  editingId.value = null;
}

function save() {
  const payload = {
    nombre: form.value.nombre.trim(),
    precio: Number(form.value.precio) || 0,
    activo: form.value.activo,
  };
  if (!payload.nombre) return;

  if (editingId.value) {
    productos.update(editingId.value, payload);
  } else {
    productos.add(payload);
  }
  resetForm();
}

function edit(p: Producto) {
  editingId.value = p.id;
  form.value = { nombre: p.nombre, precio: p.precio, activo: p.activo };
}

function remove(id: string) {
  if (confirm('¿Eliminar producto?')) productos.remove(id);
}
</script>

<template>
  <section class="space-y-4">
    <header class="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold">Productos</h1>
        <p class="text-white/70 text-sm">CRUD simple de productos y precios.</p>
      </div>

      <input
        v-model="search"
        type="search"
        placeholder="Buscar producto…"
        class="rounded bg-neutral-900 border border-white/10 px-3 py-2 text-sm w-full md:w-72"
      />
    </header>

    <!-- Formulario -->
    <div class="rounded-xl bg-white/5 border border-white/10 p-4">
      <h3 class="font-semibold mb-3">{{ editingId ? 'Editar producto' : 'Nuevo producto' }}</h3>

      <div class="grid md:grid-cols-3 gap-3">
        <div class="md:col-span-2">
          <label class="block text-sm mb-1">Nombre</label>
          <input
            v-model.trim="form.nombre"
            type="text"
            class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2"
            placeholder="Ej. Alimento ponedoras 40kg"
          />
        </div>
        <div>
          <label class="block text-sm mb-1">Precio (MXN)</label>
          <input
            v-model.number="form.precio"
            type="number"
            min="0"
            step="0.01"
            class="w-full rounded bg-neutral-900 border border-white/10 px-3 py-2"
          />
        </div>
        <div class="flex items-center gap-2">
          <input id="activo" type="checkbox" v-model="form.activo" />
          <label for="activo" class="text-sm">Visible para usuarias</label>
        </div>
      </div>

      <div class="flex items-center gap-2 mt-3">
        <button class="rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-500" @click="save">
          {{ editingId ? 'Guardar cambios' : 'Agregar' }}
        </button>
        <button v-if="editingId" type="button" class="rounded bg-white/10 px-4 py-2" @click="resetForm">
          Cancelar
        </button>
      </div>
    </div>

    <!-- Tabla -->
    <div class="rounded-xl bg-white/5 border border-white/10 p-4 overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-white/60">
            <th class="text-left py-2">Producto</th>
            <th class="text-left">Precio</th>
            <th class="text-left">Activo</th>
            <th class="text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in lista" :key="p.id" class="border-t border-white/10">
            <td class="py-2">{{ p.nombre }}</td>
            <td>${{ p.precio.toFixed(2) }}</td>
            <td>
              <button
                class="rounded px-2 py-1 text-xs"
                :class="p.activo ? 'bg-emerald-600' : 'bg-white/10'"
                @click="productos.toggleActivo(p.id)"
              >
                {{ p.activo ? 'Sí' : 'No' }}
              </button>
            </td>
            <td class="space-x-2 py-2">
              <button class="rounded bg-white/10 px-3 py-1 hover:bg-white/20" @click="edit(p)">Editar</button>
              <button class="rounded bg-rose-600 px-3 py-1 hover:bg-rose-500" @click="remove(p.id)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!lista.length" class="text-white/70 text-sm mt-3">Sin resultados.</p>
    </div>
  </section>
</template>
