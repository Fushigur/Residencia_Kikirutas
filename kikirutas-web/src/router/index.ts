// src/router/index.ts
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
  type RouteLocationNormalized,
} from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: { name: 'login' } },

  // Públicas
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/user/LoginView.vue'),
    meta: { public: true, hideAuthLinks: true },
  },
  {
    path: '/registro',
    name: 'register',
    component: () => import('@/views/user/RegisterView.vue'),
    meta: { public: true, hideAuthLinks: true },
  },

  // Salir: limpia auth y redirige
  {
    path: '/salir',
    name: 'logout',
    meta: { public: true },
    redirect: () => {
      const auth = useAuthStore()
      auth.logout?.()
      localStorage.removeItem('auth_token')
      return { name: 'login' }
    },
  },

  // Panel Usuaria
{
  path: '/usuario',
  component: () => import('@/layouts/UserLayout.vue'),
  meta: { requiresAuth: true, role: 'user', noGlobalHeader: true },
  children: [
    { path: '', redirect: { name: 'u.inicio' } },
    { path: 'inicio', name: 'u.inicio', component: () => import('@/views/user/UserHome.vue') },
      { path: 'pedido/nuevo',  name: 'u.pedido.nuevo',  component: () => import('@/views/user/NewOrderView.vue') },
      { path: 'historial',     name: 'u.historial',     component: () => import('@/views/user/OrderHistoryView.vue') },
      { path: 'alertas',       name: 'u.alertas',       component: () => import('@/views/user/AlertsView.vue') },
      { path: 'perfil',        name: 'u.perfil',        component: () => import('@/views/user/ProfileView.vue') },
      { path: 'granja',        name: 'u.inventario',    component: () => import('@/views/user/InventarioView.vue') },
    ],
  },

  // Panel Admin
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin', noGlobalHeader: true },
    children: [
      { path: '',          redirect: { name: 'a.resumen' } },
      // OJO: archivo correcto según tu proyecto
      { path: 'resumen',   name: 'a.resumen',   component: () => import('@/views/admin/AdminHome.vue') },
      { path: 'pedidos',   name: 'a.pedidos',   component: () => import('@/views/admin/OrdersBoard.vue') },
      { path: 'rutas',     name: 'a.rutas',     component: () => import('@/views/admin/RoutesView.vue') },
      { path: 'usuarios',  name: 'a.usuarios',  component: () => import('@/views/admin/UsersView.vue') },
      { path: 'productos', name: 'a.productos', component: () => import('@/views/admin/ProductsView.vue') },
      { path: 'reportes',  name: 'a.reportes',  component: () => import('@/views/admin/ReportsView.vue') },
    ],
  },

  // Panel Operador
{
  path: '/operador',
  component: () => import('@/layouts/OperatorLayout.vue'),
  meta: { requiresAuth: true, role: 'operator', noGlobalHeader: true },
  children: [
    { path: '', redirect: { name: 'op.hoy' } },
    { path: 'hoy', name: 'op.hoy', component: () => import('@/views/operator/RoutesTodayView.vue') },
    { path: 'ruta/:id', name: 'op.ruta', component: () => import('@/views/operator/RouteRunView.vue'), props: true },
    { path: 'ruta/:id/mapa', name: 'op.ruta.mapa', component: () => import('@/views/operator/RouteMapView.vue'), props: true },
  ],
},

  // Alias público /chofer (deeplinks)
  {
    path: '/chofer',
    component: () => import('@/layouts/OperatorLayout.vue'),
    meta: { public: true, hideAuthLinks: true, noGlobalHeader: true },
    children: [
      { path: 'ruta/:id',      name: 'd.ruta',      component: () => import('@/views/operator/RouteRunView.vue'), props: true },
      { path: 'ruta/:id/mapa', name: 'd.ruta.mapa', component: () => import('@/views/operator/RouteMapView.vue'), props: true },
    ],
  },

  // 404
  {
    path: '/:pathMatch(.*)*',
    name: '404',
    component: () => import('@/views/NotFound.vue'),
    meta: { public: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/* ---------- Guard global ---------- */
router.beforeEach((to: RouteLocationNormalized) => {
  const auth = useAuthStore()
  auth.loadFromStorage?.()

  // normaliza posibles etiquetas del back
  const normalizeRole = (r?: string) => {
    const v = (r ?? '').toLowerCase()
    if (v === 'operador') return 'operator'
    if (v === 'usuaria' || v === 'usuario' || v === 'user') return 'user'
    return v || undefined
  }
  if (auth.role) auth.role = normalizeRole(auth.role) as any

  // Si tiene sesión e intenta login/registro → llevar a su panel
  if ((to.name === 'login' || to.name === 'register') && auth.isAuth) {
    if (auth.role === 'admin') return { name: 'a.resumen' }
    if (auth.role === 'user' || auth.role === 'operator') {
      // si es operador, llévalo a su panel; si es user, a inicio
      return auth.role === 'operator' ? { name: 'op.hoy' } : { name: 'u.inicio' }
    }
  }

  // Públicas
  if (to.meta?.public) return true

  // Requiere sesión
  if (to.meta?.requiresAuth && !auth.isAuth) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Rol
  if (to.meta?.role) {
    const required = Array.isArray(to.meta.role) ? (to.meta.role as string[]) : [to.meta.role as string]
    // admin pasa siempre
    if (auth.role === 'admin') return true
    // normaliza los requeridos por si hay 'operador' en meta
    const requiredNorm = required.map(normalizeRole)
    if (!requiredNorm.includes(String(auth.role))) {
      if (auth.role === 'user') return { name: 'u.inicio' }
      return { name: 'login' }
    }
  }

  return true
})

export default router
