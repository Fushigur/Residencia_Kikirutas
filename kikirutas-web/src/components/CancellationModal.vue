<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
    show: boolean
    title?: string
    message?: string
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'confirm', reason: string): void
}>()

const reason = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

// Limpiar y enfocar cuando se abre
watch(() => props.show, async (val) => {
    if (val) {
        reason.value = ''
        await nextTick()
        inputRef.value?.focus()
    }
})

function onConfirm() {
    if (!reason.value.trim()) return
    emit('confirm', reason.value.trim())
}
</script>

<template>
    <Transition name="fade">
        <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <!-- Backdrop -->
            <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="emit('close')"></div>

            <!-- Modal Content -->
            <div class="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-neutral-900 border border-white/10 p-6 text-left shadow-2xl transition-all"
                role="dialog" aria-modal="true">
                <h3 class="text-lg font-semibold leading-6 text-white mb-2">
                    {{ title || 'Confirmar acción' }}
                </h3>

                <p class="text-sm text-gray-300 mb-4">
                    {{ message || 'Por favor ingresa el motivo de esta acción.' }}
                </p>

                <div class="mb-5">
                    <label
                        class="block text-xs uppercase tracking-wider text-white/50 mb-1.5 font-medium">Motivo</label>
                    <input ref="inputRef" v-model="reason" type="text"
                        class="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all"
                        placeholder="Ej. Duplicado, error de usuario..." @keyup.enter="onConfirm" />
                </div>

                <div class="flex items-center justify-end gap-3">
                    <button type="button"
                        class="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        @click="emit('close')">
                        Cancelar
                    </button>
                    <button type="button"
                        class="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        :disabled="!reason.trim()" @click="onConfirm">
                        Confirmar cancelación
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
