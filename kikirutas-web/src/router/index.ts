import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: { name: 'login' } },

    // Páginas públicas (ocultan links del header)
    { path: '/login',    name: 'login',    component: () => import('@/views/user/LoginView.vue'),    meta: { public: true, hideAuthLinks: true } },
    { path: '/registro', name: 'register', component: () => import('@/views/user/RegisterView.vue'), meta: { public: true, hideAuthLinks: true } },

    // Panel usuaria (oculta header global)
    {
      path: '/usuario',
      component: () => import('@/layouts/UserLayout.vue'),
      meta: { requiresAuth: true, role: 'user', noGlobalHeader: true },
      children: [
        { path: '', redirect: { name: 'u.inicio' } },
        { path: 'inicio',         name: 'u.inicio',         component: () => import('@/views/user/UserHome.vue') },
        { path: 'pedido/nuevo',   name: 'u.pedido.nuevo',   component: () => import('@/views/user/NewOrderView.vue') },
        { path: 'historial',      name: 'u.historial',      component: () => import('@/views/user/OrderHistoryView.vue') },
        { path: 'alertas',        name: 'u.alertas',        component: () => import('@/views/user/AlertsView.vue') },
        { path: 'perfil',         name: 'u.perfil',         component: () => import('@/views/user/ProfileView.vue') },
        { path: 'granja', name: 'u.inventario', component: () => import('@/views/user/InventarioView.vue') },
      ],
    },

    // Panel administrador (oculta header global)
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, role: 'admin', noGlobalHeader: true },
      children: [
        { path: '',           redirect: { name: 'a.resumen' } },
        { path: 'resumen',    name: 'a.resumen',    component: () => import('@/views/admin/ReportsView.vue') },
        { path: 'pedidos',    name: 'a.pedidos',    component: () => import('@/views/admin/OrdersBoard.vue') },
        { path: 'rutas',      name: 'a.rutas',      component: () => import('@/views/admin/RoutesView.vue') },
        { path: 'usuarios',   name: 'a.usuarios',   component: () => import('@/views/admin/UsersView.vue') },
        { path: 'productos',  name: 'a.productos',  component: () => import('@/views/admin/ProductsView.vue') },
        { path: 'reportes',   name: 'a.reportes',   component: () => import('@/views/admin/ReportsView.vue') },

      ],
    },

    { path: '/:pathMatch(.*)*', name: '404', component: () => import('@/views/NotFound.vue'), meta: { public: true } },
  ],
});

// Guard global
router.beforeEach((to) => {
  const auth = useAuthStore();

  // Si ya hay sesión y trata de ir a login/registro, lo mando a su panel
  if ((to.name === 'login' || to.name === 'register') && auth.isAuth) {
    return auth.role === 'admin' ? { name: 'a.resumen' } : { name: 'u.inicio' };
  }

  // Rutas públicas
  if (to.meta.public) return true;

  // Requiere sesión
  if (to.meta.requiresAuth && !auth.isAuth) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  // Requiere rol específico
  if (to.meta.role && auth.role !== to.meta.role) {
    return auth.role === 'admin'
      ? { name: 'a.resumen' }
      : auth.role === 'user'
      ? { name: 'u.inicio' }
      : { name: 'login' };
  }

  return true;
});

export default router;
