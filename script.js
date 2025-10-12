// Нэвтрэлт систем
let currentUser = null;
let isLoggedIn = false;

// Мэдлэгийн сан - LocalStorage-с ачаалах
let knowledgeBase = JSON.parse(localStorage.getItem('knowledgeBase')) || {
    "сайн уу": "🌟 Сайн уу! Миний сайхан хэрэглэгч! Тавтай морил! 🤗\nБи танд яаж туслах боломжтой вэ?",
    "баярлалаа": "❤️ Баярлалаа! Таны хүндэтгэлд баяртай байна! 🎉",
    "баяртай": "✨ Баяртай! Хүндэтгэсэн ярилцлагад баярлалаа! Дараа дахин уулзацгаая! 🌈",
    "чи хэн бэ": "🚀 Би бол таны AI туслах! Би танд:\n• Асуултанд хариулах\n• Шинэ мэдлэг нэмэх\n• Ярилцах боломжтой!",
    "юу хийж чадах вэ": "🎯 Би маш олон зүйл хийж чадна:\n• Асуултанд хариулах\n• Шинэ мэдлэг сурах\n• Ярилцах\n• Таньд туслах\nТа юу хүсэж байна вэ? 😊",
    "хэл": "💬 Би Монгол, Англи хэлээр ярилцах боломжтой!",
    "тусламж": "🆘 Тусламж:\n- Асуулт асуух\n- 'мэдлэг нэмэх' гэж бичих\n- 'статистик' харах\n- 'цэвэрлэх' гэж бичих",
    "үг": "📚 Би Монгол үсгийг бүрэн дэмждэг! Ү, ү, Ө, ө, Ң, ң зэрэг бүх үсэг ажиллана!"
};

// API Key - LocalStorage-с ачаалах
let apiKey = localStorage.getItem('apiKey') || '';

// Хувьсагчид
let messageCount = parseInt(localStorage.getItem('messageCount')) || 0;
let knowledgeCount = Object.keys(knowledgeBase).length;
let currentRequestController = null; // Хүсэлтийг зогсоох контроллер

// DOM элементүүд
const loginModal = document.getElementById('loginModal');
const appContainer = document.getElementById('appContainer');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const forgotPassword = document.getElementById('forgotPassword');
const userDisplayName = document.getElementById('userDisplayName');
const logoutBtn = document.getElementById('logoutBtn');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const stopButton = document.getElementById('stopButton');
const messageCountElement = document.getElementById('messageCount');
const knowledgeCountElement = document.getElementById('knowledgeCount');
const userCountElement = document.getElementById('userCount');
const addKnowledgeBtn = document.getElementById('addKnowledgeBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const knowledgeModal = document.getElementById('knowledgeModal');
const closeModal = document.querySelector('.close');
const saveKnowledgeBtn = document.getElementById('saveKnowledgeBtn');
const questionInput = document.getElementById('questionInput');
const answerInput = document.getElementById('answerInput');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKey = document.getElementById('saveApiKey');

// Эхлэх үед нэвтрэлт цонх харуулах
window.addEventListener('DOMContentLoaded', () => {
    // Хэрэглэгч нэвтрээгүй бол нэвтрэлт цонх харуулах
    if (!isLoggedIn) {
        loginModal.style.display = 'block';
        appContainer.style.display = 'none';
    }
    
    // API Key-г тохируулах
    apiKeyInput.value = apiKey;
    
    // Статистик шинэчлэх
    updateStats();
    
    usernameInput.focus();
});

// Нэвтрэх товчлуур
loginBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (username && password) {
        // Энд бодит нэвтрэх логик байх ёстой
        // Одоогоор загвар логик ашиглаж байна
        currentUser = {
            username: username,
            displayName: username.split('@')[0] // Имэйл бол эхний хэсгийг ашиглах
        };
        
        isLoggedIn = true;
        
        // Нэвтрэлт цонх хаах
        loginModal.style.display = 'none';
        appContainer.style.display = 'flex';
        
        // Хэрэглэгчийн нэрийг харуулах
        userDisplayName.textContent = currentUser.displayName;
        
        // Welcome мессеж харуулах
        addSystemMessage(` ⚪ ${currentUser.displayName}⚪  тавтай морил! 
        
Энэхүү систем нь Монгол улсын хиймэл оюун ухаант төрийн системлүү чиглүүлсэн demo хувилбар юм.
 Баруун талын хөнгөвчлөх товчнуудыг ашиглаж ерөнхий мэдээллийг авна уу!`);
        
        messageInput.focus();
    } else {
        alert('Бүртгэлийн дугаар болон нууц үгээ оруулна уу!');
    }
});

// Бүртгүүлэх товчлуур
registerBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (username && password) {
        // Энд бодит бүртгүүлэх логик байх ёстой
        // Одоогоор загвар логик ашиглаж байна
        alert(`Бүртгэл үүсгэх хүсэлт илгээгдлээ! ${username} хаяг руу баталгаажуулах имэйл илгээгдсэн байна.`);
    } else {
        alert('Бүртгэлийн дугаар болон нууц үгээ оруулна уу!');
    }
});

// Нууц үг сэргээх
forgotPassword.addEventListener('click', (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    
    if (username) {
        alert(`${username} хаяг руу нууц үг сэргээх холбоос илгээгдлээ!`);
    } else {
        alert('Бүртгэлийн дугаараа оруулна уу!');
    }
});

// Гарах товчлуур
logoutBtn.addEventListener('click', () => {
    if (confirm('Та системээс гарахдаа итгэлтэй байна уу?')) {
        currentUser = null;
        isLoggedIn = false;
        
        // Нэвтрэлт цонх харуулах
        loginModal.style.display = 'block';
        appContainer.style.display = 'none';
        
        // Хэрэглэгчийн талбаруудыг цэвэрлэх
        usernameInput.value = '';
        passwordInput.value = '';
        
        // Чат цэвэрлэх
        clearChat();
        
        usernameInput.focus();
    }
});

// API Key хадгалах
saveApiKey.addEventListener('click', () => {
    apiKey = apiKeyInput.value.trim();
    localStorage.setItem('apiKey', apiKey);
    addSystemMessage('✅ API Key амжилттай хадгалагдлаа!');
});

// Мессеж илгээх функц
async function sendMessage() {
    const message = messageInput.value.trim();
    if (message === '') return;
    
    addUserMessage(message);
    messageInput.value = '';
    
    // Зогсоох товчлуурыг идэвхжүүлэх
    stopButton.style.display = 'block';
    
    // Бодож байгаа мэт эффект харуулах
    showThinkingIndicator();
    
    // 1-2 секундын саатал нэмэх
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Бодож байгаа мэт эффект нуух
    hideThinkingIndicator();
    
    try {
        // Хүсэлтийн контроллер үүсгэх
        currentRequestController = new AbortController();
        const signal = currentRequestController.signal;
        
        const response = await getResponse(message, signal);
        addBotMessage(response);
    } catch (error) {
        if (error.name === 'AbortError') {
            addSystemMessage('❌ Хүсэлт зогсоогдлоо');
        } else {
            addBotMessage("😅 Уучлаарай, алдаа гарлаа. Дахин оролдоно уу?");
            console.error("Алдаа:", error);
        }
    } finally {
        // Зогсоох товчлуурыг идэвхгүй болгох
        stopButton.style.display = 'none';
        currentRequestController = null;
    }
}

// Зогсоох товчлуур
stopButton.addEventListener('click', () => {
    if (currentRequestController) {
        currentRequestController.abort();
        stopButton.style.display = 'none';
    }
});

// Бодож байгаа мэт эффект харуулах
function showThinkingIndicator() {
    let indicator = document.createElement('div');
    indicator.id = 'thinkingIndicator';
    indicator.className = 'thinking-indicator';
    indicator.innerHTML = `
        <div class="thinking-text">💭 Бодож байна...</div>
        <div class="thinking-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    chatMessages.appendChild(indicator);
    scrollToBottom();
}

// Бодож байгаа мэт эффект нуух
function hideThinkingIndicator() {
    const indicator = document.getElementById('thinkingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// Хэрэглэгчийн мессеж нэмэх
function addUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');
    messageElement.innerHTML = `
        <div>${formatMessage(message)}</div>
        <div class="message-info">👤 ${currentUser.displayName} · ${getCurrentTime()}</div>
    `;
    chatMessages.appendChild(messageElement);
    scrollToBottom();
    messageCount++;
    localStorage.setItem('messageCount', messageCount);
    updateStats();
}

// Ботын мессеж нэмэх
function addBotMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'bot-message', 'streaming-message');
    messageElement.innerHTML = `
        <div class="message-content"></div>
        <div class="message-info">⚪ AI · ${getCurrentTime()}</div>
    `;
    chatMessages.appendChild(messageElement);
    scrollToBottom();
    
    // Үгүүдийг нэг нэгээр нь харуулах
    typewriterEffect(messageElement.querySelector('.message-content'), message);
}

// Систем мессеж нэмэх
function addSystemMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'system-message');
    messageElement.innerHTML = `
        <div>${formatMessage(message)}</div>
        <div class="message-info">⚙️ Систем · ${getCurrentTime()}</div>
    `;
    chatMessages.appendChild(messageElement);
    scrollToBottom();
}

// Үгүүдийг нэг нэгээр нь харуулах эффект
function typewriterEffect(element, text, speed = 20) {
    let i = 0;
    element.innerHTML = '';
    
    const typeInterval = setInterval(() => {
        if (i < text.length) {
            // Дараагийн үгийг нэмэх
            const char = text.charAt(i);
            element.innerHTML += char === '\n' ? '<br>' : char;
            i++;
            scrollToBottom();
        } else {
            clearInterval(typeInterval);
            // Эффект дууссан бол streaming классыг хасах
            element.closest('.message').classList.remove('streaming-message');
        }
    }, speed);
}

// Мессежийг форматлах (шинэ мөрүүдийг хадгалах)
function formatMessage(message) {
    return message.replace(/\n/g, '<br>');
}

// Scroll доош чиглүүлэх
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Одоо цагийг авах
function getCurrentTime() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

// Хариулт авах
async function getResponse(message, signal) {
    const messageLower = message.toLowerCase().trim();
    
    // Тусгай командууд
    if (messageLower === 'статистик' || messageLower === 'stats') {
        return getStats();
    }
    
    if (messageLower === 'цэвэрлэх' || messageLower === 'clear') {
        clearChat();
        return "💬 Чат цэвэрлэгдлээ! 'сайн уу' гэж бичээд эхлүүлээрэй!";
    }
    
    if (messageLower === 'тусламж' || messageLower === 'help') {
        return knowledgeBase['тусламж'] || 'Тусламжийн мэдээлэл олдсонгүй';
    }
    
    // Монгол үсгийн тусгай асуултууд
    if (/[үөң]/.test(messageLower)) {
        if (messageLower.includes('үсэг') || messageLower.includes('үсг')) {
            return "✅ Монгол үсэг бүрэн дэмжигддэг! Ү, ү, Ө, ө, Ң, ң зэрэг бүх үсэг ажиллана! 🎉";
        }
    }
    
    // Мэдлэгийн сангаас хариулт хайх
    if (knowledgeBase[messageLower]) {
        return knowledgeBase[messageLower];
    }
    
    // OpenAI API ашиглан хариулт авах
    if (apiKey) {
        return await getAIResponse(message, signal);
    } else {
        return "🔑 Таньд AI хариулт авахын тулд OpenAI API Key оруулах хэрэгтэй. Баруун талд байрлах 'API Тохиргоо' хэсэгт API Key-ээ оруулна уу.";
    }
}

// OpenAI API ашиглан хариулт авах
async function getAIResponse(message, signal) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Та бол Монгол хэлээр ярилцдаг AI туслах. Монгол үсэг (Ү, ү, Ө, ө, Ң, ң) бүрэн дэмжинэ. Богино, ойлгомжтой хариулт өг.'
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            }),
            signal: signal
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }
        
        return data.choices[0].message.content;
    } catch (error) {
        console.error('API Алдаа:', error);
        throw error;
    }
}

// Статистик авах
function getStats() {
    return `📊 Статистик:\n• Нийт мессеж: ${messageCount}\n• Нийт мэдлэг: ${knowledgeCount}\n• Хэрэглэгч: 1`;
}

// Статистик шинэчлэх
function updateStats() {
    messageCountElement.textContent = messageCount;
    knowledgeCountElement.textContent = knowledgeCount;
    userCountElement.textContent = isLoggedIn ? 1 : 0;
}

// Чат цэвэрлэх
function clearChat() {
    chatMessages.innerHTML = '';
    messageCount = 0;
    localStorage.setItem('messageCount', messageCount);
    updateStats();
}

// Шинэ мэдлэг нэмэх
function addKnowledge() {
    const question = questionInput.value.trim();
    const answer = answerInput.value.trim();
    
    if (question && answer) {
        knowledgeBase[question.toLowerCase()] = answer;
        knowledgeCount++;
        
        // LocalStorage-д хадгалах
        localStorage.setItem('knowledgeBase', JSON.stringify(knowledgeBase));
        
        updateStats();
        
        // Модаль хаах
        knowledgeModal.style.display = 'none';
        questionInput.value = '';
        answerInput.value = '';
        
        // Амжилттай нэмсэн мэдээлэл өгөх
        addSystemMessage("✅ Шинэ мэдлэг амжилттай нэмэгдлээ! 🎉");
    } else {
        alert('Асуулт болон хариултыг бөглөнө үү!');
    }
}

// Үйлдэлд event listener үүсгэх
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Хурдан товчлуурууд
document.querySelectorAll('.quick-btn').forEach(button => {
    if (button.id !== 'addKnowledgeBtn' && button.id !== 'clearChatBtn') {
        button.addEventListener('click', () => {
            messageInput.value = button.getAttribute('data-command');
            sendMessage();
        });
    }
});

// Мэдлэг нэмэх товчлуур
addKnowledgeBtn.addEventListener('click', () => {
    knowledgeModal.style.display = 'block';
    questionInput.focus();
});

// Чат цэвэрлэх товчлуур
clearChatBtn.addEventListener('click', () => {
    clearChat();
    addSystemMessage("💬 Чат цэвэрлэгдлээ! 'сайн уу' гэж бичээд эхлүүлээрэй!");
});

// Модаль хаах
closeModal.addEventListener('click', () => {
    knowledgeModal.style.display = 'none';
});

// Модаль гадна дээр дархад хаах
window.addEventListener('click', (e) => {
    if (e.target === knowledgeModal) {
        knowledgeModal.style.display = 'none';
    }
});

// Мэдлэг нэмэх хадгалах товчлуур
saveKnowledgeBtn.addEventListener('click', addKnowledge);

// Enter дарж модал дотор хадгалах
questionInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        answerInput.focus();
        e.preventDefault();
    }
});

answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        addKnowledge();
        e.preventDefault();
    }
});