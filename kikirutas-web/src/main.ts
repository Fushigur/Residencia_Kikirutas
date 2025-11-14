import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
// si usas router:
import router from './router';
import './main.css';

import api from './api';

console.log('[VITE_API_BASE]', import.meta.env.VITE_API_BASE);
api.get('/health').then(r => console.log('[API OK]', r.data)).catch(console.error);

const app = createApp(App);
app.use(createPinia());
if (router) app.use(router);
app.mount('#app');
