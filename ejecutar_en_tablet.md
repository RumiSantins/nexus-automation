# Guía para Ejecutar y Probar EgoS AI desde una Tablet (Sin Nube)

Si deseas probar o mostrar el prototipo desde tu tablet sin necesidad de desplegar el código en la nube (AWS, Vercel o Heroku), existen 3 métodos prácticos y 100% locales:

---

## Método 1: Red Wi-Fi Local (La opción más rápida y sencilla)

Si tu computadora (donde corre Node.js) y tu tablet están conectadas a la misma red Wi-Fi:

1. **Obtener la IP local de tu computadora:**
   - Abre la terminal (PowerShell) en tu PC y ejecuta: `ipconfig`
   - Busca la dirección "IPv4" de tu adaptador Wi-Fi (ejemplo: `192.168.1.15` o `10.0.0.5`).

2. **Asegurar que el servidor web esté corriendo:**
   - En la terminal de la PC ejecuta:
     ```bash
     npm run start
     ```
     *(Esto iniciará el servidor web en el puerto 3000).*

3. **Abrir en el navegador de la Tablet:**
   - Abre Chrome o Safari en tu tablet y escribe en la barra de direcciones:
     `http://TU_IP_LOCAL:3000` (ejemplo: `http://192.168.1.15:3000`)
   - ¡Listo! Podrás interactuar con el simulador web y ver las respuestas e imágenes directamente desde tu tablet.

---

## Método 2: Túnel Temporal Seguro con Localtunnel / Ngrok (Para acceso desde cualquier lugar)

Si tu tablet no está en el mismo Wi-Fi o deseas probarla usando datos móviles:

1. **Usar Localtunnel (No requiere instalación fija):**
   - Inicia tu servidor en la PC (`npm run start`).
   - En otra pestaña de la terminal ejecuta:
     ```bash
     npx localtunnel --port 3000
     ```
   - La herramienta te devolverá una URL temporal (ejemplo: `https://egos-demo-xxxx.loca.lt`).

2. **Abrir la URL en la Tablet:**
   - Abre esa dirección URL en el navegador de tu tablet. No estás subiendo tu código a la nube; la tablet se conectará directamente a tu computadora mientras la terminal siga abierta.

---

## Método 3: Ejecutar Node.js Nativo DENTRO de la Tablet Android (vía Termux)

Si tienes una tablet Android y deseas que la propia tablet sea el servidor independiente (sin depender de la computadora):

1. **Instalar la aplicación Termux** (desde F-Droid o APK oficial).
2. **Instalar Node.js, npm, Chromium y Git en Termux:**
   ```bash
   pkg update && pkg install nodejs-lts npm chromium git -y
   ```
3. **Traer el proyecto a Termux (Opción A o B):**
   - **Opción A (Si clonas tu repositorio de GitHub `nexus-automation`):**
     ```bash
     git clone https://github.com/RumiSantins/nexus-automation.git
     cd nexus-automation
     ```
   - **Opción B (Si copiaste la carpeta a las descargas de la tablet):**
     ```bash
     termux-setup-storage
     cd ~/storage/downloads/nexus-automation
     ```
4. **Configurar la clave de API en `.env`:**
   ```bash
   echo "GEMINI_API_KEY=tu_clave_de_api_aqui" > .env
   ```
5. **Instalar dependencias omitiendo el script de Puppeteer (usará Chromium nativo):**
   ```bash
   npm install --ignore-scripts
   ```
6. **Ejecutar el bot directamente en la tablet:**
   ```bash
   npm run start:whatsapp
   ```
