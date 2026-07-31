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

// Read the prompt file
const promptPath = path.join(__dirname, 'prompt_demo.md');

// In-memory chat history for simple prototyping (in production, use a DB)
const chatHistories = {};

app.post('/api/chat', async (req, res) => {
    const { message, sessionId = 'default' } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        // Leer el prompt actualizado en cada mensaje para evitar reiniciar el servidor
        const systemPrompt = fs.readFileSync(promptPath, 'utf8');
        if (!chatHistories[sessionId]) {
            chatHistories[sessionId] = [];
        }

        let contents = chatHistories[sessionId].map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));
        
        contents.push({ role: 'user', parts: [{ text: message }] });

        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: contents,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.3,
            }
        });

        const reply = response.text;

        // Save to history
        chatHistories[sessionId].push({ role: 'user', text: message });
        chatHistories[sessionId].push({ role: 'assistant', text: reply });

        // Check if the reply contains a JSON object
        let jsonOutput = null;
        let cleanReply = reply;
        
        const jsonMatch = reply.match(/\{[\s\S]*"lead_status"[\s\S]*\}/);
        if (jsonMatch) {
            try {
                jsonOutput = JSON.parse(jsonMatch[0]);
                if (!jsonOutput.timestamp || jsonOutput.timestamp.includes('ISO_TIMESTAMP')) {
                    jsonOutput.timestamp = new Date().toISOString();
                }
                // Strip JSON string and any markdown code block wrappers
                cleanReply = reply
                    .replace(/```json[\s\S]*?```/gi, '')
                    .replace(/```[\s\S]*?```/gi, '')
                    .replace(jsonMatch[0], '')
                    .trim();
            } catch (e) {
                console.error("Error parsing JSON from reply", e);
            }
        }

        res.json({ reply: cleanReply, data: jsonOutput });

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
