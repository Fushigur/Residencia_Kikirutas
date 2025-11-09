<template>
  <div>
    <h2 class="text-xl font-semibold mb-4">Historial</h2>
    <div class="overflow-x-auto rounded-xl border border-white/10">
      <table class="min-w-full text-sm">
        <thead class="bg-white/5 text-gray-300">
          <tr>
            <th class="px-4 py-2 text-left">Folio</th>
            <th class="px-4 py-2 text-left">Producto</th>
            <th class="px-4 py-2 text-left">Cantidad</th>
            <th class="px-4 py-2 text-left">Fecha</th>
            <th class="px-4 py-2 text-left">Estatus</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-t border-white/10">
            <td class="px-4 py-2">KIK-001</td>
            <td class="px-4 py-2">Ponedoras 40kg</td>
            <td class="px-4 py-2">3</td>
            <td class="px-4 py-2">2025-11-08</td>
            <td class="px-4 py-2">
              <span class="rounded bg-slate-700 px-2 py-0.5 text-xs">Entregado</span>
            </td>
          </tr>
          <tr class="border-t border-white/10">
            <td class="px-4 py-2">KIK-002</td>
            <td class="px-4 py-2">Iniciador 40kg</td>
            <td class="px-4 py-2">1</td>
            <td class="px-4 py-2">2025-11-01</td>
            <td class="px-4 py-2">
              <span class="rounded bg-yellow-600 px-2 py-0.5 text-xs">En ruta</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
