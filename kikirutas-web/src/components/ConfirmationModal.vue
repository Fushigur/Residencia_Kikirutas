<script setup lang="ts">
const props = defineProps<{
    show: boolean
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    danger?: boolean
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'confirm'): void
}>()
</script>

<template>
    <Transition name="fade">
        <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <!-- Backdrop -->
            <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="emit('close')"></div>

            <!-- Modal Content -->
            <div class="relative w-full max-w-sm transform overflow-hidden rounded-2xl bg-neutral-900 border border-white/10 p-6 text-left shadow-2xl transition-all"
                role="dialog" aria-modal="true">
                <div class="flex items-center gap-3 mb-2">
                    <div v-if="danger" class="p-2 rounded-full bg-rose-500/10 text-rose-500">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div v-else class="p-2 rounded-full bg-blue-500/10 text-blue-500">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold leading-6 text-white">
                        {{ title || '¿Estás seguro?' }}
                    </h3>
                </div>

                <p class="text-sm text-gray-300 mb-6 ml-11">
                    {{ message || 'Esta acción no se puede deshacer.' }}
                </p>

                <div class="flex items-center justify-end gap-3">
                    <button type="button"
                        class="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        @click="emit('close')">
                        {{ cancelText || 'Cancelar' }}
                    </button>
                    <button type="button"
                        class="rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all"
                        :class="danger ? 'bg-rose-600 hover:bg-rose-500 focus:ring-rose-500' : 'bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500'"
                        @click="emit('confirm')">
                        {{ confirmText || 'Confirmar' }}
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
