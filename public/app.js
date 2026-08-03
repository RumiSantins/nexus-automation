const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const jsonOutput = document.getElementById('json-output');

// Generar un ID de sesión simple
const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);

function appendMessage(text, sender, imageUrl = null) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    
    let html = `<p>${text}</p>`;
    if (imageUrl) {
        html += `<div class="message-image"><img src="${imageUrl}" alt="Imagen del proyecto" style="max-width:100%; border-radius:8px; margin-top:8px;"></div>`;
    }
    
    messageDiv.innerHTML = html;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('message', 'assistant', 'loading');
    loadingDiv.id = 'loading-indicator';
    loadingDiv.innerText = 'Escribiendo...';
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeLoading() {
    const loadingDiv = document.getElementById('loading-indicator');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

async function sendMessage(text = null) {
    const message = text || userInput.value.trim();
    if (!message) return;

    if (!text) {
        userInput.value = '';
    }

    // Ocultar botones de opciones iniciales si existen
    const optionsDiv = document.querySelector('.options');
    if (optionsDiv) {
        optionsDiv.style.display = 'none';
    }

    appendMessage(message, 'user');
    showLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, sessionId }),
        });

        const data = await response.json();
        
        removeLoading();

        if (data.reply) {
            appendMessage(data.reply, 'assistant', data.image);
        }

        if (data.data) {
            // Se recibió el JSON de calificación
            jsonOutput.innerText = JSON.stringify(data.data, null, 2);
            jsonOutput.style.color = '#50fa7b';
        }

    } catch (error) {
        console.error('Error:', error);
        removeLoading();
        appendMessage('Lo siento, hubo un error al conectar con el servidor.', 'assistant');
    }
}

function sendOption(optionText) {
    sendMessage(optionText);
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}
