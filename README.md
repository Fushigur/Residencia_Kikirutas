SISTEMA WEB DE GESTIÓN LOGÍSTICA Y COMERCIAL – COLECTIVO KIKIBÁ

Este proyecto es un sistema web desarrollado para apoyar al colectivo Kikibá, conformado por mujeres emprendedoras de la zona maya de Quintana Roo, en la gestión del alimento de sus gallinas y la comercialización de huevo libre de jaula. El sistema permite controlar inventarios, registrar pedidos, administrar rutas de entrega y consultar reportes.

TECNOLOGÍAS UTILIZADAS
- Frontend: Vue.js 3 + Vite
- Backend: Laravel 10 (PHP 8.2)
- Base de datos: MySQL
- API: RESTful
- Servidor de pruebas: Amazon EC2 (Linux Ubuntu)
- Servidor de producción: cPanel (PHP shared hosting)

FUNCIONALIDADES PRINCIPALES

Logística del alimento
- Registro de entregas de alimento por comunidad
- Control de inventario de alimento (entradas y salidas)
- Registro del consumo semanal por comunidad

Comercialización
- Registro de pedidos de huevo por parte de usuarias
- Historial de pedidos y entregas
- Administración de clientes
- Reportes básicos de ventas y consumo

Rutas de reparto
- Asignación de pedidos a operadores
- Visualización de puntos de entrega por comunidad
- Optimización básica de rutas

INSTALACIÓN LOCAL

1. Clonar el repositorio
git clone https://github.com/tu_usuario/kikirutas-web.git
cd kikirutas-web

2. Configurar el backend (Laravel)
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve

3. Configurar el frontend (Vue.js)
cd ../frontend
npm install
npm run dev

DESPLIEGUE

Pruebas en AWS
Se utilizó Amazon EC2 (Amazon Linux 2023) para el despliegue temporal del sistema, conectado vía SSH con archivo .pem.

Producción en cPanel
El sistema final fue migrado a un servidor con cPanel y dominio propio:
https://kikirutas.z-ideas.com.mx

ACCESOS DE PRUEBA

Emprendedora:
usuario: usuaria@gmail.com
contraseña: Usuaria123*

Administrador:
usuario: admin@gmail.com
contraseña: Admin123*

Operador:
usuario: operador@gmail.com
contraseña: Operador123*

ESTRUCTURA DEL PROYECTO
/
├── backend/         # Proyecto Laravel (API)
├── frontend/        # Proyecto Vue (Interfaz)
├── database/        # Migraciones y seeds
├── README.md

CRÉDITOS

Este sistema fue desarrollado como parte de una residencia profesional del TecNM Instituto Tecnológico de Chetumal por:

Gutiérrez Pérez Claudio Habraham
8.º/9.º semestre – Ingeniería en Sistemas Computacionales

Asesor interno: M.A. Manuel Abraham Zapata Encalada
Año: 2025

LICENCIA
Este proyecto puede ser usado con fines académicos y comunitarios sin fines de lucro. Para usos comerciales, se requiere autorización previa del colectivo Kikibá.
