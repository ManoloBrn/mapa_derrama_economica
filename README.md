# EconHeat 📈🔥

**EconHeat** es una aplicación web interactiva premium diseñada para simular y visualizar la **derrama económica potencial** generada alrededor de eventos masivos (conciertos, partidos de fútbol, festivales) dentro de un radio urbano configurable. 

La herramienta utiliza un modelo híbrido de geolocalización que consulta ubicaciones reales de comercios locales (**Oxxos**), alojamientos (**Hoteles**) y transporte público (**Estaciones de Metro**) para proyectar el impacto económico a través de un mapa de calor y widgets estadísticos dinámicos.

---

## 🚀 Características Clave

* **Geolocalización Híbrida Real**:
  * **OpenStreetMap (Overpass API)**: Utilizado por defecto de forma gratuita para obtener comercios, hoteles y estaciones reales en el mapa.
  * **Google Places API (GCP)**: Integración premium configurable mediante una clave de API ingresada directamente en la interfaz.
* **Mapa de Calor Interactivo**: Visualiza la densidad de la derrama económica mediante Leaflet y gradientes de color dinámicos.
* **Parámetros del Evento Ajustables**: Controla la asistencia estimada, el precio del boleto y el consumo promedio dentro del establecimiento en tiempo real.
* **Modelo de Decaimiento Espacial**: Aplica un decaimiento cuadrático para comercios y lineal para transporte en base a la distancia exacta (en metros) de cada punto al epicentro del evento.
* **Sinergia de Tránsito Peatonal**: Incrementa hasta en un +50% (multiplicador de 1.5x) la concurrencia y gasto en tiendas de conveniencia (Oxxos) situadas a menos de 300 metros de estaciones de metro.
* **Dashboard Estadístico Moderno**:
  * Widget de Derrama Económica Total con animación de aumento numérico.
  * Gráfica de dona SVG responsiva que ilustra la distribución porcentual del impacto.
  * Lista detallada de establecimientos ordenados por impacto individual, con efectos de hover interactivos cruzados con el mapa.
* **Fórmulas Transparentes**: Acordeón explicativo interactivo integrado en el panel lateral que muestra los valores en tiempo real aplicados a cada ecuación.

---

## 🛠️ Stack Tecnológico

* **Núcleo**: HTML5 semántico y Vanilla JavaScript (ES Modules).
* **Estilos**: Vanilla CSS con variables CSS, diseño adaptativo (Mobile & Desktop) y acabados de **Glassmorphism** oscuros.
* **Mapas**: Leaflet (v1.9.4) + Leaflet.heat (v0.2.0).
* **Iconografía**: Lucide Icons.
* **Servidor & Bundler**: Vite (v5.2.11+).

---

## 💻 Requisitos Previos

Asegúrate de tener instalado:
* **Node.js** (versión 18.0 o superior recomendada).
* **npm** (instalado automáticamente junto con Node.js).

---

## 📥 Instalación y Ejecución

Sigue estos sencillos pasos para instalar y ejecutar el simulador localmente:

### 1. Clonar o descargar el repositorio
Si tienes Git configurado:
```bash
git clone <url-del-repositorio>
cd analisis_economico_1
```
*(O simplemente entra al directorio del proyecto descomprimido).*

### 2. Instalar las dependencias
Descarga Vite y las herramientas del entorno de desarrollo necesarias:
```bash
npm install
```

### 3. Iniciar el Servidor de Desarrollo
Corre el servidor de Vite en modo de red local expuesta (para probar el mapa desde tu móvil, tablet u otros dispositivos conectados a tu red WiFi):
```bash
npm run dev
```
Al iniciarse, la terminal te mostrará enlaces similares a estos:
* **Local**: `http://localhost:5173/`
* **Network**: `http://192.168.X.X:5173/` *(Usa esta dirección para abrir la app en tu celular).*

### 4. Compilar para Producción (Opcional)
Para optimizar el código y generar la build final lista para subir a un servidor web estático (como Firebase Hosting, Netlify o Vercel):
```bash
npm run build
```
Los archivos optimizados se guardarán en la carpeta `dist/`.

### 5. Previsualizar la Compilación (Opcional)
Para probar localmente cómo corre el código final compilado de producción:
```bash
npm run preview
```

---

## 📐 Algoritmo de Estimación Económica

La derrama total se proyecta mediante la suma de cuatro pilares:

$$\text{Derrama}_{\text{Total}} = \text{Derrama}_{\text{Evento}} + \text{Derrama}_{\text{Oxxos}} + \text{Derrama}_{\text{Hoteles}} + \text{Derrama}_{\text{Transporte}}$$

1. **Evento Directo**: $\text{Asistencia} \times (\text{Precio Boleto} + \text{Consumo Interno})$
2. **Oxxos / Comercio Local**: Basado en una tasa de captación y ticket promedio, aplicando un decaimiento de tipo cuadrático $(1 - \text{distancia} / \text{Radio})^2$. Si está a menos de 300m de una estación de metro, se multiplica por el factor de Sinergia de Tránsito: $1 + 0.5 \times (1 - \text{distancia\_metro} / 300)$.
3. **Hoteles**: Habitaciones ocupadas atribuidas al evento en un radio $X$, estimando una estadía promedio de 1.5 noches.
4. **Transporte Público**: Proyección del gasto de tránsito menor realizado por asistentes que viajan en metro dentro del radio, con un decaimiento lineal basado en la lejanía al evento.
