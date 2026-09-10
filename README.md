# 📅 Sprint Calendar — PWA

> Una aplicación web progresiva (PWA) moderna, rápida y visual para la planificación y visualización de Sprints ágiles con integración a Google Calendar.

🌐 **Demo en vivo**: [https://jfcorobles.github.io/sprintCalendar/](https://jfcorobles.github.io/sprintCalendar/)

---

## ✨ Características Principales

- 🔄 **Cálculo Dinámico de Sprints**: Asignación y coloreado automático de sprints a lo largo de los meses a partir de una fecha de inicio configurable.
- ⏱️ **Duración de Sprint Configurable**: Soporte para sprints de 1, 2, 3 o 4 semanas.
- 📆 **Integración con Google Calendar**: Conéctate mediante Google OAuth 2.0 para visualizar tus eventos del calendario personal o de trabajo directamente sobre los días del sprint.
- 🌓 **Modo Oscuro / Claro**: Tema adaptativo con detección automática de preferencias del sistema y selector manual persistente.
- 📱 **Progressive Web App (PWA)**: Instalable en dispositivos móviles y de escritorio, con soporte para funcionamiento offline mediante Service Workers.
- 🎨 **Diseño Moderno & Glassmorphism**: Interfaz intuitiva y pulida con micro-animaciones, tooltips informativos, modal de detalles de eventos y panel de configuración flotante.
- 💾 **Persistencia Local**: Todas las configuraciones (fecha de inicio, duración, colores de sprint, Client ID de Google) se guardan de forma segura en `localStorage`.
- ⚡ **Sin Dependencias / Zero Build**: Desarrollada en HTML5, CSS3 y Vanilla JavaScript puro. Carga instantánea sin bundlers.

---

## 🚀 Inicio Rápido

### Ejecución Local

No requiere compilación ni instalación de paquetes de Node.js. Puedes usar cualquier servidor HTTP local:

```bash
# Opción 1: Usando npx serve
npx serve .

# Opción 2: Usando Python 3
python -m http.server 3000

# Opción 3: Usando Live Server (extensión de VS Code)
# Simplemente abre index.html con Live Server
```

Abre tu navegador en `http://localhost:3000` (o el puerto indicado).

---

## ⚙️ Configuración de Google Calendar API

Para sincronizar tus eventos de Google Calendar:

1. Ve a la consola de [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un proyecto o selecciona uno existente.
3. Habilita la **Google Calendar API** en *APIs & Services > Library*.
4. Configura la **Pantalla de consentimiento de OAuth** (*APIs & Services > OAuth consent screen*).
5. Crea credenciales de tipo **OAuth Client ID** (*APIs & Services > Credentials*):
   - Tipo de aplicación: **Web application** (Aplicación web).
   - **Orígenes de JavaScript autorizados**:
     - `http://localhost:3000` (para desarrollo local)
     - `https://jfcorobles.github.io` (para producción en GitHub Pages)
6. Copia tu **Client ID** generado.
7. En la app **Sprint Calendar**, abre el modal de **Configuración ⚙️**, ingresa tu **Client ID** y presiona **Conectar Google Calendar**.

---

## 📁 Estructura del Proyecto

```text
sprintCalendar/
├── index.html              # Interfaz principal de la aplicación
├── manifest.json           # Manifiesto de PWA (instalación e iconos)
├── sw.js                   # Service Worker para caché y soporte offline
├── css/
│   ├── design-system.css   # Tokens de diseño, variables de color y temas
│   ├── layout.css          # Estructura del calendario, header y controles
│   ├── components.css      # Botones, modales, chips de eventos y leyendas
│   ├── animations.css      # Animaciones de transición y estados interactivos
│   └── main.css            # Estilos globales y utilidades
├── js/
│   ├── app.js              # Controlador principal y ciclo de vida
│   ├── calendar.js         # Renderizado de la cuadrícula mensual
│   ├── sprint.js           # Lógica y matemáticas de cálculo de sprints
│   ├── google-auth.js      # Autenticación con Google Identity Services (GIS)
│   ├── google-calendar.js  # Peticiones a la API de Google Calendar v3
│   ├── modal.js            # Controladores para modales y diálogos
│   ├── theme.js            # Gestión de temas claro/oscuro
│   └── storage.js          # Helpers de persistencia en localStorage
├── icons/                  # Iconos PWA (192x192 y 512x512)
├── docs/                   # Documentación de arquitectura, PRD y diseño
└── agents/                 # Especificaciones de roles y prompts de desarrollo
```

---

## 🌐 Despliegue en GitHub Pages

Este proyecto está optimizado para ejecutarse directamente desde GitHub Pages:

1. El repositorio está configurado para desplegar desde la rama `main` en la raíz `/`.
2. Acceso público: [https://jfcorobles.github.io/sprintCalendar/](https://jfcorobles.github.io/sprintCalendar/)

---

## 🛠️ Tecnologías Utilizadas

- **HTML5 Semántico**: Estructura accesible y optimizada.
- **CSS3 Moderno**: CSS Variables (Design Tokens), Flexbox, CSS Grid, Glassmorphism.
- **JavaScript ES6+**: Módulos nativos, Async/Await, Web APIs.
- **Service Worker & Web App Manifest**: Estándares PWA.
- **Google Identity Services (GIS) & Google Calendar API v3**.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Siéntete libre de utilizarlo y adaptarlo a tus necesidades de equipo.
