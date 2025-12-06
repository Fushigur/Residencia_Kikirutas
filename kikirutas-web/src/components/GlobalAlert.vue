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
        <div v-if="alert" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <!-- Backdrop -->
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeAlert"></div>

            <!-- Alert Content (Bootstrap-like aesthetic but dark mode optimized) -->
            <div class="relative w-full max-w-md transform overflow-hidden rounded-2xl p-6 text-left shadow-xl transition-all border border-white/10 bg-neutral-900"
                role="alert">
                <div class="flex items-start gap-4">
                    <!-- Icon based on severity -->
                    <div class="flex-shrink-0">
                        <div v-if="alert.severidad === 'urgent'" class="p-2 rounded-full bg-rose-500/10 text-rose-500">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div v-else-if="alert.severidad === 'warning'"
                            class="p-2 rounded-full bg-amber-500/10 text-amber-500">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div v-else class="p-2 rounded-full bg-emerald-500/10 text-emerald-500">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>

                    <div class="flex-1 w-0">
                        <h3 class="text-lg font-medium leading-6 text-white">
                            {{ alert.titulo }}
                        </h3>
                        <div class="mt-2 text-sm text-gray-300">
                            <p>{{ alert.mensaje }}</p>
                        </div>

                        <div class="mt-4 flex gap-3">
                            <button type="button"
                                class="inline-flex justify-center rounded-lg border border-transparent bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                                @click="closeAlert">
                                Entendido
                            </button>
                            <RouterLink v-if="alert.ctaPrimaria?.routeName"
                                :to="{ name: alert.ctaPrimaria.routeName, params: alert.ctaPrimaria.routeParams }"
                                class="inline-flex justify-center rounded-lg border border-transparent bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
                                @click="closeAlert">
                                {{ alert.ctaPrimaria.label }}
                            </RouterLink>
                        </div>
                    </div>

                    <button @click="closeAlert" class="text-gray-400 hover:text-white transition-colors">
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
