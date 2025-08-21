// AI Assistant specific functionality

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeAIAssistant();
});

function initializeAIAssistant() {
    setupChatInterface();
    checkAIAccess();
    loadChatHistory();
}

function setupChatInterface() {
    const sendButton = document.getElementById('sendMessage');
    const messageInput = document.getElementById('messageInput');
    
    if (sendButton) {
        sendButton.addEventListener('click', handleSendMessage);
    }
    
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }
}

async function handleSendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    // Check if user is logged in
    if (!window.authSystem || !window.authSystem.isLoggedIn()) {
        showAuthModal('login');
        return;
    }
    
    // Clear input
    messageInput.value = '';
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    
    // Show typing indicator
    showTypingIndicator();
    
    // Process message with real AI API
    try {
        const response = await sendToRealAI(message);
        hideTypingIndicator();
        addMessageToChat(response.response, 'bot');
        
        // Update usage info if provided
        if (response.messagesRemaining !== undefined) {
            updateUsageDisplay(response.messagesRemaining);
        }
    } catch (error) {
        hideTypingIndicator();
        
        if (error.upgradeRequired) {
            showPremiumModal();
        } else {
            addMessageToChat('Sorry, I encountered an error. Please try again.', 'bot');
        }
        console.error('AI processing error:', error);
    }
}

function addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}-message`;
    
    const icon = sender === 'user' ? 'fa-user' : 'fa-robot';
    const timestamp = new Date().toLocaleTimeString();
    
    messageElement.innerHTML = `
        <i class="fas ${icon}"></i>
        <div class="message-content">
            <p>${message}</p>
            <span class="message-time">${timestamp}</span>
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Save to chat history
    saveChatHistory();
}

function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const typingElement = document.createElement('div');
    typingElement.className = 'message bot-message typing-indicator';
    typingElement.id = 'typingIndicator';
    
    typingElement.innerHTML = `
        <i class="fas fa-robot"></i>
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

async function processUserMessage(message) {
    // This is the intelligent AI processing from script.js
    // For now, we'll use a simplified version
    
    const lowerMessage = message.toLowerCase();
    
    // Location handling
    if (lowerMessage.includes('address') || lowerMessage.includes('location')) {
        return "I can help you find stores near your location! Please share your suburb or city in New Zealand, and I'll recommend the closest supermarkets with the best deals.";
    }
    
    // Price queries
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
        return generatePriceResponse(message);
    }
    
    // Store queries
    if (lowerMessage.includes('store') || lowerMessage.includes('supermarket') || lowerMessage.includes('countdown') || lowerMessage.includes('new world')) {
        return generateStoreResponse(message);
    }
    
    // Budget queries
    if (lowerMessage.includes('cheap') || lowerMessage.includes('budget') || lowerMessage.includes('save money')) {
        return "For budget shopping in NZ, I recommend PAK'nSAVE for the lowest prices, followed by Countdown's specials. Would you like specific product recommendations or store locations near you?";
    }
    
    // Luxury queries
    if (lowerMessage.includes('luxury') || lowerMessage.includes('premium') || lowerMessage.includes('expensive')) {
        return "For premium groceries in NZ, check out Farro Fresh for gourmet items, or New World for quality fresh produce. Would you like recommendations for specific luxury products?";
    }
    
    // General greeting
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('kia ora')) {
        return "Kia ora! I'm here to help you find the best grocery deals across New Zealand supermarkets. What can I help you with today?";
    }
    
    // Default response
    return "I can help you compare grocery prices across NZ supermarkets, find budget deals, locate stores near you, and provide shopping recommendations. What would you like to know?";
}

function generatePriceResponse(message) {
    // Sample price data
    const priceData = {
        'banana': { price: '$2.99-$3.99', store: 'PAK\'nSAVE to New World' },
        'milk': { price: '$3.99-$4.50', store: 'PAK\'nSAVE to Four Square' },
        'bread': { price: '$2.50-$3.20', store: 'Countdown to Farro Fresh' },
        'meat': { price: '$7.50-$15.99', store: 'PAK\'nSAVE to New World' },
        'beef': { price: '$8.50-$12.99', store: 'The Mad Butcher to New World' }
    };
    
    // Find relevant item in message
    for (const [item, info] of Object.entries(priceData)) {
        if (message.toLowerCase().includes(item)) {
            return `${item.charAt(0).toUpperCase() + item.slice(1)} prices in NZ range from ${info.price} across stores from ${info.store}. Would you like me to find the cheapest option near your location?`;
        }
    }
    
    return "I can check prices for specific items across NZ supermarkets. Which product are you interested in? For example, try asking about bananas, milk, bread, or meat.";
}

function generateStoreResponse(message) {
    const stores = {
        'countdown': 'Countdown offers competitive prices and frequent specials. Great for weekly shopping with good variety.',
        'new world': 'New World focuses on quality fresh produce and premium products. Higher prices but excellent quality.',
        'paknsave': 'PAK\'nSAVE offers the lowest prices in NZ. Best for budget shopping and bulk purchases.',
        'four square': 'Four Square is convenient for quick shops but tends to have higher prices. Good for emergencies.',
        'farro': 'Farro Fresh specializes in gourmet and organic products. Premium pricing for luxury items.'
    };
    
    // Find mentioned store
    for (const [store, info] of Object.entries(stores)) {
        if (message.toLowerCase().includes(store.replace('\'', ''))) {
            return `${store.toUpperCase()}: ${info} Would you like me to find locations near you?`;
        }
    }
    
    return "I can provide information about major NZ supermarket chains: Countdown, New World, PAK'nSAVE, Four Square, and Farro Fresh. Which store would you like to know about?";
}

function checkAIAccess() {
    // Update UI based on user's AI message allowance
    updateAIAccess();
}

function loadChatHistory() {
    // Load previous chat messages from localStorage
    const chatHistory = JSON.parse(localStorage.getItem('chat_history') || '[]');
    const chatMessages = document.getElementById('chatMessages');
    
    if (chatHistory.length === 0) {
        // Add welcome message if no history
        addMessageToChat("Kia ora! I'm your AI shopping assistant for New Zealand. I can help you find the best grocery deals at NZ supermarkets near your location. To get started, please share your address or allow location access.", 'bot');
    } else {
        // Restore chat history
        chatHistory.forEach(msg => {
            addMessageToChat(msg.message, msg.sender);
        });
    }
}

function saveChatHistory() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messages = Array.from(chatMessages.querySelectorAll('.message:not(.typing-indicator)')).map(msg => {
        const isBot = msg.classList.contains('bot-message');
        const messageText = msg.querySelector('.message-content p').textContent;
        return {
            message: messageText,
            sender: isBot ? 'bot' : 'user',
            timestamp: new Date().toISOString()
        };
    });
    
    // Keep only last 50 messages
    const recentMessages = messages.slice(-50);
    localStorage.setItem('chat_history', JSON.stringify(recentMessages));
}

function clearChatHistory() {
    localStorage.removeItem('chat_history');
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
        loadChatHistory(); // Reload with welcome message
    }
}

async function sendToRealAI(message) {
    try {
        const token = localStorage.getItem('grocerycompare_token');
        if (!token) {
            throw new Error('Authentication required');
        }
        
        const conversationId = getConversationId();
        
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message: message,
                conversationId: conversationId
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            const error = new Error(errorData.message || 'AI request failed');
            error.upgradeRequired = errorData.upgradeRequired;
            throw error;
        }
        
        const data = await response.json();
        
        // Store conversation ID for context
        if (data.conversationId) {
            localStorage.setItem('ai_conversation_id', data.conversationId);
        }
        
        return data;
    } catch (error) {
        console.error('Real AI API error:', error);
        // Fallback to enhanced local processing
        return {
            response: await processUserMessage(message),
            messagesRemaining: 'unknown'
        };
    }
}

function getConversationId() {
    return localStorage.getItem('ai_conversation_id') || null;
}

function updateUsageDisplay(messagesRemaining) {
    const usageElement = document.getElementById('usageDisplay');
    if (usageElement) {
        if (messagesRemaining === 'unlimited') {
            usageElement.textContent = 'Premium: Unlimited messages';
            usageElement.className = 'usage-display premium';
        } else {
            usageElement.textContent = `Free: ${messagesRemaining} messages remaining today`;
            usageElement.className = 'usage-display free';
            
            if (messagesRemaining <= 1) {
                usageElement.classList.add('warning');
            }
        }
    }
}

// Export functions for global use
window.handleSendMessage = handleSendMessage;
window.clearChatHistory = clearChatHistory;
window.sendToRealAI = sendToRealAI;

