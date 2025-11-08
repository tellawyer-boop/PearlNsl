// =============================================
// Firebase Configuration
// =============================================
const firebaseConfig = {
    apiKey: "AIzaSyAgq5jgH4wXaF67rAgbSEyCUAnl5LEJW_0",
    authDomain: "pearlnsl.firebaseapp.com",
    projectId: "pearlnsl",
    storageBucket: "pearlnsl.firebasestorage.app",
    messagingSenderId: "444781972571",
    appId: "1:444781972571:web:c7875ad9be48bc1f14c37e"
};

// Firebase инициализаци
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// =============================================
// Application State
// =============================================
let currentUser = null;
let isLoggedIn = false;

// Анхны мэдлэгийн сан
const defaultKnowledge = {
    "сайн уу": "🌟 Сайн уу! Миний сайхан хэрэглэгч! Тавтай морил! 🤗\nБи танд яаж туслах боломжтой вэ?",
    "баярлалаа": "❤️ Баярлалаа! Таны хүндэтгэлд баяртай байна! 🎉",
    "баяртай": "✨ Баяртай! Хүндэтгэсэн ярилцлагад баярлалаа! Дараа дахин уулзацгаая! 🌈",
    "чи хэн бэ": "🚀 Би бол таны AI туслах! Би танд:\n• Асуултанд хариулах\n• Шинэ мэдлэг нэмэх\n• Ярилцах боломжтой!",
    "юу хийж чадах вэ": "🎯 Би маш олон зүйл хийж чадна:\n• Асуултанд хариулах\n• Шинэ мэдлэг сурах\n• Ярилцах\n• Таньд туслах\nТа юу хүсэж байна вэ? 😊",
    "хэл": "💬 Би Монгол, Англи хэлээр ярилцах боломжтой!",
    "тусламж": "🆘 Тусламж:\n- Асуулт асуух\n- 'мэдлэг нэмэх' гэж бичих\n- 'статистик' харах\n- 'цэвэрлэх' гэж бичих",
    "үг": "📚 Би Монгол үсгийг бүрэн дэмждэг! Ү, ү, Ө, ө, Ң, ң зэрэг бүх үсэг ажиллана!"
};

// API Key
let apiKey = localStorage.getItem('apiKey') || '';

// Хувьсагчид
let messageCount = parseInt(localStorage.getItem('messageCount')) || 0;
let knowledgeCount = Object.keys(defaultKnowledge).length;
let currentRequestController = null;
let knowledgeBase = { ...defaultKnowledge };

// =============================================
// Firestore Knowledge Management
// =============================================

// Мэдлэгийн сан авах
async function getKnowledgeBase() {
    if (!currentUser) return defaultKnowledge;
    
    try {
        const doc = await db.collection('knowledge').doc(currentUser.uid).get();
        if (doc.exists) {
            const userKnowledge = doc.data();
            knowledgeCount = Object.keys(userKnowledge).length;
            return userKnowledge;
        } else {
            // Шинэ хэрэглэгчид анхны мэдлэг үүсгэх
            await db.collection('knowledge').doc(currentUser.uid).set(defaultKnowledge);
            knowledgeCount = Object.keys(defaultKnowledge).length;
            return defaultKnowledge;
        }
    } catch (error) {
        console.error('Мэдлэг авах алдаа:', error);
        return defaultKnowledge;
    }
}

// Мэдлэг хадгалах
async function saveKnowledge(knowledge) {
    if (!currentUser) return;
    
    try {
        await db.collection('knowledge').doc(currentUser.uid).set(knowledge);
        knowledgeCount = Object.keys(knowledge).length;
        updateStats();
    } catch (error) {
        console.error('Мэдлэг хадгалах алдаа:', error);
    }
}

// =============================================
// DOM Elements
// =============================================
const loginModal = document.getElementById('loginModal');
const appContainer = document.getElementById('appContainer');
const userDisplayName = document.getElementById('userDisplayName');
const userAvatar = document.getElementById('userAvatar');
const logoutBtn = document.getElementById('logoutBtn');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const stopButton = document.getElementById('stopButton');
const messageCountElement = document.getElementById('messageCount');
const knowledgeCountElement = document.getElementById('knowledgeCount');
const userCountElement = document.getElementById('userCount');
const addKnowledgeBtn = document.getElementById('addKnowledgeBtn');
const viewKnowledgeBtn = document.getElementById('viewKnowledgeBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const knowledgeModal = document.getElementById('knowledgeModal');
const viewKnowledgeModal = document.getElementById('viewKnowledgeModal');
const closeModal = document.querySelectorAll('.close');
const saveKnowledgeBtn = document.getElementById('saveKnowledgeBtn');
const questionInput = document.getElementById('questionInput');
const answerInput = document.getElementById('answerInput');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKey = document.getElementById('saveApiKey');
const knowledgeList = document.getElementById('knowledgeList');
const closeKnowledgeModalBtn = document.getElementById('closeKnowledgeModalBtn');
const cancelBtn = document.querySelector('.cancel-btn');

// =============================================
// Firebase Authentication
// =============================================
googleLoginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            handleSuccessfulLogin(user);
        })
        .catch((error) => {
            console.error('Нэвтрэх алдаа:', error);
            alert('Нэвтрэхэд алдаа гарлаа: ' + error.message);
        });
});

logoutBtn.addEventListener('click', () => {
    auth.signOut()
        .then(() => {
            console.log('Амжилттай гарлаа');
            handleLogout();
        })
        .catch((error) => {
            console.error('Гарах алдаа:', error);
        });
});

auth.onAuthStateChanged((user) => {
    if (user) {
        handleSuccessfulLogin(user);
    } else {
        handleLogout();
    }
});

// Амжилттай нэвтрэх
async function handleSuccessfulLogin(user) {
    currentUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL
    };
    
    isLoggedIn = true;
    
    // Firestore-оос мэдлэг авах
    knowledgeBase = await getKnowledgeBase();
    
    loginModal.classList.remove('active');
    appContainer.style.display = 'flex';
    
    userDisplayName.textContent = currentUser.displayName;
    
    if (currentUser.photoURL) {
        userAvatar.src = currentUser.photoURL;
        userAvatar.style.display = 'block';
    }
    
    addSystemMessage(`⚪ ${currentUser.displayName} ⚪ тавтай морил!\n\nЭнэхүү систем нь Монгол улсын хиймэл оюун ухаант төрийн системлүү чиглүүлсэн demo хувилбар юм.\nБаруун талын хөнгөвчлөх товчнуудыг ашиглаж ерөнхий мэдээллийг авна уу!`);
    
    messageInput.focus();
    updateStats();
}

// Гарах
function handleLogout() {
    currentUser = null;
    isLoggedIn = false;
    knowledgeBase = { ...defaultKnowledge };
    knowledgeCount = Object.keys(defaultKnowledge).length;
    
    loginModal.classList.add('active');
    appContainer.style.display = 'none';
    
    userAvatar.style.display = 'none';
    clearChat();
    updateStats();
}

// =============================================
// Application Initialization
// =============================================
window.addEventListener('DOMContentLoaded', () => {
    createParticles();
    apiKeyInput.value = apiKey;
    updateStats();
});

// =============================================
// Background Particles
// =============================================
function createParticles() {
    const container = document.getElementById('particlesContainer');
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 4 + 1;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 5;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;
        
        container.appendChild(particle);
    }
}

// =============================================
// Chat Functionality
// =============================================
function autoGrowTextarea(textarea) {
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = newHeight + 'px';
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (message === '') return;
    
    addUserMessage(message);
    messageInput.value = '';
    autoGrowTextarea(messageInput);
    
    stopButton.style.display = 'block';
    showThinkingIndicator();
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    hideThinkingIndicator();
    
    try {
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
        stopButton.style.display = 'none';
        currentRequestController = null;
    }
}

stopButton.addEventListener('click', () => {
    if (currentRequestController) {
        currentRequestController.abort();
        stopButton.style.display = 'none';
    }
});

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

function hideThinkingIndicator() {
    const indicator = document.getElementById('thinkingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

function addUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');
    messageElement.innerHTML = `
        <div class="message-content">${formatMessage(message)}</div>
        <div class="message-info">👤 ${currentUser.displayName} · ${getCurrentTime()}</div>
    `;
    chatMessages.appendChild(messageElement);
    scrollToBottom();
    messageCount++;
    localStorage.setItem('messageCount', messageCount);
    updateStats();
}

function addBotMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'bot-message', 'streaming-message');
    messageElement.innerHTML = `
        <div class="message-content"></div>
        <div class="message-info">⚪ AI · ${getCurrentTime()}</div>
    `;
    chatMessages.appendChild(messageElement);
    scrollToBottom();
    
    typewriterEffect(messageElement.querySelector('.message-content'), message);
}

function addSystemMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'system-message');
    messageElement.innerHTML = `
        <div class="message-content">${formatMessage(message)}</div>
        <div class="message-info">⚙️ Систем · ${getCurrentTime()}</div>
    `;
    chatMessages.appendChild(messageElement);
    scrollToBottom();
}

function typewriterEffect(element, text, speed = 20) {
    let i = 0;
    element.innerHTML = '';
    
    const typeInterval = setInterval(() => {
        if (i < text.length) {
            const char = text.charAt(i);
            element.innerHTML += char === '\n' ? '<br>' : char;
            i++;
            scrollToBottom();
        } else {
            clearInterval(typeInterval);
            element.closest('.message').classList.remove('streaming-message');
        }
    }, speed);
}

function formatMessage(message) {
    return message.replace(/\n/g, '<br>');
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getCurrentTime() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

// =============================================
// AI Response Handling
// =============================================
async function getResponse(message, signal) {
    const messageLower = message.toLowerCase().trim();
    
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
    
    if (/[үөң]/.test(messageLower)) {
        if (messageLower.includes('үсэг') || messageLower.includes('үсг')) {
            return "✅ Монгол үсэг бүрэн дэмжигддэг! Ү, ү, Ө, ө, Ң, ң зэрэг бүх үсэг ажиллана! 🎉";
        }
    }
    
    if (knowledgeBase[messageLower]) {
        return knowledgeBase[messageLower];
    }
    
    if (apiKey) {
        return await getAIResponse(message, signal);
    } else {
        return "🔑 Таньд AI хариулт авахын тулд OpenAI API Key оруулах хэрэгтэй. Баруун талд байрлах 'API Тохиргоо' хэсэгт API Key-ээ оруулна уу.";
    }
}

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

// =============================================
// Utility Functions
// =============================================
function getStats() {
    return `📊 Статистик:\n• Нийт мессеж: ${messageCount}\n• Нийт мэдлэг: ${knowledgeCount}\n• Хэрэглэгч: 1`;
}

function updateStats() {
    messageCountElement.textContent = messageCount;
    knowledgeCountElement.textContent = knowledgeCount;
    userCountElement.textContent = isLoggedIn ? 1 : 0;
}

function clearChat() {
    chatMessages.innerHTML = '';
    messageCount = 0;
    localStorage.setItem('messageCount', messageCount);
    updateStats();
}

// =============================================
// Knowledge Base Management
// =============================================
async function addKnowledge() {
    const question = questionInput.value.trim();
    const answer = answerInput.value.trim();
    
    if (question && answer) {
        // Шинэ мэдлэг нэмэх
        knowledgeBase[question.toLowerCase()] = answer;
        
        // Firestore-д хадгалах
        await saveKnowledge(knowledgeBase);
        
        knowledgeModal.classList.remove('active');
        questionInput.value = '';
        answerInput.value = '';
        
        addSystemMessage("✅ Шинэ мэдлэг амжилттай нэмэгдлээ! 🎉");
    } else {
        alert('Асуулт болон хариултыг бөглөнө үү!');
    }
}

async function viewKnowledge() {
    knowledgeList.innerHTML = '';
    
    if (Object.keys(knowledgeBase).length === 0) {
        knowledgeList.innerHTML = '<div class="empty-knowledge">Мэдлэгийн сан хоосон байна</div>';
        viewKnowledgeModal.classList.add('active');
        return;
    }
    
    Object.keys(knowledgeBase).forEach(question => {
        const knowledgeItem = document.createElement('div');
        knowledgeItem.className = 'knowledge-item';
        knowledgeItem.innerHTML = `
            <div class="knowledge-question">${question}</div>
            <div class="knowledge-answer">${knowledgeBase[question]}</div>
            <div class="knowledge-actions">
                <button class="knowledge-edit-btn" data-question="${question}">Засах</button>
                <button class="knowledge-delete-btn" data-question="${question}">Устгах</button>
            </div>
        `;
        knowledgeList.appendChild(knowledgeItem);
    });
    
    document.querySelectorAll('.knowledge-edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const question = this.getAttribute('data-question');
            editKnowledge(question);
        });
    });
    
    document.querySelectorAll('.knowledge-delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const question = this.getAttribute('data-question');
            deleteKnowledge(question);
        });
    });
    
    viewKnowledgeModal.classList.add('active');
}

async function editKnowledge(question) {
    knowledgeModal.classList.add('active');
    questionInput.value = question;
    answerInput.value = knowledgeBase[question];
    viewKnowledgeModal.classList.remove('active');
    
    saveKnowledgeBtn.onclick = async function() {
        const newQuestion = questionInput.value.trim();
        const newAnswer = answerInput.value.trim();
        
        if (newQuestion && newAnswer) {
            // Хуучин мэдлэг устгах
            delete knowledgeBase[question];
            // Шинэ мэдлэг нэмэх
            knowledgeBase[newQuestion.toLowerCase()] = newAnswer;
            
            // Firestore-д хадгалах
            await saveKnowledge(knowledgeBase);
            
            knowledgeModal.classList.remove('active');
            questionInput.value = '';
            answerInput.value = '';
            addSystemMessage("✅ Мэдлэг амжилттай засагдлаа! 🎉");
            saveKnowledgeBtn.onclick = addKnowledge;
        } else {
            alert('Асуулт болон хариултыг бөглөнө үү!');
        }
    };
}

async function deleteKnowledge(question) {
    if (confirm(`"${question}" мэдлэгийг устгахдаа итгэлтэй байна уу?`)) {
        delete knowledgeBase[question];
        // Firestore-д хадгалах
        await saveKnowledge(knowledgeBase);
        viewKnowledge();
        addSystemMessage("🗑️ Мэдлэг амжилттай устгагдлаа");
    }
}

// =============================================
// Event Listeners
// =============================================
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('input', function() {
    autoGrowTextarea(this);
});

messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        if (e.shiftKey) {
            return;
        } else {
            e.preventDefault();
            sendMessage();
        }
    }
});

document.querySelectorAll('.quick-btn').forEach(button => {
    if (button.id !== 'addKnowledgeBtn' && button.id !== 'viewKnowledgeBtn' && button.id !== 'clearChatBtn') {
        button.addEventListener('click', () => {
            messageInput.value = button.getAttribute('data-command');
            sendMessage();
        });
    }
});

addKnowledgeBtn.addEventListener('click', () => {
    knowledgeModal.classList.add('active');
    questionInput.focus();
});

viewKnowledgeBtn.addEventListener('click', viewKnowledge);

clearChatBtn.addEventListener('click', () => {
    clearChat();
    addSystemMessage("💬 Чат цэвэрлэгдлээ! 'сайн уу' гэж бичээд эхлүүлээрэй!");
});

closeModal.forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
        this.closest('.modal').classList.remove('active');
    });
});

cancelBtn.addEventListener('click', () => {
    knowledgeModal.classList.remove('active');
});

window.addEventListener('click', (e) => {
    if (e.target === knowledgeModal) {
        knowledgeModal.classList.remove('active');
        saveKnowledgeBtn.onclick = addKnowledge;
    }
    if (e.target === viewKnowledgeModal) {
        viewKnowledgeModal.classList.remove('active');
    }
});

saveKnowledgeBtn.addEventListener('click', addKnowledge);

closeKnowledgeModalBtn.addEventListener('click', () => {
    viewKnowledgeModal.classList.remove('active');
});

saveApiKey.addEventListener('click', () => {
    apiKey = apiKeyInput.value.trim();
    localStorage.setItem('apiKey', apiKey);
    addSystemMessage('✅ API Key амжилттай хадгалагдлаа!');
});

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
