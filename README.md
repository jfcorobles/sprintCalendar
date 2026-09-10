# 📅 Sprint Calendar — PWA

> Una aplicación web progresiva (PWA) moderna, rápida y visual para la planificación y visualización de Sprints ágiles con integración bidireccional a Google Calendar.

🌐 **Demo en vivo**: [https://jfcorobles.github.io/sprintCalendar/](https://jfcorobles.github.io/sprintCalendar/)

---

## ✨ Características Principales

### 🏃‍♂️ Planificación y Visualización de Sprints
- **Sprint Centrado Continuo**: El sprint enfocado se renderiza siempre centrado verticalmente en la vista del calendario, garantizando una visualización fluida incluso cuando un sprint abarca el fin de un mes y el inicio del siguiente (con títulos adaptativos como `Septiembre – Octubre 2026`).
- **Duración Configurable**: Soporta sprints de **1, 2, 3 o 4 semanas**.
- **Cálculo Matemático Dinámico**: Calcula automáticamente el número de sprint, fechas de inicio/fin y el día exacto de progreso (*ej. Sprint 12 · Día 3 de 21*).

### 📆 Integración con Google Calendar API v3
- **Google OAuth 2.0 (GIS)**: Conexión con un solo clic utilizando Google Identity Services y persistencia de sesión segura en `localStorage`.
- **Sincronización Bidireccional**: Visualiza tus eventos de Google Calendar sobre la cuadrícula de sprints.
- **Creación de Eventos & "Todo el día"**: Modal integrado para crear eventos con soporte para eventos de todo el día (`start.date`) o con horario específico (`start.dateTime`).
- **Eliminación en Tiempo Real**: Borra eventos directamente desde la app con confirmación y sincronización inmediata con Google Calendar.

### 📱 Experiencia de Usuario Móvil & Detalle
- **📅 Detalle del Día (Day View)**: Al tocar cualquier día del calendario, se abre un desglose completo de la jornada con el indicador de sprint activo, la lista de eventos programados con sus horas y acceso rápido para agregar nuevos eventos.
- **📝 Detalle del Evento (Event Detail)**: Consulta título, horario, ubicación, notas/descripción, enlace directo para abrir en Google Calendar y opción para eliminarlo.
- **Pastillas de Eventos Legibles (Estilo Google Calendar)**: En móviles, los eventos se muestran como etiquetas compactas legibles con texto truncado sin deformar las 7 columnas del calendario.
- **Botón Flotante (`+` FAB)**: Acceso rápido para añadir eventos desde cualquier vista.

### 🎨 Diseño y Tema VS Code Dark+ / Antigravity
- **Fondo Oscuro Profesional**: Paleta basada en VS Code Dark+ (`#1e1e1e` editor, `#252526` superficies, `#007acc` azul de acento, `#4ec9b0` verde azulado para eventos de todo el día).
- **Hover Preciso & Sin Destellos**: Resaltado sutil con bordes inset azules y fondos neutros sin transiciones invasivas.

### ⚡ PWA & Auto-actualizador (Offline First)
- **Instalable en iOS & Android**: Configurada con Web App Manifest y Service Worker (`v4`).
- **Estrategia Network-First con Fallback Offline**: Carga inmediata de la última versión desplegada.
- **Botón "🔄 Actualizar App"**: Integrado en el panel de configuración ⚙️ para limpiar caché y recargar la última versión al instante en iPhones y dispositivos móviles.

---

## 🚀 Inicio Rápido

### Ejecución Local

No requiere Node.js, `npm install` ni compilación previa. Puedes servir la carpeta con cualquier servidor HTTP:

```bash
# Opción 1: Usando npx serve
npx -y serve -l 3000 .

# Opción 2: Usando Python 3
python -m http.server 3000

# Opción 3: Usando Live Server (extensión de VS Code)
# Abrir index.html con "Open with Live Server"
```

Abre tu navegador en `http://localhost:3000`.

---

## ⚙️ Configuración de Google Calendar API

1. Ve a la consola de [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un proyecto o selecciona uno existente (ej. `sprintcalendar`).
3. En **APIs & Services > Library**, busca y habilita la **Google Calendar API**.
4. Configura la **Pantalla de consentimiento de OAuth**:
   - Tipo de usuario: Externo.
   - Scopes: `https://www.googleapis.com/auth/calendar.events` o `https://www.googleapis.com/auth/calendar`.
   - Agrega tu correo en **Test users** si la app está en modo Testing.
5. En **APIs & Services > Credentials**, crea un **OAuth Client ID**:
   - Tipo: **Web application**.
   - **Orígenes de JavaScript autorizados**:
     - `http://localhost:3000` (desarrollo local)
     - `http://localhost:5000`
     - `https://jfcorobles.github.io` (producción en GitHub Pages)
6. El Client ID configurado se conecta automáticamente con la aplicación.

---

## 📁 Estructura del Proyecto

```text
sprintCalendar/
├── index.html              # Estructura principal, modales y auto-actualizador PWA
├── manifest.json           # Manifiesto PWA (iconos, colores y modo standalone)
├── sw.js                   # Service Worker (caché v4, skipWaiting y network-first)
├── css/
│   ├── main.css            # Archivo maestro de importación de estilos
│   ├── design-system.css   # Tokens de diseño (paleta VS Code Dark+, tipografía, radios)
│   ├── layout.css          # Cuadrícula de 7 columnas minmax(0,1fr), header y responsive
│   ├── components.css      # Botones, tarjetas de día, detalle de evento, FAB y badges
│   └── animations.css      # Transiciones y micro-animaciones
├── js/
│   ├── app.js              # Inicializador global y manejadores de eventos
│   ├── calendar.js         # Motor de renderizado centrado de sprints y eventos
│   ├── sprint.js           # Lógica y matemáticas de cálculo de sprints
│   ├── google-auth.js      # Autenticación Google Identity Services (GIS)
│   ├── google-calendar.js  # Integración y llamadas a la API de Google Calendar v3
│   ├── modal.js            # Sistema accesible de gestión de modales
│   ├── theme.js            # Enforzador de modo oscuro
│   └── storage.js          # Helper de persistencia en localStorage
└── icons/                  # Iconos PWA (192x192 y 512x512)
```

---

## 🌐 Despliegue en GitHub Pages

Este proyecto se despliega automáticamente en GitHub Pages mediante GitHub Actions en cada push a la rama `main`:

- **URL de producción**: [https://jfcorobles.github.io/sprintCalendar/](https://jfcorobles.github.io/sprintCalendar/)
- **Workflow**: `.github/workflows/deploy.yml`

---

## 🛠️ Tecnologías Utilizadas

- **HTML5 Semántico**: Accesibilidad nativa con roles ARIA.
- **Vanilla CSS3**: CSS Grid (`minmax(0, 1fr)`), Flexbox, CSS Variables (Design Tokens).
- **Vanilla JavaScript (ES6+)**: Modular, asíncrono, cero dependencias ni bundlers.
- **PWA Standards**: Service Worker API, Web App Manifest, Cache Storage API.
- **Google Cloud APIs**: Google Identity Services (OAuth 2.0) & Google Calendar API v3.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Libre para uso personal o de equipo.
