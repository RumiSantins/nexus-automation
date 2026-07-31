require('dotenv').config();
const apiKey = process.env.GEMINI_API_KEY;

async function listModels() {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    if (data.models) {
        data.models.forEach(m => console.log(m.name));
    } else {
        console.log(data);
    }
}
listModels();
