# Documentación del Prototipo: EgoS AI

## 1. Arquitectura y Funcionamiento Técnico (Para Desarrolladores e IT)

El sistema es una aplicación web ligera basada en una arquitectura Cliente-Servidor clásica, diseñada para validar la interacción del prompt con el modelo fundacional antes de integrarlo a la API oficial de WhatsApp (Meta).

- **Backend (Node.js & Express):** Servidor HTTP que expone una API RESTful (endpoint `/api/chat`). Actúa como capa intermedia (Middleware) entre la interfaz y Google AI.
- **Integración IA (SDK `@google/genai`):** Se utiliza el modelo **`gemini-3.5-flash-lite`**. Se eligió esta versión específica por su bajo *Time-to-First-Token (TTFT)* y alta disponibilidad, lo cual previene errores de sobrecarga (503) y asegura una latencia casi nula, emulando la velocidad de escritura humana.
- **Inyección Dinámica de Contexto (Hot-Reloading):** El archivo `prompt_demo.md` actúa como el *System Instruction* (las reglas base de la IA). El servidor ejecuta `fs.readFileSync` **en tiempo de ejecución** por cada request POST. Esto permite que cualquier cambio en las directrices de negocio se refleje en el siguiente mensaje sin necesidad de reiniciar el proceso de Node.js.
- **Gestión de Estado (Memoria y Context Window):** El servidor mantiene un objeto en memoria (`chatHistories`) mapeado por un `sessionId`. En cada request, se inyecta todo el historial previo en el parámetro `contents` hacia la API de Gemini, permitiendo que la IA mantenga el hilo conversacional.
- **Extracción Estructurada (Parsing por Regex):** El LLM está condicionado por prompt a emitir un bloque de código JSON únicamente cuando el lead está cualificado (Fase 4). El backend utiliza Expresiones Regulares (Regex) para detectar este bloque, extraerlo del texto visible que recibe el usuario, y pasarlo como un objeto de datos puro al frontend.
- **Frontend (Vanilla HTML/CSS/JS):** Interfaz asíncrona (`fetch`) que simula el entorno de WhatsApp y cuenta con un *Developer Panel* que reacciona a la presencia del JSON estructurado devuelto por la API.

---

## 2. Explicación de Negocio (Para Equipo Comercial y Directivos)

Imagina que **EgoS AI** es un nuevo integrante de tu equipo comercial. Nunca duerme, responde en un segundo y puede atender a mil clientes de WhatsApp al mismo tiempo.

**¿Cómo funciona la mente de EgoS AI?**
Le entregamos un "Manual de Empleado" (el archivo de instrucciones que estuvimos editando). Ahí le decimos qué vender (lotes en el Sur), qué tono usar (100% formal, sin caritas) y le dejamos clara su misión: **él no debe cerrar la venta, su objetivo es filtrar a los curiosos y entregarle clientes reales, listos para comprar, a las asesoras humanas.**

**El paso a paso de la conversación:**
1. **El Saludo Inmediato:** Cuando un cliente llega desde un anuncio de Facebook o Instagram, EgoS lo recibe y responde su primera duda de inmediato para engancharlo.
2. **La Charla (Cualificación Invisible):** EgoS está entrenado para no parecer un robot haciendo un cuestionario policial. Charla de forma natural, pero de manera estratégica va llevando la conversación para descubrir **4 datos de oro**: 
   - El nombre de la persona.
   - Si busca el terreno para vivir o como inversión.
   - Si tiene dinero en efectivo (contado) o si necesita financiamiento.
   - En qué momento piensa hacer la compra.
3. **El "Pase Gol" (Derivación):** Tan pronto como el cliente revela estos datos, el bot se da cuenta de que es un cliente valioso ("Cualificado"). En ese momento, EgoS finaliza su parte amablemente diciéndole al cliente que una asesora experta (Elizabeth, Ana o Sofía) lo contactará en breve.
4. **La Magia Interna (El Reporte):** Sin que el cliente lo vea (lo que ocurre en el recuadro oscuro de la pantalla), EgoS redacta una ficha técnica perfecta del cliente. En un escenario real de producción, esta ficha le llega automáticamente al celular o CRM de la asesora humana. De esta manera, tu asesora entra a la llamada final sabiendo exactamente qué quiere el cliente y qué capacidad de pago tiene, aumentando drásticamente la tasa de cierre.

---

## 3. Proyección de Costos (Entorno de Producción Real)

Si decides llevar este prototipo a la realidad (conectarlo al WhatsApp oficial de tu empresa), los costos operativos se dividen en 3 pilares principales. La buena noticia es que **no hay costos fijos altos**, todo se paga por uso (Pay-As-You-Go).

### A. WhatsApp Business API (Meta)
WhatsApp cobra por "conversación de 24 horas", no por cada mensaje enviado. 
- **Conversaciones de Servicio (iniciadas por el cliente):** Aproximadamente **$0.01 USD a $0.03 USD** por conversación (dependiendo de tu país en LATAM).
- Si 1,000 personas te escriben al mes consultando por lotes, pagarás a WhatsApp entre $10 y $30 dólares al mes. (Nota: Meta suele regalar las primeras 1,000 conversaciones de servicio al mes).

### B. Cerebro de Inteligencia Artificial (Google Gemini)
El modelo que usamos (`gemini-3.5-flash-lite`) es absurdamente económico, ya que cobra por "Tokens" (fragmentos de palabras).
- **Costo:** ~$0.075 USD por cada 1 millón de tokens de entrada y ~$0.30 USD por 1 millón de salida.
- **En la práctica:** Una conversación completa para cualificar a un cliente de principio a fin consume menos de 1,000 tokens. Podrías calificar a **1,000 clientes reales por menos de $0.50 centavos de dólar** al mes en API de Google.

### C. Infraestructura y Servidor (Backend)
El código de este prototipo necesita vivir en la nube (ej. Google Cloud, AWS, Vercel o Heroku) para estar disponible 24/7.
- **Costo estimado:** Entre **$5.00 y $20.00 USD al mes** para un servidor básico y una base de datos para guardar el historial de chats y conectarlo a tu CRM.

> **Resumen Financiero:** 
> Reemplazar o potenciar tu primer nivel de atención al cliente (filtrar curiosos) para atender **1,000 leads mensuales** te costaría un aproximado de **$20 a $50 dólares al mes** en total de infraestructura y APIs. El retorno de inversión (ROI) es altísimo considerando las horas hombre ahorradas de tus asesoras comerciales, quienes ahora solo se dedicarán a cerrar ventas pre-cualificadas.

---

## 4. Propuesta Comercial (Tiempos y Honorarios de Implementación)

Para llevar este prototipo a un entorno real y de grado de producción (Enterprise), el proyecto requiere una serie de configuraciones avanzadas, aprobaciones de Meta y desarrollo de integraciones.

### A. Tiempos de Desarrollo (Estimado: 3 a 4 semanas)
El proyecto se divide en las siguientes fases:
1. **Semana 1: Setup y Aprobaciones.** Creación de la cuenta en Meta Developer, verificación del negocio comercial, validación del número telefónico y despliegue de la infraestructura en la Nube (AWS/Google Cloud).
   > ⚠️ **Regla de Oro Legal y Financiera:** Todas las cuentas (Meta, Google AI y Servidores) **DEBEN** crearse utilizando el correo y tarjeta de crédito corporativa de la inmobiliaria. La agencia desarrolladora únicamente recibe permisos de "Administrador". Esto garantiza que el cliente sea el dueño absoluto de su número de WhatsApp, facilita la aprobación fiscal de Meta, y deslinda a la agencia de responsabilidades legales si la empresa comete infracciones de Spam.
2. **Semana 2: Desarrollo del Backend y Lógica Core.** Programación del servidor webhooks para escuchar mensajes de WhatsApp, conexión con la API de Google Gemini y perfeccionamiento del *Prompt Engineering* (para evitar que la IA se salga del guion o invente información).
3. **Semana 3: Integración CRM y Base de Datos.** Configuración de la extracción de datos (JSON) para conectarlo automáticamente a hojas de cálculo (Google Sheets) o al CRM oficial de la empresa mediante APIs.
4. **Semana 4: Pruebas (QA) y Despliegue.** Simulación de chats intensivos, corrección de casos borde (ej. cuando el usuario manda audios o se enoja) y lanzamiento oficial.

### B. Honorarios de Agencia / Desarrollo (Estimado)
El valor de mercado para desarrollar una solución integral de Inteligencia Artificial conectada a WhatsApp Business oscila dependiendo de la complejidad de integración con el CRM:

- **Setup e Implementación Única (One-time fee):** Entre **$1,500 USD y $3,500 USD**. Este valor cubre todo el ciclo de desarrollo (Semanas 1 a 4), la arquitectura del código, el afinamiento de la IA y la puesta en marcha.
- **Mantenimiento Mensual (Retainer - Opcional):** Entre **$150 USD y $300 USD al mes**. Este valor es estrictamente por los **honorarios de servicio** (soporte técnico, monitoreo para que no se caiga el sistema, actualizaciones cuando Google saca nuevos modelos de IA, y refinamiento mensual del comportamiento del bot).
  - *Modalidades de Pago (Gastos de API y Servidor):* Existen dos formas de manejar los $20-$50 USD de costos fijos que cobran Google, Meta y la Nube:
    1. **Facturación Directa (Transparente):** Las plataformas de Google y Meta se configuran directamente con la tarjeta de crédito corporativa de tu empresa. El pago del Mantenimiento ($150-$300) es 100% ganancia limpia (honorarios) para la agencia desarrolladora.
    2. **Paquete "Todo Incluido" (Servicio Gestionado):** Para evitar que el cliente lidie con múltiples facturas técnicas, la agencia cobra un solo recibo mensual (ej. $300 USD "Todo Incluido"). La agencia paga los gastos de servidor de su propio bolsillo y se queda con la diferencia como ganancia. *Regla de oro para este modelo:* Se debe incluir un tope (ej. "Incluye hasta 2,000 conversaciones/mes. Conversación extra a $0.10 USD") para proteger la rentabilidad en caso de que una campaña de marketing dispare los chats masivamente.
  - *¿Es un contrato eterno?:* No. Suele ser un contrato renovable (mensual o anual). Si el cliente decide cancelarlo, el bot seguirá funcionando en piloto automático (ya que el cliente paga sus propios servidores). Sin embargo, sin mantenimiento, si WhatsApp cambia su API o Google descontinúa una versión de su IA en un par de años, el sistema eventualmente podría dejar de funcionar hasta contratar una actualización.

---

## 5. Checklist de Viabilidad (Discovery Inicial)

Antes de iniciar el desarrollo (Semana 1), la agencia desarrolladora debe realizar un levantamiento de requerimientos técnicos con la inmobiliaria para asegurar que cuentan con los recursos necesarios. Se deben resolver estas 5 preguntas clave:

1. **El Número de WhatsApp:** ¿Tienen un número telefónico nuevo o exclusivo para conectar el bot? (El número no puede estar activo simultáneamente en la app normal de WhatsApp ni en WhatsApp Business; debe migrarse a la API Oficial).
2. **Verificación Legal en Meta:** ¿La empresa ya tiene su 'Business Manager' de Facebook verificado con documentos legales? (Meta exige el RFC/RUC/NIT o recibos de servicios a nombre de la empresa para habilitar la API sin restricciones).
3. **Ecosistema de Datos (CRM):** ¿Dónde guardan actualmente los datos de sus clientes? (Saber si usan HubSpot, Zoho, Kommo o un simple Google Sheets determinará la complejidad técnica para integrar el JSON de cualificación generado por la IA).
4. **Base de Conocimiento Oficial:** ¿Cuentan con un PDF, brochure o Excel con los precios actualizados, metrajes y reglas de los lotes? (La IA necesita alimentarse de datos oficiales y precisos para no inventar precios ni alucinar beneficios que no existen).
5. **El Protocolo de Derivación (Handoff):** Cuando la IA termine de calificar al cliente y se despida, ¿cómo intervendrán las asesoras humanas? (¿Atenderán desde una plataforma omnicanal como respond.io o simplemente los llamarán por teléfono usando la ficha técnica?).
