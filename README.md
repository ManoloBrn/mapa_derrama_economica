# mapa_derrama_economica 📈🔥

**mapa_derrama_economica** es una aplicación web interactiva premium diseñada para simular y visualizar la **derrama económica potencial** generada alrededor de eventos masivos (conciertos, partidos de fútbol, festivales) dentro de un radio urbano de búsqueda configurable.

La herramienta utiliza un modelo híbrido de geolocalización que consulta ubicaciones reales de comercios locales (**Oxxos**), alojamientos (**Hoteles**), transporte público (**Estaciones de Metro**), **Restaurantes y Cafeterías**, y **Bares y Pubs** para proyectar el impacto económico a través de un mapa de calor y widgets estadísticos dinámicos.

---

## 🛠️ Stack Tecnológico

* **Core**: HTML5 semántico, CSS3 Vanilla con variables CSS (diseño responsivo y acabados oscuros de *Glassmorphism*).
* **Lógica**: Vanilla JavaScript (ES6 Modules) sin frameworks pesados, garantizando tiempos de carga y ejecución ultra veloces.
* **Mapas**: Leaflet (v1.9.4) para el renderizado interactivo de mapas y marcadores.
* **Capa de Calor**: Leaflet.heat (v0.2.0) para visualizar gradientes térmicos de derrama económica.
* **Iconografía**: Lucide Icons cargado dinámicamente.
* **Servidor de Desarrollo & Bundler**: Vite (v5.2.11+) para empaquetado de producción optimizado y recarga en caliente (HMR).

---

## 💻 Requisitos Previos

Para ejecutar y compilar este proyecto de manera local, asegúrate de tener instalado:
* **Node.js**: Versión 18.0 o superior (se recomienda LTS).
* **npm**: Versión 9.0 o superior (instalado automáticamente con Node.js).
* **Navegador Web**: Cualquier navegador moderno con soporte para ES Modules (Chrome, Edge, Firefox, Safari).

---

## 📥 Instalación y Ejecución

Sigue estos pasos en tu terminal para configurar el proyecto localmente:

### 1. Instalar las dependencias
Descarga Vite y las herramientas del entorno de desarrollo necesarias:
```bash
npm install
```

### 2. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
La terminal mostrará los enlaces locales para abrir la aplicación:
* **Local**: `http://localhost:5173/`
* **Network**: `http://192.168.X.X:5173/` (Usa esta dirección para probar el simulador en dispositivos móviles conectados a la misma red WiFi).

### 3. Compilar para Producción
Para compilar y minificar el código antes de subirlo a un servidor web estático:
```bash
npm run build
```
Los archivos optimizados y empaquetados se guardarán en la carpeta `dist/`.

### 4. Previsualizar la Compilación
Para verificar localmente la build de producción final:
```bash
npm run preview
```

---

## 🔑 Claves de API y Permisos Requeridos (Google Cloud)

Por defecto, la aplicación funciona **totalmente gratis y de forma ilimitada** utilizando el cliente de **OpenStreetMap (Overpass API)** para buscar puntos de interés e información geográfica real, con un fallback de simulación offline si el servidor está ocupado o no hay conexión.

Sin embargo, si deseas utilizar la integración premium con **Google Places API** para una precisión máxima y datos comerciales actualizados en tiempo real, deberás ingresar tu API Key en la sección **"Conexión a Datos Reales"** del panel lateral.

### APIs de Google Cloud que debes activar en tu consola:
1. **Maps JavaScript API**: Requerida para cargar el SDK cliente de Google Maps de forma asíncrona.
2. **Places API**: Requerida para realizar las búsquedas de lugares cercanos (`nearbySearch`) de comercios, hoteles, transporte, restaurantes y bares en el radio.

### Permisos y Configuración Necesarios en Google Cloud Console:
* **Facturación Activa (Billing)**: Google requiere que el proyecto de GCP tenga una cuenta de facturación activa vinculada para habilitar las consultas de la Places API, incluso si entran en la cuota gratuita mensual.
* **Restricciones de la API Key (Seguridad Recomendada)**:
  * Restringe la clave de API para que solo pueda realizar llamadas desde el dominio de tu servidor (ej. `localhost` en desarrollo o tu dominio de producción).
  * Restringe la API Key para que solo pueda invocar las librerías de **Maps JavaScript API** y **Places API** en la pestaña de restricciones de API.

---

## 📖 Guía de Uso del Simulador

Una vez abierta la aplicación en tu navegador, puedes interactuar con el simulador siguiendo esta guía de uso paso a paso:

### 1. Configurar la Ubicación del Evento
* **Marcador Interactivos**: Arrastra el pin pulsante central del evento en el mapa a cualquier coordenada. La aplicación recalculará automáticamente la derrama de los comercios a su alrededor.
* **Presets Rápidos**: Usa los botones superiores en la sección 1 para saltar a ubicaciones preconfiguradas: Estadio Azteca, Auditorio Nacional, Estadio BBVA (Monterrey) o Estadio Akron (Guadalajara).
* **Buscador Nominatim**: Escribe una dirección, calle o lugar en la caja de búsqueda (ej. "Reforma", "Zapopan") y selecciona una de las sugerencias autocompletadas para trasladar el evento allí.

### 2. Modificar Parámetros del Evento y Radio
* En la sección 2 del panel lateral, ajusta la **Asistencia Estimada**, el **Precio Promedio del Boleto** y el **Consumo Interno** promedio del recinto.
* Ajusta el **Radio de Búsqueda** (de 200m a 2.5km) para ampliar o reducir el área de cobertura del impacto económico. Al soltar el slider, se consultarán los POIs dentro del nuevo círculo de radio.

### 3. Personalizar Factores Económicos
* Abre los paneles del acordeón en la sección 3 para ajustar el **Ticket Promedio** y la **Tasa de Captación** para cada una de las 5 categorías de comercio (Oxxos, Hoteles, Transporte, Restaurantes, Bares).
* Mover los sliders actualiza las fórmulas matemáticas al vuelo y redibuja la distribución en la gráfica de dona y widgets de manera instantánea.

### 4. Alternar Modos de Visualización del Mapa
* **Mapa de Calor**: Usa el switch "Mapa de Calor Activo" para ocultar o mostrar las manchas térmicas de concentración de dinero.
* **Excluir Ingreso del Evento**: Activa el switch "Excluir Ingreso del Evento" para aislar el gasto directo del boleto/consumo dentro del estadio y analizar exclusivamente cómo se distribuye la derrama sobre los comercios externos de la zona.

### 5. Simular Datos por Negocio (Alta Precisión)
* Activa el switch **"Simular Datos por Negocio (Alta Precisión)"** en el mapa.
* En lugar de multiplicar cada negocio por las constantes promedio globales de los sliders, el sistema simulará valores específicos para cada local individual (ticket de consumo y tasa de captación únicos).
* Podrás ver este nivel de detalle reflejado tanto al pasar el cursor sobre los elementos de la lista en la barra lateral como en los popups interactivos al hacer clic en los marcadores del mapa.

### 6. Añadir Comercios Manualmente
* Haz clic en el botón flotante **"Añadir Punto"** en la esquina inferior derecha del mapa.
* Elige el tipo de establecimiento (Oxxo, Hotel, Metro, Restaurante, Bar), asígnale un nombre y especifica sus parámetros personalizados.
* Haz clic en **"Colocar en Mapa"** y pincha en cualquier parte de la pantalla para ubicar tu nuevo punto de interés, integrándose al instante en el cálculo de derrama de la sesión.
