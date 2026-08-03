# Guion de Demostración en Vivo: EgoS AI (Para Presentación Ejecutiva)

Este guion ofrece 3 escenarios de prueba listos para ejecutar en vivo durante la reunión o presentación del prototipo ante directivos y equipo comercial.

---

## Preparación Previa (Antes de la Presentación)

1. Iniciar el servidor de WhatsApp en la terminal:
   ```bash
   npm run start:whatsapp
   ```
2. Escanear el código QR con el celular de pruebas (WhatsApp Business).
3. Asegurarse de tener a la vista la consola de la terminal o el proyectado para mostrar la extracción automática de la **Ficha del Cliente (JSON)**.
4. **Comando de reinicio en vivo:** Si durante la prueba necesitas repetir la demostración con el mismo número, simplemente envía el mensaje `!reset` o `!demo` desde el celular y el bot se reiniciará al instante sin apagar el servidor.

---

## Escenario 1: Lead Caliente y Solicitud de Fotos (Demostración de Cierre Rápido y Multimedia)

**Propósito:** Demostrar cómo EgoS AI engancha a un cliente entusiasmado, envía material visual por WhatsApp de forma automática y cualifica en menos de 1 minuto.

* **Mensaje 1 (Cliente):** *"¡Hola! Vi la publicación de los terrenos en la Zona Sur y me interesa mucho. ¿Me pueden mandar fotos y los precios al contado?"*
* **Lo que ocurrirá:**
  - El bot detecta un perfil **Eufórico / Entusiasmado**.
  - Responde entregando el precio promocional desde S/ 15,000 (*Value First*).
  - Envía automáticamente la foto de la publicación (`lotes_promo.jpg`).
  - Realiza la primera pregunta de cualificación (nombre del cliente).
* **Mensaje 2 (Cliente):** *"Mi nombre es Carlos. Busco el lote para construir una casa de campo familiar este fin de semana."*
* **Lo que ocurrirá:**
  - La IA confirma las opciones de eventos guiados los días Martes y Domingos.
  - Pregunta si prefiere modalidad al contado o financiamiento directo.
* **Mensaje 3 (Cliente):** *"Prefiero pago al contado y quiero ir el domingo."*
* **Resultado:**
  - EgoS AI confirma la cita, se despide amablemente y transfiere el caso.
  - En la consola del servidor se genera e imprime la Ficha de Cliente con `lead_priority: "ALTA"` y `user_profile: "Euforico"`.

---

## Escenario 2: Cliente Técnico y Manejo de SUNARP (Demostración de Certeza Legal)

**Propósito:** Demostrar que EgoS AI no es un bot genérico, sino que responde dudas normativas con precisión sobre SUNARP y servicios.

* **Mensaje 1 (Cliente):** *"¿El terreno cuenta con partida independizada en SUNARP y factibilidad de luz y agua?"*
* **Lo que ocurrirá:**
  - El bot responde confirmando que los lotes cuentan con partida registral independizada en SUNARP 100% en regla.
  - Informa sobre la factibilidad de servicios y pide su nombre para enviarle la ficha técnica.
* **Mensaje 2 (Cliente):** *"Soy el Ing. Roberto. ¿Tienen el plano de distribución de los lotes?"*
* **Resultado:**
  - La IA adjunta de inmediato la imagen del plano (`plano_lotes.jpg`).
  - Registra las observaciones técnicas en el campo `observations` de la ficha JSON.

---

## Escenario 3: Cliente Desconfiado o Escéptico (Demostración de Desarme Empático)

**Propósito:** Mostrar cómo la IA responde ante objeciones o frustración con inmobiliarias.

* **Mensaje 1 (Cliente):** *"Ya me cansé de bots que no dicen nada. ¿Es estafa esto de los lotes a 15 mil?"*
* **Lo que ocurrirá:**
  - EgoS AI aplica desarme empático: reconoce la molestia, garantiza la legalidad SUNARP sin presionar por datos personales y ofrece agendar una visita o consultar facilidades de pago directo.

---

## Argumentos Clave para la Presentación

1. **Atención 24/7 sin Horas Hombre:** El filtro inicial ahorra cientos de horas de trabajo a las asesoras comerciales.
2. **Derivación Únicamente con Ficha Completa:** Las asesoras humanas solo reciben llamadas o WhatsApps de leads que ya revelaron presupuesto, plazo y nombre.
3. **Control Absoluto de Negocio (`prompt_demo.md`):** Cualquier cambio de promociones, precios o directrices se puede actualizar en tiempo real sin tocar el código de la aplicación.
4. **Resguardo de Privacidad:** Toda la información procesada por la API de Google Gemini en la modalidad Pay-As-You-Go es 100% privada y protegida por contrato.
