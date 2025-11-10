import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './main.css';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

// 🔑 hidratar el store antes de instalar el router y montar
import { useAuthStore } from '@/stores/auth';
useAuthStore().loadFromStorage();

app.use(router);
app.mount('#app');
