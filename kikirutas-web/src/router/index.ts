import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },

    {
      path: '/login',
      name: 'login',
      component: () => import('@views/user/LoginView.vue'),
      meta: { public: true }
    },

    {
      path: '/usuario',
      component: () => import('@layouts/UserLayout.vue'),
      meta: { requiresAuth: true, role: 'user' },
      children: [
        { path: '', redirect: { name: 'u.inicio' } },
        { path: 'inicio', name: 'u.inicio', component: () => import('@views/user/UserHome.vue') },
        { path: 'pedido/nuevo', name: 'u.pedido.nuevo', component: () => import('@views/user/NewOrderView.vue') },
        { path: 'historial', name: 'u.historial', component: () => import('@views/user/OrderHistoryView.vue') },
        { path: 'alertas', name: 'u.alertas', component: () => import('@views/user/AlertsView.vue') },
        { path: 'perfil', name: 'u.perfil', component: () => import('@views/user/ProfileView.vue') }
      ]
    },

    {
      path: '/admin',
      component: () => import('@layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, role: 'admin' },
      children: [
        { path: '', redirect: { name: 'a.resumen' } },
        { path: 'resumen', name: 'a.resumen', component: () => import('@views/admin/AdminHome.vue') },
        { path: 'pedidos', name: 'a.pedidos', component: () => import('@views/admin/OrdersBoard.vue') },
        { path: 'rutas', name: 'a.rutas', component: () => import('@views/admin/RoutesView.vue') },
        { path: 'usuarios', name: 'a.usuarios', component: () => import('@views/admin/UsersView.vue') },
        { path: 'productos', name: 'a.productos', component: () => import('@views/admin/ProductsView.vue') },
        { path: 'reportes', name: 'a.reportes', component: () => import('@views/admin/ReportsView.vue') }
      ]
    },

    { path: '/:pathMatch(.*)*', name: '404', component: () => import('@views/NotFound.vue'), meta: { public: true } }
  ]
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta?.public) return true;

  if (to.meta?.requiresAuth && !auth.isAuth) {
    return { name: 'login' };
  }

  if (to.meta?.role && auth.role && to.meta.role !== auth.role) {
    return auth.role === 'admin' ? { name: 'a.resumen' } : { name: 'u.inicio' };
  }

  return true;
});

export default router;
