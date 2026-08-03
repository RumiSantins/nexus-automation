# EgoS AI - Automatización Inmobiliaria
**Versión: 1.1.0**

EgoS AI es un asistente virtual conversacional impulsado por inteligencia artificial (Google Gemini) e integrado de manera nativa a WhatsApp Business. Está diseñado específicamente para el sector inmobiliario, encargándose de atender, enganchar, calificar automáticamente y enviar material multimedia a clientes interesados (leads) en proyectos de lotes residenciales y de inversión.

## Características Principales

- **Integración Nativa a WhatsApp:** Utiliza `whatsapp-web.js` para conectarse a un número real escaneando un código QR, eliminando la necesidad de APIs de terceros o procesos de aprobación de Meta durante la fase de prototipado.
- **IA Conversacional Natural (Gemini 3.5 Flash Lite):** Potenciado por **Google Gemini**, EgoS AI no responde como un robot aburrido. Engancha al cliente aplicando la regla *Value First* (brinda valor antes de preguntar).
- **Mapeo de 6 Perfiles de Conducta:** Adapta su tono y estrategia en tiempo real según la personalidad del cliente (Impaciente, Enojado/Desconfiado, Curioso, Eufórico, Técnico/Analítico y Disperso).
- **Manejo de Casos Complejos del Sector Inmobiliario:** Responde a preguntas de alta frecuencia (SUNARP, metrajes, inicial, cuotas, servicios, titulación directas) y casos especiales (compradores en el extranjero, retiro de AFP, compras múltiples de manzanas).
- **Envío Automático de Imágenes por WhatsApp:** Despacha fotos del proyecto, planos de distribución y vistas panorámicas mediante etiquetas de control que activan el envío multimedia con `MessageMedia`.
- **Detección Bidireccional de Escritura y Debounce Inteligente (3s):** Detecta cuando el usuario teclea o graba audio para pausar la respuesta, y simula el estado "Escribiendo..." en el WhatsApp del cliente mientras genera la respuesta.
- **Manejo de Stickers, Fotos, Audios y Documentos:** Intercepta contenidos no textuales y genera descripciones contextuales para responder amablemente en lugar de ignorar la interacción.
- **Comando de Reinicio en Vivo (`!reset` o `!demo`):** Permite reiniciar el historial de prueba desde el mismo chat de WhatsApp sin necesidad de apagar o reiniciar el servidor Node.js.
- **Cualificación Automática y Ficha JSON:** Extrae los 4 Datos de Oro del cliente (*Nombre, Propósito, Plazo de Compra y Modalidad de Pago*), nivel de prioridad y observaciones técnicas para derivarlo a la asesora comercial asignada.
- **Hot-Reloading de Reglas:** El archivo de directrices (`prompt_demo.md`) se lee en tiempo real en cada interacción. Permite modificar las promociones o instrucciones sin reiniciar el servidor.

## Instalación y Uso

1. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```

2. Configura tus variables de entorno creando un archivo `.env`:
   ```env
   GEMINI_API_KEY=tu_clave_de_api_aqui
   ```

3. Inicia el servidor de WhatsApp:
   ```bash
   npm run start:whatsapp
   ```

4. **Escanea el Código QR** que aparecerá en tu consola utilizando la función "Dispositivos Vinculados" en WhatsApp.

5. ¡Listo! El bot responderá automáticamente los mensajes entrantes.

## Comandos Útiles de Demostración

- `!reset` o `!demo`: Reinicia el historial y el estado del chat en WhatsApp para permitir una nueva prueba en vivo.

## Documentación del Proyecto

- [`guion_demostracion.md`](file:///c:/apps/DemoAutomatizacion/guion_demostracion.md): Guion de demostración paso a paso con 3 escenarios de prueba preparados para presentaciones ejecutivas.
- [`personalizacion_detallada.md`](file:///c:/apps/DemoAutomatizacion/personalizacion_detallada.md): Documentación completa sobre la matriz de conducta, esquema JSON y reglas de control.
- [`funcionamiento_demo.md`](file:///c:/apps/DemoAutomatizacion/funcionamiento_demo.md): Explicación técnica de arquitectura, modelo de negocio, proyección de costos en producción y propuesta comercial.
- [`presentacion_pitch.md`](file:///c:/apps/DemoAutomatizacion/presentacion_pitch.md): Guion y argumentos comerciales para presentaciones ante directivos.

## Archivos Clave del Código

- `whatsapp.js`: Cliente de WhatsApp Web, *debouncing* (3s), envío de imágenes, parseo de JSON e integración con Gemini.
- `server.js`: Servidor REST Express para el simulador web (`http://localhost:3000`).
- `prompt_demo.md`: El "Cerebro" de la IA. Contiene las reglas de negocio, perfiles y restricciones (se lee en tiempo real).

---
*Desarrollado para demostraciones de automatización de alto impacto comercial.*
