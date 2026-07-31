require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
    try {
        console.log("Testing generation...");
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: 'Hola',
        });
        console.log("Response:", response.text);
    } catch (e) {
        console.error("Error:", e.message);
        console.error(e);
    }
}
test();
