⚡ ZZZ Codes - Electron Desktop Automation
ZZZ Codes es una herramienta de escritorio potente diseñada para centralizar, gestionar y automatizar la obtención de códigos de canje para diversos juegos. Construida sobre Electron, ofrece una experiencia nativa rápida con una arquitectura moderna que separa eficientemente la lógica del sistema (Main Process) de la interfaz de usuario (Renderer).

✨ Características Principales
Gestión de Códigos Multi-Juego: Diccionarios integrados para organizar códigos por diferentes títulos y plataformas.

Automatización y Programación: Incluye un servicio de Scheduler para tareas en segundo plano y actualización automática de datos.

Base de Datos Local: Persistencia de datos robusta utilizando repositorios para actividades, preferencias del usuario y caché de red.

Notificaciones Nativas: Sistema de gestión de notificaciones integrado para alertar al usuario sobre nuevos códigos o estados del sistema.

Interfaz Ultra-Rápida: Desarrollada con React y Tailwind CSS, optimizada mediante Vite para un rendimiento fluido.

🛠️ Stack Tecnológico
Core: Electron (Framework para aplicaciones de escritorio).

Frontend: React + TypeScript.

Bundler: Vite con integración de Electron.

Estado: Zustand / Custom Stores para la gestión de códigos y preferencias.

Estilos: Tailwind CSS (Diseño moderno y responsivo).

Procesos: Comunicación IPC (Inter-Process Communication) segura entre el Main y el Preload/Renderer.

🏗️ Estructura del Proyecto
El proyecto está organizado siguiendo los estándares de seguridad de Electron:

Plaintext

├── electron/           # Proceso Principal (Main Process)
│   ├── core/           # Lógica del sistema (DB, HTTP, Logger, Env)
│   ├── ipc/            # Definición de canales de comunicación IPC
│   ├── repos/          # Capa de acceso a datos (Persistencia local)
│   └── services/       # Servicios de negocio (Codes, Scheduler)
├── src/                # Proceso de Renderizado (UI - React)
│   ├── components/     # Componentes de la interfaz (Tablas, Controles)
│   ├── hooks/          # Hooks personalizados para lógica de UI
│   └── store/          # Stores de estado global
└── public/             # Recursos estáticos
🚀 Instalación y Uso
Clonar el repositorio:

Bash

git clone https://github.com/tu-usuario/zzz-codes.git
Instalar dependencias:

Bash

npm install
Ejecutar en modo desarrollo:

Bash

npm run dev
Construir aplicación para producción:

Bash

npm run build
