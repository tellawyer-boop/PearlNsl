// =============================================
// Firebase Configuration
// =============================================
const firebaseConfig = {
    apiKey: "AIzaSyAgq5jgH4wXaF67rAgbSEyCUAnl5LEJW_0",
    authDomain: "pearlnsl.firebaseapp.com",
    databaseURL: "https://pearlnsl-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "pearlnsl",
    storageBucket: "pearlnsl.firebasestorage.app",
    messagingSenderId: "444781972571",
    appId: "1:444781972571:web:c7875ad9be48bc1f14c37e"
};

// Firebase инициализаци
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database(); // Realtime Database
const firestore = firebase.firestore(); // Мэдлэгийн сандаа ашиглах

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

// Social State
let socialState = {
    rooms: [],
    friends: [],
    currentRoom: null,
    currentPrivateChat: null,
    activeUsers: 0,
    roomMessageListener: null,
    privateMessageListener: null,
    displayedMessages: new Set(),
    displayedPrivateMessages: new Set()
};

// =============================================
// Firestore Knowledge Management (Хуучин шигээ)
// =============================================

// Мэдлэгийн сан авах
async function getKnowledgeBase() {
    if (!currentUser) return defaultKnowledge;
    
    try {
        const doc = await firestore.collection('knowledge').doc(currentUser.uid).get();
        if (doc.exists) {
            const userKnowledge = doc.data();
            knowledgeCount = Object.keys(userKnowledge).length;
            return userKnowledge;
        } else {
            // Шинэ хэрэглэгчид анхны мэдлэг үүсгэх
            await firestore.collection('knowledge').doc(currentUser.uid).set(defaultKnowledge);
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
        await firestore.collection('knowledge').doc(currentUser.uid).set(knowledge);
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

// Social Chat DOM Elements
const joinPublicChatBtn = document.getElementById('joinPublicChat');
const createRoomBtn = document.getElementById('createRoomBtn');
const friendsChatBtn = document.getElementById('friendsChatBtn');
const roomsModal = document.getElementById('roomsModal');
const createRoomModal = document.getElementById('createRoomModal');
const friendsModal = document.getElementById('friendsModal');
const roomsList = document.getElementById('roomsList');
const friendsList = document.getElementById('friendsList');
const createRoomConfirmBtn = document.getElementById('createRoomConfirmBtn');
const createRoomModalBtn = document.getElementById('createRoomModalBtn');
const roomNameInput = document.getElementById('roomNameInput');
const roomDescriptionInput = document.getElementById('roomDescriptionInput');
const activeUsersElement = document.getElementById('activeUsers');
const roomCountElement = document.getElementById('roomCount');

// Full Screen Chat Elements
const privateChatFullscreen = document.getElementById('privateChatFullscreen');
const roomChatFullscreen = document.getElementById('roomChatFullscreen');
const backToAiFromPrivate = document.getElementById('backToAiFromPrivate');
const backToAiFromRoom = document.getElementById('backToAiFromRoom');
const fullscreenPrivateChatAvatar = document.getElementById('fullscreenPrivateChatAvatar');
const fullscreenPrivateChatFriendName = document.getElementById('fullscreenPrivateChatFriendName');
const fullscreenPrivateChatStatus = document.getElementById('fullscreenPrivateChatStatus');
const fullscreenPrivateChatMessages = document.getElementById('fullscreenPrivateChatMessages');
const fullscreenPrivateMessageInput = document.getElementById('fullscreenPrivateMessageInput');
const fullscreenSendPrivateMessageBtn = document.getElementById('fullscreenSendPrivateMessageBtn');
const fullscreenRoomTitle = document.getElementById('fullscreenRoomTitle');
const fullscreenRoomMemberCount = document.getElementById('fullscreenRoomMemberCount');
const fullscreenRoomChatMessages = document.getElementById('fullscreenRoomChatMessages');
const fullscreenRoomMessageInput = document.getElementById('fullscreenRoomMessageInput');
const fullscreenSendRoomMessageBtn = document.getElementById('fullscreenSendRoomMessageBtn');

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
    
    // Initialize social features
    initializeSocialFeatures();
    
    messageInput.focus();
    updateStats();
}

// Гарах
function handleLogout() {
    currentUser = null;
    isLoggedIn = false;
    knowledgeBase = { ...defaultKnowledge };
    knowledgeCount = Object.keys(defaultKnowledge).length;
    
    // Cleanup listeners
    cleanupChatListeners();
    
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
// Chat Functionality (AI Chat - хуучин шигээ)
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
            delete knowledgeBase[question];
            knowledgeBase[newQuestion.toLowerCase()] = newAnswer;
            
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
        await saveKnowledge(knowledgeBase);
        viewKnowledge();
        addSystemMessage("🗑️ Мэдлэг амжилттай устгагдлаа");
    }
}

// =============================================
// Real-time Chat Functionality
// =============================================

// Initialize Social Features
function initializeSocialFeatures() {
    loadSampleData();
    setupSocialEventListeners();
    setupUserStatus();
    updateSocialStats();
}

// Load Sample Data
function loadSampleData() {
    // Sample rooms
    socialState.rooms = [
        {
            id: '1',
            name: 'Монгол Хэлний Клуб',
            description: 'Монгол хэлний анги',
            admin: currentUser?.uid,
            maxMembers: 50,
            privacy: 'public',
            createdAt: Date.now()
        },
        {
            id: '2', 
            name: 'AI Хөгжүүлэгчид',
            description: 'AI технологийн хөгжүүлэгчид',
            admin: 'admin2',
            maxMembers: 30,
            privacy: 'public',
            createdAt: Date.now()
        },
        {
            id: '3',
            name: 'Гишүүдийн Өрөө',
            description: 'Зөвхөн урилгаар',
            admin: 'admin3',
            maxMembers: 10,
            privacy: 'private',
            createdAt: Date.now()
        }
    ];

    // Sample friends
    socialState.friends = [
        {
            id: 'friend1',
            name: 'Бат',
            email: 'bat@example.com',
            status: 'online',
            lastSeen: Date.now(),
            avatar: 'Б'
        },
        {
            id: 'friend2',
            name: 'Сараа',
            email: 'saraa@example.com',
            status: 'away',
            lastSeen: Date.now() - 300000,
            avatar: 'С'
        },
        {
            id: 'friend3',
            name: 'Тэмүүлэн',
            email: 'temuulen@example.com',
            status: 'offline',
            lastSeen: Date.now() - 3600000,
            avatar: 'Т'
        }
    ];
}

// Setup Event Listeners for Social Features
function setupSocialEventListeners() {
    // Social buttons
    joinPublicChatBtn.addEventListener('click', showRoomsModal);
    createRoomBtn.addEventListener('click', showCreateRoomModal);
    friendsChatBtn.addEventListener('click', showFriendsModal);
    
    // Modal buttons
    createRoomModalBtn.addEventListener('click', showCreateRoomModal);
    createRoomConfirmBtn.addEventListener('click', createNewRoom);
    
    // Full screen chat buttons
    backToAiFromPrivate.addEventListener('click', () => {
        cleanupChatListeners();
        privateChatFullscreen.classList.remove('active');
        appContainer.style.display = 'flex';
    });
    
    backToAiFromRoom.addEventListener('click', () => {
        cleanupChatListeners();
        roomChatFullscreen.classList.remove('active');
        appContainer.style.display = 'flex';
    });
    
    // Full screen chat functionality
    fullscreenSendPrivateMessageBtn.addEventListener('click', sendFullscreenPrivateMessage);
    fullscreenSendRoomMessageBtn.addEventListener('click', sendFullscreenRoomMessage);
    
    // Input enter key listeners
    fullscreenPrivateMessageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendFullscreenPrivateMessage();
        }
    });
    
    fullscreenRoomMessageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendFullscreenRoomMessage();
        }
    });
    
    // Auto-grow textareas
    fullscreenPrivateMessageInput.addEventListener('input', function() {
        autoGrowTextarea(this);
    });
    
    fullscreenRoomMessageInput.addEventListener('input', function() {
        autoGrowTextarea(this);
    });
}

// Show Rooms Modal
function showRoomsModal() {
    renderRoomsList();
    roomsModal.classList.add('active');
}

// Show Create Room Modal
function showCreateRoomModal() {
    roomsModal.classList.remove('active');
    createRoomModal.classList.add('active');
}

// Show Friends Modal
function showFriendsModal() {
    renderFriendsList();
    friendsModal.classList.add('active');
}

// Render Rooms List
function renderRoomsList() {
    roomsList.innerHTML = '';
    
    socialState.rooms.forEach(room => {
        const roomCard = document.createElement('div');
        roomCard.className = 'room-card';
        roomCard.innerHTML = `
            <div class="room-header">
                <div class="room-title">${room.name}</div>
                <div class="room-members">0/${room.maxMembers}</div>
            </div>
            <div class="room-description">${room.description}</div>
            <div class="room-admin">${room.privacy === 'public' ? '🌐 Нээлттэй' : '🔒 Хувийн'}</div>
        `;
        roomCard.addEventListener('click', () => joinRoom(room));
        roomsList.appendChild(roomCard);
    });
}

// Render Friends List
function renderFriendsList() {
    friendsList.innerHTML = '';
    
    socialState.friends.forEach(friend => {
        const friendCard = document.createElement('div');
        friendCard.className = 'friend-card';
        friendCard.innerHTML = `
            <div class="friend-header">
                <div class="friend-name">${friend.name}</div>
                <div class="friend-status ${friend.status}">${getStatusText(friend.status)}</div>
            </div>
            <div class="friend-last-seen">Сүүлд орсон: ${formatLastSeen(friend.lastSeen)}</div>
        `;
        friendCard.addEventListener('click', () => startPrivateChat(friend));
        friendsList.appendChild(friendCard);
    });
}

// Create New Room
async function createNewRoom() {
    const name = roomNameInput.value.trim();
    const description = roomDescriptionInput.value.trim();
    const privacy = document.getElementById('roomPrivacySelect').value;
    const maxMembers = parseInt(document.getElementById('roomMaxMembers').value);
    
    if (!name) {
        alert('Өрөөний нэрийг оруулна уу');
        return;
    }
    
    const roomId = generateId();
    const newRoom = {
        id: roomId,
        name: name,
        description: description,
        admin: currentUser.uid,
        maxMembers: maxMembers,
        privacy: privacy,
        createdAt: Date.now()
    };
    
    try {
        // Save to Realtime Database
        await db.ref(`rooms/${roomId}`).set(newRoom);
        
        // Add to social state
        socialState.rooms.push(newRoom);
        
        createRoomModal.classList.remove('active');
        roomNameInput.value = '';
        roomDescriptionInput.value = '';
        
        addSystemMessage(`✅ "${name}" өрөө амжилттай үүслээ!`);
        showRoomsModal();
    } catch (error) {
        console.error('Өрөө үүсгэх алдаа:', error);
        alert('Өрөө үүсгэхэд алдаа гарлаа');
    }
}

// Join Room with real-time updates
function joinRoom(room) {
    socialState.currentRoom = room;
    roomsModal.classList.remove('active');
    
    fullscreenRoomTitle.textContent = room.name;
    fullscreenRoomMemberCount.textContent = '0';
    
    // Clear previous messages
    fullscreenRoomChatMessages.innerHTML = '';
    
    // Add welcome message
    addFullscreenRoomSystemMessage(`Та "${room.name}" өрөөнд нэгдлээ!`);
    
    // Listen for real-time messages
    setupRoomMessageListener(room.id);
    
    // Show full screen chat
    appContainer.style.display = 'none';
    roomChatFullscreen.classList.add('active');
    fullscreenRoomMessageInput.focus();
}

// Setup real-time message listener for room
function setupRoomMessageListener(roomId) {
    // Clear previous listener
    if (socialState.roomMessageListener) {
        socialState.roomMessageListener();
    }
    
    socialState.roomMessageListener = db.ref(`rooms/${roomId}/messages`)
        .orderByChild('timestamp')
        .on('child_added', (snapshot) => {
            const message = snapshot.val();
            message.id = snapshot.key;
            displayRoomMessage(message);
        });
}

// Display room message
function displayRoomMessage(message) {
    // Check if message already displayed
    if (socialState.displayedMessages.has(message.id)) {
        return;
    }
    
    socialState.displayedMessages.add(message.id);
    
    const messageElement = document.createElement('div');
    const isOwn = message.senderId === currentUser.uid;
    
    messageElement.classList.add('message', isOwn ? 'user-message' : 'social-message');
    
    if (!isOwn) {
        messageElement.innerHTML = `
            <div class="message-sender">
                <div class="sender-avatar">${message.senderName.charAt(0)}</div>
                <div class="sender-name">${message.senderName}</div>
            </div>
            <div class="message-content">${formatMessage(message.text)}</div>
            <div class="message-info">${formatTime(message.timestamp)}</div>
        `;
    } else {
        messageElement.innerHTML = `
            <div class="message-content">${formatMessage(message.text)}</div>
            <div class="message-info">${formatTime(message.timestamp)}</div>
        `;
    }
    
    fullscreenRoomChatMessages.appendChild(messageElement);
    fullscreenRoomChatMessages.scrollTop = fullscreenRoomChatMessages.scrollHeight;
}

// Send message to room
async function sendFullscreenRoomMessage() {
    const messageText = fullscreenRoomMessageInput.value.trim();
    if (!messageText || !socialState.currentRoom) return;
    
    const message = {
        text: messageText,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        timestamp: Date.now(),
        type: 'text'
    };
    
    try {
        const messagesRef = db.ref(`rooms/${socialState.currentRoom.id}/messages`);
        await messagesRef.push(message);
        
        fullscreenRoomMessageInput.value = '';
        autoGrowTextarea(fullscreenRoomMessageInput);
    } catch (error) {
        console.error('Мессеж илгээх алдаа:', error);
        addFullscreenRoomSystemMessage('❌ Мессеж илгээхэд алдаа гарлаа');
    }
}

// Start Private Chat
function startPrivateChat(friend) {
    socialState.currentPrivateChat = friend;
    friendsModal.classList.remove('active');
    
    fullscreenPrivateChatFriendName.textContent = friend.name;
    fullscreenPrivateChatAvatar.textContent = friend.avatar;
    fullscreenPrivateChatStatus.textContent = getStatusText(friend.status);
    fullscreenPrivateChatStatus.className = `friend-status ${friend.status}`;
    
    // Clear previous messages
    fullscreenPrivateChatMessages.innerHTML = '';
    
    // Add welcome message
    addFullscreenPrivateSystemMessage(`Та ${friend.name}-тай хажуу чатад нэгдлээ`);
    
    // Setup real-time private chat
    setupPrivateChatListener(friend.id);
    
    // Show full screen chat
    appContainer.style.display = 'none';
    privateChatFullscreen.classList.add('active');
    fullscreenPrivateMessageInput.focus();
}

// Setup real-time private chat listener
function setupPrivateChatListener(friendId) {
    // Clear previous listener
    if (socialState.privateMessageListener) {
        socialState.privateMessageListener();
    }
    
    const chatId = generateChatId(currentUser.uid, friendId);
    
    socialState.privateMessageListener = db.ref(`privateChats/${chatId}/messages`)
        .orderByChild('timestamp')
        .on('child_added', (snapshot) => {
            const message = snapshot.val();
            message.id = snapshot.key;
            displayPrivateMessage(message);
        });
}

// Display private message
function displayPrivateMessage(message) {
    // Check if message already displayed
    if (socialState.displayedPrivateMessages.has(message.id)) {
        return;
    }
    
    socialState.displayedPrivateMessages.add(message.id);
    
    const messageElement = document.createElement('div');
    const isOwn = message.senderId === currentUser.uid;
    
    messageElement.classList.add('message', isOwn ? 'user-message' : 'social-message');
    
    if (!isOwn) {
        messageElement.innerHTML = `
            <div class="message-sender">
                <div class="sender-avatar">${message.senderName.charAt(0)}</div>
                <div class="sender-name">${message.senderName}</div>
            </div>
            <div class="message-content">${formatMessage(message.text)}</div>
            <div class="message-info">${formatTime(message.timestamp)}</div>
        `;
    } else {
        messageElement.innerHTML = `
            <div class="message-content">${formatMessage(message.text)}</div>
            <div class="message-info">${formatTime(message.timestamp)}</div>
        `;
    }
    
    fullscreenPrivateChatMessages.appendChild(messageElement);
    fullscreenPrivateChatMessages.scrollTop = fullscreenPrivateChatMessages.scrollHeight;
}

// Send private message
async function sendFullscreenPrivateMessage() {
    const messageText = fullscreenPrivateMessageInput.value.trim();
    if (!messageText || !socialState.currentPrivateChat) return;
    
    const message = {
        text: messageText,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        timestamp: Date.now(),
        type: 'text'
    };
    
    const chatId = generateChatId(currentUser.uid, socialState.currentPrivateChat.id);
    
    try {
        const messagesRef = db.ref(`privateChats/${chatId}/messages`);
        await messagesRef.push(message);
        
        fullscreenPrivateMessageInput.value = '';
        autoGrowTextarea(fullscreenPrivateMessageInput);
    } catch (error) {
        console.error('Хувийн мессеж илгээх алдаа:', error);
        addFullscreenPrivateSystemMessage('❌ Мессеж илгээхэд алдаа гарлаа');
    }
}

// Utility Functions for Social Features
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function generateChatId(userId1, userId2) {
    const ids = [userId1, userId2].sort();
    return ids[0] + '_' + ids[1];
}

function getStatusText(status) {
    const statusMap = {
        'online': 'онлайн',
        'offline': 'оффлайн',
        'away': 'завгүй'
    };
    return statusMap[status] || status;
}

function formatLastSeen(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'саяхан';
    if (minutes < 60) return `${minutes} мин`;
    if (hours < 24) return `${hours} цаг`;
    return `${Math.floor(hours / 24)} хоног`;
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time only
    if (date.toDateString() === now.toDateString()) {
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // If yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return `Өчигдөр ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Otherwise show full date
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// Online status management
function setupUserStatus() {
    if (!currentUser) return;
    
    // Set user online
    const userStatusRef = db.ref(`onlineUsers/${currentUser.uid}`);
    userStatusRef.set({
        name: currentUser.displayName,
        status: 'online',
        lastSeen: Date.now(),
        avatar: currentUser.displayName.charAt(0)
    });
    
    // Update status when disconnected
    userStatusRef.onDisconnect().set({
        name: currentUser.displayName,
        status: 'offline',
        lastSeen: Date.now(),
        avatar: currentUser.displayName.charAt(0)
    });
    
    // Listen for online users count
    db.ref('onlineUsers')
        .orderByChild('status')
        .equalTo('online')
        .on('value', (snapshot) => {
            const onlineUsers = snapshot.val();
            const onlineCount = onlineUsers ? Object.keys(onlineUsers).length : 0;
            activeUsersElement.textContent = onlineCount;
        });
}

// System messages for fullscreen chats
function addFullscreenRoomSystemMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'system-message');
    messageElement.innerHTML = `
        <div class="message-content">${formatMessage(message)}</div>
        <div class="message-info">⚙️ Систем · ${getCurrentTime()}</div>
    `;
    fullscreenRoomChatMessages.appendChild(messageElement);
    fullscreenRoomChatMessages.scrollTop = fullscreenRoomChatMessages.scrollHeight;
}

function addFullscreenPrivateSystemMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'system-message');
    messageElement.innerHTML = `
        <div class="message-content">${formatMessage(message)}</div>
        <div class="message-info">⚙️ Систем · ${getCurrentTime()}</div>
    `;
    fullscreenPrivateChatMessages.appendChild(messageElement);
    fullscreenPrivateChatMessages.scrollTop = fullscreenPrivateChatMessages.scrollHeight;
}

// Cleanup listeners
function cleanupChatListeners() {
    if (socialState.roomMessageListener) {
        socialState.roomMessageListener();
        socialState.roomMessageListener = null;
    }
    
    if (socialState.privateMessageListener) {
        socialState.privateMessageListener();
        socialState.privateMessageListener = null;
    }
    
    // Clear displayed messages sets
    socialState.displayedMessages.clear();
    socialState.displayedPrivateMessages.clear();
}

function updateSocialStats() {
    activeUsersElement.textContent = socialState.friends.filter(f => f.status === 'online').length;
    roomCountElement.textContent = socialState.rooms.length;
}

// =============================================
// Event Listeners (AI Chat-ийн event listeners)
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
    if (e.target === roomsModal) {
        roomsModal.classList.remove('active');
    }
    if (e.target === createRoomModal) {
        createRoomModal.classList.remove('active');
    }
    if (e.target === friendsModal) {
        friendsModal.classList.remove('active');
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

