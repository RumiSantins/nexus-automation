const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const promptPath = path.join(__dirname, 'prompt_demo.md');

// In-memory chat history for web prototyping
const chatHistories = {};
const closedChats = {};

// Map of image triggers to public URLs
const WEB_IMAGES = {
    'lotes_promo': '/images/lotes_promo.jpg',
    'plano_lotes': '/images/plano_lotes.jpg',
    'vista_panoramica': '/images/vista_panoramica.jpg',
    'casa_campo': '/images/lotes_promo.jpg',
    'portico_ingreso': '/images/lotes_promo.jpg',
    'areas_verdes': '/images/vista_panoramica.jpg',
    'mapa_referencial': '/images/plano_lotes.jpg',
    'lotes_delimitados': '/images/lotes_promo.jpg'
};

app.post('/api/chat', async (req, res) => {
    const { message, sessionId = 'default' } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const cleanMsg = message.trim().toLowerCase();

    // Reset command for web simulator
    if (['!reset', '!demo', '!reiniciar', '!limpiar'].includes(cleanMsg)) {
        delete chatHistories[sessionId];
        delete closedChats[sessionId];
        return res.json({ 
            reply: 'El historial de demostracion ha sido reiniciado exitosamente. ¡Puedes comenzar una nueva prueba!',
            data: null 
        });
    }

    if (closedChats[sessionId]) {
        return res.json({ 
            reply: 'Esta conversacion ya fue cualificada y derivada a una asesora. Escribe !reset para probar de nuevo.',
            data: null 
        });
    }

    try {
        const systemPrompt = fs.readFileSync(promptPath, 'utf8');
        if (!chatHistories[sessionId]) {
            chatHistories[sessionId] = [];
        }

        let contents = chatHistories[sessionId].map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));
        
        contents.push({ role: 'user', parts: [{ text: message }] });

        const reply = await (async function generateGeminiResponse() {
            const modelsToTry = ['gemini-2.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.0-flash'];
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
                        console.warn(`[REINTENTO WEB] Modelo ${modelName} tuvo demanda alta (${err.status || 503}). Reintentando...`);
                        await new Promise(r => setTimeout(r, 800));
                    }
                }
            }
            throw lastError;
        })();

        // Save to history
        chatHistories[sessionId].push({ role: 'user', text: message });
        chatHistories[sessionId].push({ role: 'assistant', text: reply });

        // Check if reply contains JSON object
        let jsonOutput = null;
        let cleanReply = reply;
        
        const jsonMatch = reply.match(/\{[\s\S]*"lead_status"[\s\S]*\}/);
        if (jsonMatch) {
            try {
                jsonOutput = JSON.parse(jsonMatch[0]);
                if (!jsonOutput.timestamp || jsonOutput.timestamp.includes('ISO_TIMESTAMP')) {
                    jsonOutput.timestamp = new Date().toISOString();
                }
                if (['QUALIFIED', 'REJECTED', 'DESECHADO'].includes(jsonOutput.lead_status)) {
                    closedChats[sessionId] = true;
                }
                cleanReply = reply
                    .replace(/```json[\s\S]*?```/gi, '')
                    .replace(/```[\s\S]*?```/gi, '')
                    .replace(jsonMatch[0], '')
                    .trim();
            } catch (e) {
                console.error("Error parsing JSON from reply", e);
            }
        }

        // Image detection for web UI
        let imageUrl = null;
        const imageMatch = cleanReply.match(/\[ENVIAR_IMAGEN:\s*([a-zA-Z0-9_-]+)\]/i);
        if (imageMatch) {
            const key = imageMatch[1].toLowerCase();
            imageUrl = WEB_IMAGES[key] || WEB_IMAGES['lotes_promo'];
            cleanReply = cleanReply.replace(imageMatch[0], '').trim();
        }

        res.json({ reply: cleanReply, data: jsonOutput, image: imageUrl });

    } catch (error) {
        console.error('Error generating content:', error);
        res.status(500).json({ error: 'Error communicating with AI' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    if (!process.env.GEMINI_API_KEY) {
        console.warn("⚠️ ADVERTENCIA: La variable de entorno GEMINI_API_KEY no está definida.");
    }
});
