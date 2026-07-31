require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const systemPrompt = fs.readFileSync('prompt_demo.md', 'utf8');

async function run() {
    try {
        console.log("Msg 1...");
        const res1 = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: [{ role: 'user', parts: [{text: "Ubicación y Precios de Lotes"}] }],
            config: { systemInstruction: systemPrompt }
        });
        console.log("Res 1:", res1.text);

        console.log("Msg 2...");
        const res2 = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: [
                { role: 'user', parts: [{text: "Ubicación y Precios de Lotes"}] },
                { role: 'model', parts: [{text: res1.text}] },
                { role: 'user', parts: [{text: "Soy Felipe Santillán"}] }
            ],
            config: { systemInstruction: systemPrompt }
        });
        console.log("Res 2:", res2.text);

    } catch(e) {
        console.error(e);
    }
}
run();
