const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

// Inicializar cliente de Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const promptPath = path.join(__dirname, 'prompt_demo.md');

// Historial en memoria por número de teléfono
const chatHistories = {};
const closedChats = {}; // Para no responder más a leads ya cerrados

// Manejo de mensajes múltiples (Debounce)
const pendingMessages = {};
const messageTimeouts = {};

// Inicializar cliente de WhatsApp (guarda sesión localmente para no escanear el QR cada vez)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Generar código QR en consola
client.on('qr', (qr) => {
    console.log('[QR] Escanea este código QR con tu WhatsApp Business para conectar EgoS AI:');
    qrcode.generate(qr, { small: true });
});

// Confirmación de conexión exitosa
client.on('ready', () => {
    console.log('[INFO] ¡EgoS AI está conectado exitosamente a WhatsApp!');
    console.log('[INFO] Esperando mensajes...');
});

// Escuchar mensajes entrantes
client.on('message', async (msg) => {
    // Ignorar mensajes de grupos o estados
    if (msg.isGroupMsg || msg.isStatus) return;

    const userNumber = msg.from;

    // Si el lead ya fue derivado o rechazado, ignoramos para ahorrar tokens
    if (closedChats[userNumber]) {
        console.log(`[IGNORADO] Mensaje de ${userNumber} (Chat ya cerrado)`);
        return;
    }

    const userMessage = msg.body.trim();

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

    // Configurar temporizador de 4 segundos (4000ms)
    messageTimeouts[userNumber] = setTimeout(async () => {
        const fullMessage = pendingMessages[userNumber].text;
        const msgToReply = pendingMessages[userNumber].lastMsgObj;

        // Limpiar para la siguiente interacción
        delete pendingMessages[userNumber];
        delete messageTimeouts[userNumber];

        console.log(`\n[MENSAJE] Completo recibido de ${userNumber}: ${fullMessage}`);

        try {
            // Intentar mostrar "escribiendo..."
            let chat = null;
            try {
                chat = await msgToReply.getChat();
                if (chat) chat.sendStateTyping();
            } catch (e) {
                console.log("No se pudo activar el estado 'escribiendo...', continuando...");
            }

            // Leer el prompt actualizado
            const systemPrompt = fs.readFileSync(promptPath, 'utf8');

            // Inicializar historial si es un usuario nuevo
            if (!chatHistories[userNumber]) {
                chatHistories[userNumber] = [];
            }

            // Preparar contenido para Gemini
            let contents = chatHistories[userNumber].map(histMsg => ({
                role: histMsg.role === 'user' ? 'user' : 'model',
                parts: [{ text: histMsg.text }]
            }));
            
            contents.push({ role: 'user', parts: [{ text: fullMessage }] });

            // Llamar a Gemini
            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash-lite',
                contents: contents,
                config: {
                    systemInstruction: systemPrompt,
                    temperature: 0.3,
                }
            });

            const reply = response.text;

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
                    if (jsonOutput.lead_status === 'QUALIFIED' || jsonOutput.lead_status === 'REJECTED') {
                        closedChats[userNumber] = true;
                    }
                    
                    cleanReply = reply
                        .replace(/```json[\s\S]*?```/gi, '')
                        .replace(/```[\s\S]*?```/gi, '')
                        .replace(jsonMatch[0], '')
                        .trim();
                    
                    // Imprimir la ficha extraída en la consola
                    console.log('\n=============================================');
                    console.log('[LEAD CUALIFICADO] FICHA DEL CLIENTE:');
                    console.log('=============================================');
                    console.log(JSON.stringify(jsonOutput, null, 2));
                    console.log('=============================================\n');

                } catch (e) {
                    console.error("[ERROR] Parseando el JSON de Gemini:", e);
                }
            }

            // Quitar estado "escribiendo..." y enviar respuesta
            if (chat) chat.clearState();
            if (cleanReply) {
                await msgToReply.reply(cleanReply);
                console.log(`[RESPUESTA] Enviada a ${userNumber}`);
            }

        } catch (error) {
            console.error('[ERROR] Al procesar con IA:', error);
            await msgToReply.reply('Lo siento, tuve un problema técnico procesando tu mensaje. ¿Podemos intentarlo de nuevo en un momento?');
        }
    }, 4000); // 4000 milisegundos de espera
});

// Inicializar cliente
client.initialize();
