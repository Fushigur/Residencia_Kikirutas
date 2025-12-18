<script setup lang="ts">
import { computed } from 'vue'
import { useAlertasStore } from '@/stores/alertas'
import { storeToRefs } from 'pinia'

const store = useAlertasStore()
const { items } = storeToRefs(store)

// Muestra cualquier alerta no leída
const alert = computed(() => items.value.find(a => !a.leida))

function closeAlert() {
    if (alert.value) {
        store.markRead(alert.value.id)
    }
}
</script>

<template>
    <Transition name="fade">
        <div v-if="alert" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <!-- Backdrop -->
            <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" @click="closeAlert"></div>

            <!-- Alert Content (Premium Light Mode) -->
            <div class="relative w-full max-w-md transform overflow-hidden rounded-2xl p-6 text-left shadow-2xl transition-all border border-gray-100 bg-white"
                role="alert">
                <div class="flex items-start gap-4">
                    <!-- Icon based on severity -->
                    <div class="flex-shrink-0">
                        <div v-if="alert.severidad === 'urgent'"
                            class="p-2 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div v-else-if="alert.severidad === 'warning'"
                            class="p-2 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div v-else class="p-2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>

                    <div class="flex-1 w-0">
                        <h3 class="text-lg font-bold leading-6 text-gray-900">
                            {{ alert.titulo }}
                        </h3>
                        <div class="mt-2 text-sm text-gray-600 font-medium">
                            <p>{{ alert.mensaje }}</p>
                        </div>

                        <div class="mt-5 flex gap-3">
                            <!-- Botón Primario -->
                            <button type="button"
                                class="inline-flex justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/20 hover:bg-red-800 hover:-translate-y-0.5 transition-all focus:outline-none"
                                @click="closeAlert">
                                Entendido
                            </button>

                            <!-- Botón Secundario (CTA) -->
                            <RouterLink v-if="alert.ctaPrimaria?.routeName"
                                :to="{ name: alert.ctaPrimaria.routeName, params: alert.ctaPrimaria.routeParams }"
                                class="inline-flex justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                                @click="closeAlert">
                                {{ alert.ctaPrimaria.label }}
                            </RouterLink>
                        </div>
                    </div>

                    <!-- Botón Cerrar (X) -->
                    <button @click="closeAlert"
                        class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
