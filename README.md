# EgoS AI - Automatización Inmobiliaria
**Versión: 1.0.0**

EgoS AI es un asistente virtual conversacional impulsado por inteligencia artificial (Google Gemini) e integrado nativamente a WhatsApp Business. Está diseñado específicamente para el sector inmobiliario, encargándose de atender, enganchar y cualificar automáticamente a clientes interesados (leads) en proyectos de lotes y bienes raíces.

## Características Principales

- **Integración Nativa a WhatsApp:** Utiliza `whatsapp-web.js` para conectarse a un número real escaneando un código QR, eliminando la necesidad de APIs de terceros o procesos de aprobación de Meta durante la fase de prototipado.
- **IA Conversacional Natural:** Potenciado por **Google Gemini**, EgoS AI no responde como un robot aburrido. Engancha al cliente resaltando el valor del proyecto antes de hacer preguntas de cualificación.
- **Cualificación Automática:** Extrae de manera orgánica 4 datos clave del cliente: *Nombre, Propósito, Plazo de Compra y Modalidad de Pago*.
- **Sistema de Derivación Inteligente:** Una vez cualificado (o rechazado por insultos/off-topic), el bot extrae una "Ficha de Cliente" estructurada en JSON y detiene automáticamente sus respuestas para ahorrar tokens y dar paso a un asesor humano.
- **Protección "Anti-Spam":** Sistema de *debounce* de 4 segundos que acumula los mensajes fragmentados del cliente antes de procesarlos, enviando contextos completos a la IA.
- **Hot-Reloading de Reglas:** El archivo de reglas de negocio (`prompt_demo.md`) se lee en tiempo real. Puedes modificar la personalidad o instrucciones del bot sin reiniciar el servidor.

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

4. **Escanea el Código QR** que aparecerá en tu consola (terminal) utilizando la función "Dispositivos Vinculados" en la aplicación de tu celular (WhatsApp o WhatsApp Business).

5. ¡Listo! El bot comenzará a responder automáticamente los mensajes entrantes.

## Tecnologías Utilizadas

- **Node.js** (Backend)
- **whatsapp-web.js** (Cliente headless de WhatsApp)
- **@google/genai** (Google Gemini AI API)
- **qrcode-terminal** (Generación de QR en consola)
- **dotenv** (Gestión de variables de entorno)

## Archivos Clave
- `whatsapp.js`: Lógica principal de conexión a WhatsApp, *debouncing*, parseo de JSON e integración con Gemini.
- `prompt_demo.md`: El "Cerebro" de la IA. Contiene la personalidad, reglas de negocio y restricciones. (Se lee en tiempo real).
- `presentacion_pitch.md`: Documento estratégico con argumentos comerciales y técnicos para presentaciones ejecutivas.

---
*Desarrollado para demostraciones de automatización de alto impacto comercial.*
