const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

// Inicializar cliente de Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const promptPath = path.join(__dirname, 'prompt_demo.md');

// Catálogo de imágenes disponibles para envío automático por WhatsApp
const AVAILABLE_IMAGES = {
    'lotes_promo': path.join(__dirname, 'public', 'images', 'lotes_promo.jpg'),
    'plano_lotes': path.join(__dirname, 'public', 'images', 'plano_lotes.jpg'),
    'vista_panoramica': path.join(__dirname, 'public', 'images', 'vista_panoramica.jpg'),
    'casa_campo': path.join(__dirname, 'public', 'images', 'casa_campo.jpg'),
    'portico_ingreso': path.join(__dirname, 'public', 'images', 'portico_ingreso.jpg'),
    'areas_verdes': path.join(__dirname, 'public', 'images', 'areas_verdes.jpg'),
    'mapa_referencial': path.join(__dirname, 'public', 'images', 'mapa_referencial.jpg'),
    'lotes_delimitados': path.join(__dirname, 'public', 'images', 'lotes_delimitados.jpg')
};

// Número corporativo destino para el reenvío automático de Fichas de Clientes (51919191089)
const rawAdvisorPhone = process.env.ADVISOR_PHONE || '51919191089';
const ADVISOR_TARGET_ID = rawAdvisorPhone.endsWith('@c.us') ? rawAdvisorPhone : `${rawAdvisorPhone.replace(/[^0-9]/g, '')}@c.us`;

// Historial en memoria por número de teléfono
const chatHistories = {};
const closedChats = {}; // Para no responder más a leads ya cerrados

// Manejo de mensajes múltiples (Debounce)
const pendingMessages = {};
const messageTimeouts = {};

// Opciones de Puppeteer con detección de Chromium para Termux / Android / Linux
const puppeteerOptions = {
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    ]
};

const possibleChromiumPaths = [
    process.env.CHROMIUM_PATH,
    '/data/data/com.termux/files/usr/bin/chromium',
    '/data/data/com.termux/files/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
].filter(Boolean);

for (const chPath of possibleChromiumPaths) {
    if (fs.existsSync(chPath)) {
        puppeteerOptions.executablePath = chPath;
        console.log(`[INFO] Usando Chromium desde: ${chPath}`);
        break;
    }
}

if (!puppeteerOptions.executablePath && (process.platform === 'android' || fs.existsSync('/data/data/com.termux'))) {
    console.warn('\n[ADVERTENCIA] No se encontro Chromium instalado en Termux.');
    console.warn('Para solucionarlo en tu tablet, ejecuta en Termux:');
    console.warn('  pkg install x11-repo -y && pkg install chromium -y\n');
}

// Inicializar cliente de WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: puppeteerOptions
});

// Generar código QR en consola
client.on('qr', (qr) => {
    console.log('[QR] Escanea este código QR con tu WhatsApp Business para conectar EgoS AI:');
    qrcode.generate(qr, { small: true });
});

// Confirmación de conexión exitosa
client.on('ready', () => {
    console.log('[INFO] ¡EgoS AI está conectado exitosamente a WhatsApp!');
    console.log('[INFO] Esperando mensajes y eventos...');
});

// Escuchar cuando el usuario está escribiendo (composing) o grabando un audio (recording)
client.on('chat_state', async (msg) => {
    try {
        const userNumber = msg.chatId;
        if (closedChats[userNumber]) return;

        if (msg.state === 'composing') {
            console.log(`[ESTADO] El usuario ${userNumber} está escribiendo un mensaje...`);
        } else if (msg.state === 'recording') {
            console.log(`[ESTADO] El usuario ${userNumber} está grabando un audio...`);
        }
    } catch (e) {
        // Evento ignorado si no tiene datos completos
    }
});

// Escuchar mensajes entrantes
client.on('message', async (msg) => {
    // Ignorar mensajes de grupos o estados
    if (msg.isGroupMsg || msg.isStatus) return;

    const userNumber = msg.from;
    const bodyText = (msg.body || '').trim().toLowerCase();

    // Comando especial de demostración para reiniciar el chat en vivo sin reiniciar el servidor
    if (['!reset', '!demo', '!reiniciar', '!limpiar'].includes(bodyText)) {
        delete closedChats[userNumber];
        delete chatHistories[userNumber];
        delete pendingMessages[userNumber];
        if (messageTimeouts[userNumber]) clearTimeout(messageTimeouts[userNumber]);
        delete messageTimeouts[userNumber];
        
        console.log(`\n=============================================`);
        console.log(`[DEMO RESET] Chat reiniciado para ${userNumber}`);
        console.log(`=============================================\n`);
        await msg.reply('El historial de demostracion ha sido reiniciado exitosamente. ¡Puedes comenzar una nueva prueba!');
        return;
    }

    // Si el lead ya fue derivado o rechazado, ignoramos para ahorrar tokens
    if (closedChats[userNumber]) {
        console.log(`[IGNORADO] Mensaje de ${userNumber} (Chat ya cerrado. Usa !reset para probar de nuevo)`);
        return;
    }

    let userMessage = (msg.body || '').trim();

    // Manejo de mensajes multimedia y tipos especiales (stickers, fotos, audios, documentos)
    if (msg.type === 'sticker') {
        userMessage = '[El usuario envió un sticker en WhatsApp]';
    } else if (msg.type === 'image') {
        const caption = (msg.caption || userMessage).trim();
        userMessage = caption ? `[El usuario envió una imagen con el texto: "${caption}"]` : '[El usuario envió una imagen o foto]';
    } else if (msg.type === 'ptt' || msg.type === 'audio') {
        userMessage = '[El usuario envió un mensaje de voz o audio]';
    } else if (msg.type === 'document') {
        const caption = (msg.caption || userMessage).trim();
        userMessage = caption ? `[El usuario envió un documento/PDF con el texto: "${caption}"]` : '[El usuario envió un documento/PDF]';
    } else if (msg.type === 'location') {
        userMessage = '[El usuario compartió su ubicación de WhatsApp]';
    } else if (msg.hasMedia && !userMessage) {
        userMessage = `[El usuario envió un archivo de tipo: ${msg.type}]`;
    }

    if (!userMessage) return;

    // Acumular mensajes
    if (!pendingMessages[userNumber]) {
        pendingMessages[userNumber] = { text: userMessage, lastMsgObj: msg };
    } else {
        pendingMessages[userNumber].text += '\n' + userMessage;
        pendingMessages[userNumber].lastMsgObj = msg;
    }

    // Si ya había un temporizador, lo cancelamos (el usuario sigue escribiendo)
    if (messageTimeouts[userNumber]) {
        clearTimeout(messageTimeouts[userNumber]);
    }

    // Configurar temporizador de 3 segundos (3000ms) tras el último mensaje/evento de escritura
    messageTimeouts[userNumber] = setTimeout(async () => {
        const fullMessage = pendingMessages[userNumber].text;
        const msgToReply = pendingMessages[userNumber].lastMsgObj;

        // Limpiar para la siguiente interacción
        delete pendingMessages[userNumber];
        delete messageTimeouts[userNumber];

        console.log(`\n[MENSAJE] Completo recibido de ${userNumber}: ${fullMessage}`);

        try {
            // Intentar mostrar "escribiendo..." de forma asíncrona y con fallback para IDs @lid
            let chat = null;
            try {
                chat = await msgToReply.getChat();
                if (chat && typeof chat.sendStateTyping === 'function') {
                    await chat.sendStateTyping();
                }
            } catch (e) {
                try {
                    chat = await client.getChatById(userNumber);
                    if (chat && typeof chat.sendStateTyping === 'function') {
                        await chat.sendStateTyping();
                    }
                } catch (e2) {
                    // Ignorado si el protocolo de WhatsApp no soporta presencia en este ID
                }
            }

            // 1. Obtener la información de contacto real para resolver casos de IDs encriptados (@lid)
            let realNumber = userNumber;
            try {
                const contact = await msgToReply.getContact();
                if (contact) {
                    if (contact.number && !contact.number.startsWith('5311')) {
                        realNumber = contact.number;
                    } else if (contact.formattedNumber) {
                        realNumber = contact.formattedNumber;
                    }
                }
                if (realNumber.includes('5311') || realNumber.includes('@lid')) {
                    if (msgToReply._data && msgToReply._data.author && msgToReply._data.author.includes('@c.us')) {
                        realNumber = msgToReply._data.author.replace('@c.us', '');
                    } else if (msgToReply._data && msgToReply._data.from && msgToReply._data.from.includes('@c.us')) {
                        realNumber = msgToReply._data.from.replace('@c.us', '');
                    }
                }
            } catch (e) {
                console.log("[ERROR] No se pudo obtener el contacto real");
            }

            // 2. Huevo de pascua: Saludo especial y EXCLUSIVO para el número 930 291 524
            // Si es este número, mandamos el abrazo y cortamos la ejecución (no se llama a Gemini)
            if (realNumber.includes('930291524') || userNumber.includes('930291524')) {
                await msgToReply.reply("Hola! Primero que nada, EgoS te envía un gran abrazo");
                if (chat) chat.clearState();
                return; // ESTO EVITA QUE GEMINI RESPONDA ALGO MÁS
            }

            // 3. Leer el prompt actualizado
            const systemPrompt = fs.readFileSync(promptPath, 'utf8');

            // 4. Inicializar historial si es un usuario nuevo
            if (!chatHistories[userNumber]) {
                console.log(`[INFO] Nuevo chat iniciado. ID: ${userNumber}, Real Number: ${realNumber}`);
                chatHistories[userNumber] = [];
            }

            // Preparar contenido para Gemini
            let contents = chatHistories[userNumber].map(histMsg => ({
                role: histMsg.role === 'user' ? 'user' : 'model',
                parts: [{ text: histMsg.text }]
            }));
            
            contents.push({ role: 'user', parts: [{ text: fullMessage }] });

            // Función robusta para llamar a Gemini con alternancia de modelos y manejo de cuota
            const reply = await (async function generateGeminiResponse() {
                const modelsToTry = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];
                let lastError = null;

                for (const modelName of modelsToTry) {
                    for (let attempt = 1; attempt <= 2; attempt++) {
                        try {
                            const res = await ai.models.generateContent({
                                model: modelName,
                                contents: contents,
                                config: {
                                    systemInstruction: systemPrompt,
                                    temperature: 0.3,
                                }
                            });
                            if (res && res.text) return res.text;
                        } catch (err) {
                            lastError = err;
                            if (err.status === 429 || (err.message && err.message.includes('Quota exceeded'))) {
                                console.warn(`[CUOTA EXCEDIDA] La clave de API en .env excedió el límite gratuito en ${modelName}.`);
                                break; // Pasar al siguiente modelo o indicar renovación
                            }
                            console.warn(`[REINTENTO] Modelo ${modelName} (${err.status || 503}). Reintentando...`);
                            await new Promise(r => setTimeout(r, 1000));
                        }
                    }
                }
                throw lastError;
            })();

            // Guardar en el historial
            chatHistories[userNumber].push({ role: 'user', text: fullMessage });
            chatHistories[userNumber].push({ role: 'assistant', text: reply });

            // Extraer el JSON si el usuario ha sido cualificado
            let cleanReply = reply;
            let jsonOutput = null;
            
            const jsonMatch = reply.match(/\{[\s\S]*"lead_status"[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    jsonOutput = JSON.parse(jsonMatch[0]);
                    if (!jsonOutput.timestamp || jsonOutput.timestamp.includes('ISO_TIMESTAMP')) {
                        jsonOutput.timestamp = new Date().toISOString();
                    }
                    
                    // Cerrar el chat permanentemente para este número
                    if (['QUALIFIED', 'REJECTED', 'DESECHADO'].includes(jsonOutput.lead_status)) {
                        closedChats[userNumber] = true;
                    }
                    
                    cleanReply = reply
                        .replace(/```json[\s\S]*?```/gi, '')
                        .replace(/```[\s\S]*?```/gi, '')
                        .replace(jsonMatch[0], '')
                        .trim();
                    
                    // Imprimir la ficha extraída en la consola
                    const tag = jsonOutput.lead_status === 'QUALIFIED' ? '[LEAD CUALIFICADO]' : '[LEAD RECHAZADO/DESECHADO]';
                    console.log('\n=============================================');
                    console.log(`${tag} FICHA DEL CLIENTE:`);
                    if (jsonOutput.user_profile) console.log(`Perfil detectado: ${jsonOutput.user_profile}`);
                    if (jsonOutput.lead_priority) console.log(`Prioridad: ${jsonOutput.lead_priority}`);
                    console.log('=============================================');
                    console.log(JSON.stringify(jsonOutput, null, 2));
                    console.log('=============================================\n');

                    // Reenviar automáticamente la Ficha del Cliente al número corporativo (919 191 089)
                    if (ADVISOR_TARGET_ID) {
                        try {
                            const isQualified = jsonOutput.lead_status === 'QUALIFIED';
                            const titleTag = isQualified ? 'FICHA DE LEAD CUALIFICADO' : 'LEAD RECHAZADO / DESECHADO';
                            
                            const displayPhone = (jsonOutput.client_phone && jsonOutput.client_phone.length > 5) 
                                ? jsonOutput.client_phone 
                                : (realNumber.startsWith('5311') ? `+${realNumber} (Chat de WhatsApp directo)` : `+${realNumber}`);
                            
                            let summaryText = `[*${titleTag}*]\n\n`;
                            summaryText += `*Cliente:* ${jsonOutput.client_name || 'No especificado'}\n`;
                            summaryText += `*Telefono:* ${displayPhone}\n`;
                            if (jsonOutput.user_profile) summaryText += `*Perfil:* ${jsonOutput.user_profile}\n`;
                            if (jsonOutput.lead_priority) summaryText += `*Prioridad:* ${jsonOutput.lead_priority}\n`;
                            if (jsonOutput.purpose) summaryText += `*Proposito:* ${jsonOutput.purpose}\n`;
                            if (jsonOutput.timeframe) summaryText += `*Plazo:* ${jsonOutput.timeframe}\n`;
                            if (jsonOutput.payment_method) summaryText += `*Modalidad:* ${jsonOutput.payment_method}\n`;
                            if (jsonOutput.event_preference) summaryText += `*Cita Preferida:* ${jsonOutput.event_preference}\n`;
                            if (jsonOutput.assigned_agent) summaryText += `*Asesora Asignada:* ${jsonOutput.assigned_agent}\n`;
                            if (jsonOutput.observations) summaryText += `*Observaciones:* ${jsonOutput.observations}\n`;
                            if (jsonOutput.reason) summaryText += `*Motivo Rechazo:* ${jsonOutput.reason}\n`;
                            summaryText += `\n*Fecha/Hora:* ${jsonOutput.timestamp}`;

                            await client.sendMessage(ADVISOR_TARGET_ID, summaryText);
                            console.log(`[REENVÍO EXITOSO] Ficha reenviada a la asesora (${ADVISOR_TARGET_ID})`);
                        } catch (fwdErr) {
                            console.error(`[ERROR REENVÍO] No se pudo reenviar la ficha a ${ADVISOR_TARGET_ID}:`, fwdErr);
                        }
                    }

                } catch (e) {
                    console.error("[ERROR] Parseando el JSON de Gemini:", e);
                }
            }

            // Detectar si la IA solicita enviar una imagen del catálogo
            let imageToSend = null;
            const imageMatch = cleanReply.match(/\[ENVIAR_IMAGEN:\s*([a-zA-Z0-9_-]+)\]/i);
            if (imageMatch) {
                const imageKey = imageMatch[1].toLowerCase();
                if (AVAILABLE_IMAGES[imageKey] && fs.existsSync(AVAILABLE_IMAGES[imageKey])) {
                    imageToSend = AVAILABLE_IMAGES[imageKey];
                } else {
                    // Imagen por defecto si no coincide la clave exacta
                    imageToSend = AVAILABLE_IMAGES['lotes_promo'];
                }
                // Remover la etiqueta de la respuesta de texto enviada al usuario
                cleanReply = cleanReply.replace(imageMatch[0], '').trim();
            }

            // Quitar estado "escribiendo..." y enviar respuesta de texto
            if (chat) chat.clearState();
            if (cleanReply) {
                await msgToReply.reply(cleanReply);
                console.log(`[RESPUESTA] Enviada a ${userNumber}`);
            }

            // Enviar la imagen adjunta si fue solicitada por la IA
            if (imageToSend) {
                try {
                    const media = MessageMedia.fromFilePath(imageToSend);
                    await msgToReply.reply(media);
                    console.log(`[IMAGEN ENVIADA] ${path.basename(imageToSend)} enviada a ${userNumber}`);
                } catch (imgErr) {
                    console.error("[ERROR] Al enviar la imagen por WhatsApp:", imgErr);
                }
            }

        } catch (error) {
            console.error('[ERROR] Al procesar con IA:', error);
            await msgToReply.reply('Lo siento, tuve un problema técnico procesando tu mensaje. ¿Podemos intentarlo de nuevo en un momento?');
        }
    }, 3000); // 3000 milisegundos (3 segundos de espera tras dejar de escribir)
});

// Inicializar cliente
client.initialize();
