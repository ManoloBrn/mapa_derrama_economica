# EconHeat 📈🔥

**EconHeat** es una aplicación web interactiva premium diseñada para simular y visualizar la **derrama económica potencial** generada alrededor de eventos masivos (conciertos, partidos de fútbol, festivales) dentro de un radio urbano de búsqueda configurable.

La herramienta utiliza un modelo híbrido de geolocalización que consulta ubicaciones reales de comercios locales (**Oxxos**), alojamientos (**Hoteles**), transporte público (**Estaciones de Metro**), **Restaurantes y Cafeterías**, y **Bares y Pubs** para proyectar el impacto económico a través de un mapa de calor y widgets estadísticos dinámicos.

---

## 🚀 Características Clave

* **Geolocalización Híbrida Real**:
  * **OpenStreetMap (Overpass API)**: Utilizado por defecto de forma gratuita para obtener comercios, hoteles, transporte, restaurantes y bares reales en el mapa.
  * **Google Places API (GCP)**: Integración premium configurable mediante una clave de API ingresada en la interfaz.
* **Mapa de Calor Comercial Dinámico**: Visualiza la densidad de la derrama económica estimada mediante Leaflet y gradientes de calor interactivos.
* **Buscador de Direcciones en Tiempo Real**:
  * Cuadro de búsqueda integrado con autocompletado de sugerencias de direcciones (Nominatim API).
  * Soporte de *debouncing* (retraso inteligente de 450 ms) para optimizar consultas de red y habilitar transiciones de mapa fluidas (`flyTo`).
* **Modelos de Decaimiento Espacial Avanzados**:
  * **Decaimiento Cuadrático**: Aplicado a comercios locales (Oxxos) y locales de entretenimiento nocturno (Bares), simulando que la concurrencia se concentra cerca del epicentro.
  * **Decaimiento Lineal**: Aplicado a transporte público y restaurantes, modelando una disposición mayor de los asistentes a caminar distancias más largas.
* **Sinergia de Tránsito Peatonal**: Incrementa hasta en un +50% la concurrencia y gasto en tiendas de conveniencia (Oxxos) situadas a menos de 300 metros de estaciones de metro.
* **Exclusión del Ingreso del Evento**:
  * Un interruptor (*switch*) premium que permite ocultar el gasto directo del boleto/consumo interno del estadio.
  * Al activarse, la gráfica de dona SVG y los porcentajes recalculan la derrama externa comercial, aislando el impacto sobre los comercios locales.
* **Colocación Manual de Puntos (POIs)**:
  * Agrega comercios, hoteles, estaciones, restaurantes o bares personalizados directamente haciendo clic en el mapa, configurando variables de ticket promedio, habitaciones o flujos diarios.
* **Dashboard Estadístico Robusto**:
  * Widget de Derrama Económica Total animado mediante transiciones numéricas optimizadas a nivel de memoria (inmunes a arrastres rápidos de sliders).
  * Gráfica de dona SVG responsiva con 6 segmentos que ilustra la distribución del impacto.
  * Lista detallada de establecimientos ordenados por impacto, con efectos de hover interactivos cruzados con el mapa.

---

## 🛠️ Stack Tecnológico

* **Núcleo**: HTML5 semántico y Vanilla JavaScript (ES Modules).
* **Estilos**: Vanilla CSS con acabados de **Glassmorphism** oscuro y adaptabilidad móvil (Responsive).
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

### 1. Instalar las dependencias
Descarga Vite y las herramientas del entorno de desarrollo necesarias:
```bash
npm install
```

### 2. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
Al iniciarse, la terminal te mostrará enlaces similares a estos:
* **Local**: `http://localhost:5173/`
* **Network**: `http://192.168.X.X:5173/` (Usa esta dirección para abrir la app en tu celular).

### 3. Compilar para Producción
Para optimizar el código y generar la build final lista para subir a un servidor web estático:
```bash
npm run build
```
Los archivos optimizados se guardarán en la carpeta `dist/`.

### 4. Previsualizar la Compilación
Para probar localmente cómo corre el código final compilado de producción:
```bash
npm run preview
```

---

## 📐 Algoritmo de Estimación Económica

La derrama total se proyecta mediante la suma de seis pilares:

$$\text{Derrama}_{\text{Total}} = \text{Derrama}_{\text{Evento}} + \text{Derrama}_{\text{Oxxos}} + \text{Derrama}_{\text{Hoteles}} + \text{Derrama}_{\text{Transporte}} + \text{Derrama}_{\text{Restaurantes}} + \text{Derrama}_{\text{Bares}}$$

1. **Evento Directo ($D_{\text{evento}}$)**: $\text{Asistencia} \times (\text{Precio Boleto} + \text{Consumo Interno})$.
2. **Oxxos ($D_{\text{oxxos}}$)**: Basado en una tasa de captación y ticket promedio, aplicando un decaimiento cuadrático $(1 - d_i / X)^2$. Si se sitúa a menos de 300m de una estación de metro, se aplica sinergia de tránsito: $1 + 0.5 \times (1 - d_{\text{metro}} / 300)$.
3. **Hoteles ($D_{\text{hoteles}}$)**: Habitaciones ocupadas atribuidas al evento en el radio, multiplicadas por la tarifa y estimando una estadía promedio de 1.5 noches.
4. **Transporte ($D_{\text{transporte}}$)**: Gasto menor diario realizado por asistentes en quioscos/tránsito dentro del radio, con decaimiento lineal basado en la distancia.
5. **Restaurantes ($D_{\text{restaurantes}}$)**: Consumo de alimentos/café estimado por la tasa de captación y ticket promedio, aplicando decaimiento lineal (mayor propensión a caminar por comida).
6. **Bares ($D_{\text{bares}}$)**: Consumo de bebidas y entretenimiento nocturno estimado en un radio cercano, con decaimiento cuadrático (concentrado en las inmediaciones del recinto).
