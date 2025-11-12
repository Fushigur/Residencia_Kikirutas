import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@views': path.resolve(__dirname, './src/views'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@stores': path.resolve(__dirname, './src/stores')
    }
  }
});