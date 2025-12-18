<script setup lang="ts">
import { useConfirmStore } from '@/stores/confirm'

const store = useConfirmStore()
</script>

<template>
  <Transition name="modal">
    <div v-if="store.isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <!-- Backdrop with blur -->
      <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity" @click="store.cancel"></div>

      <!-- Modal Card -->
      <div class="relative w-full max-w-sm transform overflow-hidden rounded-[2rem] bg-white p-8 text-center shadow-2xl transition-all border border-gray-100 flex flex-col items-center">
        
        <!-- Animated Icon Container -->
        <div class="mb-6 h-20 w-20 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100/50 shadow-inner">
          <div class="h-12 w-12 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-lg animate-pulse">
            <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        </div>

        <!-- Text Content -->
        <h3 class="text-xl font-black text-gray-900 leading-tight mb-2">
          {{ store.title }}
        </h3>
        <p class="text-sm font-medium text-gray-500 leading-relaxed px-4">
          {{ store.message }}
        </p>

        <!-- Actions -->
        <div class="mt-8 flex flex-col w-full gap-3">
          <button 
            type="button"
            class="w-full rounded-2xl bg-rose-600 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-rose-200 hover:bg-rose-700 hover:scale-[1.02] active:scale-95 transition-all duration-200"
            @click="store.confirm"
          >
            {{ store.confirmText }}
          </button>
          
          <button 
            type="button"
            class="w-full rounded-2xl bg-gray-50 px-6 py-4 text-sm font-bold text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200"
            @click="store.cancel"
          >
            {{ store.cancelText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-enter-from {
  opacity: 0;
}

.modal-enter-from .relative {
  transform: scale(0.9) translateY(20px);
}

.modal-leave-to {
  opacity: 0;
}

.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>
