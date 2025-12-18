import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConfirmStore = defineStore('confirm', () => {
    const isOpen = ref(false)
    const title = ref('')
    const message = ref('')
    const confirmText = ref('Confirmar')
    const cancelText = ref('Cancelar')

    let resolvePromise: (value: boolean) => void

    function ask(opts: {
        title?: string,
        message: string,
        confirmText?: string,
        cancelText?: string
    }): Promise<boolean> {
        title.value = opts.title || 'Confirmación'
        message.value = opts.message
        confirmText.value = opts.confirmText || 'Confirmar'
        cancelText.value = opts.cancelText || 'Cancelar'
        isOpen.value = true

        return new Promise((resolve) => {
            resolvePromise = resolve
        })
    }

    function confirm() {
        isOpen.value = false
        resolvePromise(true)
    }

    function cancel() {
        isOpen.value = false
        resolvePromise(false)
    }

    return {
        isOpen,
        title,
        message,
        confirmText,
        cancelText,
        ask,
        confirm,
        cancel
    }
})
