// Sample grocery data with prices from New Zealand stores
const groceryData = [
    {
        id: 1,
        name: "Bananas (1 kg)",
        category: "fruits",
        prices: [
            { store: "Countdown", price: 3.50, distance: 2.1 },
            { store: "New World", price: 3.99, distance: 1.8 },
            { store: "PAK'nSAVE", price: 2.99, distance: 3.2 },
            { store: "FreshChoice", price: 3.79, distance: 2.5 }
        ]
    },
    {
        id: 2,
        name: "Mince Beef (500g)",
        category: "meat",
        prices: [
            { store: "Countdown", price: 8.50, distance: 2.1 },
            { store: "New World", price: 9.99, distance: 1.8 },
            { store: "PAK'nSAVE", price: 7.50, distance: 3.2 },
            { store: "The Mad Butcher", price: 8.99, distance: 1.2 }
        ]
    },
    {
        id: 3,
        name: "Anchor Milk (2L)",
        category: "dairy",
        prices: [
            { store: "Countdown", price: 4.20, distance: 2.1 },
            { store: "New World", price: 4.50, distance: 1.8 },
            { store: "PAK'nSAVE", price: 3.80, distance: 3.2 },
            { store: "Four Square", price: 4.70, distance: 2.5 }
        ]
    },
    {
        id: 4,
        name: "Baby Spinach (120g)",
        category: "vegetables",
        prices: [
            { store: "Countdown", price: 3.50, distance: 2.1 },
            { store: "New World", price: 3.99, distance: 1.8 },
            { store: "PAK'nSAVE", price: 2.99, distance: 3.2 },
            { store: "FreshChoice", price: 3.79, distance: 2.8 }
        ]
    },
    {
        id: 5,
        name: "Vogel's Wholemeal Bread",
        category: "pantry",
        prices: [
            { store: "Countdown", price: 4.50, distance: 2.1 },
            { store: "New World", price: 4.99, distance: 1.8 },
            { store: "PAK'nSAVE", price: 3.99, distance: 3.2 },
            { store: "Four Square", price: 5.20, distance: 3.8 }
        ]
    },
    {
        id: 6,
        name: "Chicken Breast (500g)",
        category: "meat",
        prices: [
            { store: "Countdown", price: 11.50, distance: 2.1 },
            { store: "New World", price: 12.99, distance: 1.8 },
            { store: "PAK'nSAVE", price: 9.99, distance: 3.2 },
            { store: "The Mad Butcher", price: 10.50, distance: 1.2 }
        ]
    },
    {
        id: 7,
        name: "McCain Frozen Broccoli (500g)",
        category: "frozen",
        prices: [
            { store: "Countdown", price: 3.50, distance: 2.1 },
            { store: "New World", price: 3.99, distance: 1.8 },
            { store: "PAK'nSAVE", price: 2.99, distance: 3.2 },
            { store: "FreshChoice", price: 3.79, distance: 2.5 }
        ]
    },
    {
        id: 8,
        name: "Olivado Extra Virgin Olive Oil (500ml)",
        category: "pantry",
        prices: [
            { store: "Countdown", price: 16.50, distance: 2.1 },
            { store: "New World", price: 18.99, distance: 1.8 },
            { store: "PAK'nSAVE", price: 14.99, distance: 3.2 },
            { store: "Farro Fresh", price: 19.99, distance: 4.2 }
        ]
    },
    {
        id: 9,
        name: "Anchor Greek Yogurt (1kg)",
        category: "dairy",
        prices: [
            { store: "Countdown", price: 7.50, distance: 2.1 },
            { store: "New World", price: 8.50, distance: 1.8 },
            { store: "PAK'nSAVE", price: 6.99, distance: 3.2 },
            { store: "Four Square", price: 8.99, distance: 3.8 }
        ]
    },
    {
        id: 10,
        name: "Royal Gala Apples (1.5kg bag)",
        category: "fruits",
        prices: [
            { store: "Countdown", price: 4.99, distance: 2.1 },
            { store: "New World", price: 5.50, distance: 1.8 },
            { store: "PAK'nSAVE", price: 3.99, distance: 3.2 },
            { store: "Central Otago Orchard", price: 6.99, distance: 6.2 }
        ]
    },
    {
        id: 11,
        name: "Kumara (1kg)",
        category: "vegetables",
        prices: [
            { store: "Countdown", price: 3.99, distance: 2.1 },
            { store: "New World", price: 4.50, distance: 1.8 },
            { store: "PAK'nSAVE", price: 2.99, distance: 3.2 },
            { store: "FreshChoice", price: 4.20, distance: 2.5 }
        ]
    },
    {
        id: 12,
        name: "Mainland Cheese Block (500g)",
        category: "dairy",
        prices: [
            { store: "Countdown", price: 9.50, distance: 2.1 },
            { store: "New World", price: 10.99, distance: 1.8 },
            { store: "PAK'nSAVE", price: 8.50, distance: 3.2 },
            { store: "Four Square", price: 11.20, distance: 2.5 }
        ]
    }
];

// Global variables
let filteredData = [...groceryData];
let userLocation = null;
let conversationContext = {
    userPreferences: {},
    previousQueries: [],
    currentTopic: null,
    mentionedStores: [],
    mentionedItems: []
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    displayGroceries(groceryData);
    setupNavigation();
    setupChatInput();
});

// Navigation functionality - only handle same-page navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Only intercept links that start with # (same-page navigation)
        if (href && href.startsWith('#')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all links
                navLinks.forEach(nl => nl.classList.remove('active'));
                
                // Add active class to clicked link
                this.classList.add('active');
                
                // Scroll to section
                const targetId = href.substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
        // For other links (.html files), let them navigate normally
    });
}

// Search functionality
function searchGroceries() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (searchTerm.trim() === '') {
        filteredData = [...groceryData];
    } else {
        filteredData = groceryData.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm)
        );
    }
    
    displayGroceries(filteredData);
    
    // Scroll to comparison section
    document.getElementById('compare').scrollIntoView({ behavior: 'smooth' });
}

// Filter by category
function filterByCategory() {
    const category = document.getElementById('categoryFilter').value;
    
    if (category === '') {
        filteredData = [...groceryData];
    } else {
        filteredData = groceryData.filter(item => item.category === category);
    }
    
    displayGroceries(filteredData);
}

// Sort prices
function sortPrices() {
    const sortType = document.getElementById('sortFilter').value;
    
    switch (sortType) {
        case 'name':
            filteredData.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'price-low':
            filteredData.sort((a, b) => getLowestPrice(a) - getLowestPrice(b));
            break;
        case 'price-high':
            filteredData.sort((a, b) => getHighestPrice(b) - getHighestPrice(a));
            break;
        case 'savings':
            filteredData.sort((a, b) => getSavings(b) - getSavings(a));
            break;
    }
    
    displayGroceries(filteredData);
}

// Helper functions for sorting
function getLowestPrice(item) {
    return Math.min(...item.prices.map(p => p.price));
}

function getHighestPrice(item) {
    return Math.max(...item.prices.map(p => p.price));
}

function getSavings(item) {
    const lowest = getLowestPrice(item);
    const highest = getHighestPrice(item);
    return highest - lowest;
}

// Display groceries in the grid
function displayGroceries(data) {
    const grid = document.getElementById('groceryGrid');
    
    if (data.length === 0) {
        grid.innerHTML = '<div class="text-center"><h3>No groceries found matching your criteria.</h3></div>';
        return;
    }
    
    grid.innerHTML = data.map(item => {
        const sortedPrices = [...item.prices].sort((a, b) => a.price - b.price);
        const lowestPrice = sortedPrices[0];
        const highestPrice = sortedPrices[sortedPrices.length - 1];
        const savings = highestPrice.price - lowestPrice.price;
        
        return `
            <div class="grocery-item">
                <div class="grocery-header">
                    <h3 class="grocery-name">${item.name}</h3>
                    <span class="category-badge">${item.category}</span>
                </div>
                
                <div class="price-comparison-list">
                    ${sortedPrices.map(priceItem => `
                        <div class="price-item">
                            <span class="store-name">${priceItem.store}</span>
                            <span class="price ${priceItem.price === lowestPrice.price ? 'lowest' : priceItem.price === highestPrice.price ? 'highest' : ''}">
                                $${priceItem.price.toFixed(2)} NZD
                            </span>
                        </div>
                    `).join('')}
                </div>
                
                ${savings > 0 ? `
                    <div class="text-center mt-1">
                        <span class="savings">Save $${savings.toFixed(2)} NZD by choosing ${lowestPrice.store}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Chatbot functionality
function setupChatInput() {
    const chatInput = document.getElementById('chatInput');
    
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message === '') return;
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    
    // Clear input
    input.value = '';
    
    // Process message
    processUserMessage(message);
}

function addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const icon = sender === 'user' ? 'fas fa-user' : 'fas fa-robot';
    
    messageDiv.innerHTML = `
        <i class="${icon}"></i>
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function processUserMessage(message) {
    // Add to conversation history
    conversationContext.previousQueries.push(message);
    
    // Show typing indicator briefly
    setTimeout(() => {
        const intelligentResponse = generateIntelligentResponse(message);
        addMessageToChat(intelligentResponse, 'bot');
    }, 800);
}

function generateIntelligentResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Parse the message for intent and entities
    const intent = parseIntent(lowerMessage);
    const entities = extractEntities(lowerMessage);
    
    // Update conversation context
    updateConversationContext(intent, entities, message);
    
    // Generate contextual response based on intent
    switch (intent.type) {
        case 'address_input':
            return handleAddressInput(message);
        case 'price_query':
            return handlePriceQuery(entities);
        case 'store_query':
            return handleStoreQuery(entities);
        case 'product_query':
            return handleProductQuery(entities);
        case 'comparison_request':
            return handleComparisonRequest(entities);
        case 'budget_request':
            return handleBudgetRequest(entities);
        case 'luxury_request':
            return handleLuxuryRequest(entities);
        case 'recommendation_request':
            return handleRecommendationRequest(entities);
        case 'greeting':
            return handleGreeting();
        case 'location_request':
            return handleLocationRequest();
        default:
            return handleContextualQuery(message, entities);
    }
}

function parseIntent(message) {
    // Address/Location intents
    if (isAddress(message) || /(?:my address is|i live|located at)/i.test(message)) {
        return { type: 'address_input', confidence: 0.9 };
    }
    
    if (/(?:where|location|address|near me)/i.test(message)) {
        return { type: 'location_request', confidence: 0.8 };
    }
    
    // Price-related intents
    if (/(?:price|cost|how much|expensive|cheap)/i.test(message)) {
        return { type: 'price_query', confidence: 0.8 };
    }
    
    // Store-related intents
    if (/(?:store|supermarket|shop|countdown|new world|pak.*save|four square)/i.test(message)) {
        return { type: 'store_query', confidence: 0.8 };
    }
    
    // Product-related intents
    if (/(?:banana|milk|bread|meat|chicken|beef|cheese|apple)/i.test(message)) {
        return { type: 'product_query', confidence: 0.8 };
    }
    
    // Comparison intents
    if (/(?:compare|comparison|versus|vs|difference|better)/i.test(message)) {
        return { type: 'comparison_request', confidence: 0.8 };
    }
    
    // Budget intents
    if (/(?:budget|cheap|cheapest|affordable|save money|lowest price)/i.test(message)) {
        return { type: 'budget_request', confidence: 0.9 };
    }
    
    // Luxury intents
    if (/(?:luxury|premium|expensive|high.?quality|best quality|gourmet)/i.test(message)) {
        return { type: 'luxury_request', confidence: 0.9 };
    }
    
    // Recommendation intents
    if (/(?:recommend|suggest|advice|help|what should|best)/i.test(message)) {
        return { type: 'recommendation_request', confidence: 0.8 };
    }
    
    // Greeting intents
    if (/(?:hello|hi|hey|kia ora|good morning|good afternoon)/i.test(message)) {
        return { type: 'greeting', confidence: 0.9 };
    }
    
    return { type: 'general_query', confidence: 0.5 };
}

function extractEntities(message) {
    const entities = {
        stores: [],
        products: [],
        categories: [],
        priceModifiers: [],
        locations: []
    };
    
    // Extract store names
    const storePatterns = {
        'countdown': /countdown/i,
        'new world': /new world/i,
        'pak\'nsave': /pak.*save|paknsave/i,
        'four square': /four square/i,
        'the mad butcher': /mad butcher/i,
        'freshchoice': /fresh.?choice/i,
        'farro fresh': /farro/i
    };
    
    for (const [store, pattern] of Object.entries(storePatterns)) {
        if (pattern.test(message)) {
            entities.stores.push(store);
        }
    }
    
    // Extract product names
    const productPatterns = {
        'bananas': /banana/i,
        'milk': /milk/i,
        'bread': /bread/i,
        'beef': /beef|mince/i,
        'chicken': /chicken/i,
        'cheese': /cheese/i,
        'apples': /apple/i,
        'spinach': /spinach/i,
        'kumara': /kumara/i,
        'yogurt': /yogurt|yoghurt/i,
        'olive oil': /olive oil/i,
        'broccoli': /broccoli/i
    };
    
    for (const [product, pattern] of Object.entries(productPatterns)) {
        if (pattern.test(message)) {
            entities.products.push(product);
        }
    }
    
    // Extract categories
    const categoryPatterns = {
        'fruits': /fruit/i,
        'vegetables': /vegetable|veg/i,
        'dairy': /dairy/i,
        'meat': /meat/i,
        'pantry': /pantry|grocery/i,
        'frozen': /frozen/i
    };
    
    for (const [category, pattern] of Object.entries(categoryPatterns)) {
        if (pattern.test(message)) {
            entities.categories.push(category);
        }
    }
    
    // Extract price modifiers
    if (/cheap|budget|affordable|lowest/i.test(message)) {
        entities.priceModifiers.push('budget');
    }
    if (/expensive|premium|luxury|highest/i.test(message)) {
        entities.priceModifiers.push('premium');
    }
    
    return entities;
}

function updateConversationContext(intent, entities, message) {
    // Update current topic
    conversationContext.currentTopic = intent.type;
    
    // Update mentioned stores and items
    conversationContext.mentionedStores = [...new Set([...conversationContext.mentionedStores, ...entities.stores])];
    conversationContext.mentionedItems = [...new Set([...conversationContext.mentionedItems, ...entities.products])];
    
    // Update user preferences based on repeated requests
    if (entities.priceModifiers.includes('budget')) {
        conversationContext.userPreferences.pricePreference = 'budget';
    } else if (entities.priceModifiers.includes('premium')) {
        conversationContext.userPreferences.pricePreference = 'premium';
    }
}

function isAddress(text) {
    // Simple address detection (contains numbers and street-like words)
    const addressPattern = /\d+.*(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|blvd|boulevard)/i;
    return addressPattern.test(text);
}

// New intelligent handler functions
function handlePriceQuery(entities) {
    if (entities.products.length > 0) {
        return generateProductPriceResponse(entities.products);
    } else if (entities.stores.length > 0) {
        return generateStorePriceResponse(entities.stores);
    } else {
        return "I can help you find prices for specific products! Try asking something like 'How much is milk?' or 'What's the price of bananas at Countdown?'";
    }
}

function handleStoreQuery(entities) {
    const stores = entities.stores;
    if (stores.length > 0) {
        return generateStoreInfoResponse(stores);
    } else {
        return "I can tell you about New Zealand supermarkets like Countdown, New World, PAK'nSAVE, Four Square, The Mad Butcher, FreshChoice, and Farro Fresh. Which store would you like to know about?";
    }
}

function handleProductQuery(entities) {
    const products = entities.products;
    if (products.length > 0) {
        return generateProductInfoResponse(products);
    } else {
        return "I can help you find information about groceries! Try asking about specific items like bananas, milk, bread, chicken, or any other grocery items.";
    }
}

function handleComparisonRequest(entities) {
    if (entities.products.length > 0) {
        return generateProductComparisonResponse(entities.products);
    } else if (entities.stores.length > 1) {
        return generateStoreComparisonResponse(entities.stores);
    } else {
        return "I can compare prices for you! Try asking something like 'Compare milk prices' or 'Which store has cheaper bananas?'";
    }
}

function handleBudgetRequest(entities) {
    if (entities.products.length > 0) {
        return generateBudgetProductResponse(entities.products);
    } else if (entities.categories.length > 0) {
        return generateBudgetCategoryResponse(entities.categories);
    } else {
        return generateGeneralBudgetResponse();
    }
}

function handleLuxuryRequest(entities) {
    if (entities.products.length > 0) {
        return generateLuxuryProductResponse(entities.products);
    } else {
        return generateGeneralLuxuryResponse();
    }
}

function handleRecommendationRequest(entities) {
    if (userLocation) {
        if (entities.priceModifiers.includes('budget')) {
            return generateBudgetRecommendationsWithLocation();
        } else if (entities.priceModifiers.includes('premium')) {
            return generateLuxuryRecommendationsWithLocation();
        } else {
            return generateGeneralRecommendationsWithLocation();
        }
    } else {
        return "I'd love to give you personalized recommendations! First, could you share your address or allow location access so I can find the best stores near you?";
    }
}

function handleGreeting() {
    const greetings = [
        "Kia ora! Great to see you here. I'm ready to help you find the best grocery deals in New Zealand. What can I help you with today?",
        "Hello! I'm your NZ grocery assistant. I can help you compare prices, find budget deals, or locate premium products. What would you like to know?",
        "Hi there! Looking for grocery deals? I can help you find the best prices across New Zealand supermarkets. What are you shopping for?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
}

function handleLocationRequest() {
    if (userLocation) {
        return `You're currently set to: ${userLocation}. I can provide recommendations for supermarkets near you. Would you like to see budget options or premium stores?`;
    } else {
        return "I don't have your location yet. You can either tell me your address (like '123 Queen Street, Auckland') or click the location button to use GPS. This helps me find the closest supermarkets with the best deals!";
    }
}

function handleContextualQuery(message, entities) {
    // Use conversation context to provide better responses
    if (conversationContext.userPreferences.pricePreference === 'budget') {
        return "Based on our conversation, you seem to prefer budget options. " + generateGeneralBudgetResponse();
    } else if (conversationContext.userPreferences.pricePreference === 'premium') {
        return "Since you're interested in premium products, " + generateGeneralLuxuryResponse();
    } else {
        return generateContextualResponse(message);
    }
}

function generateContextualResponse(message) {
    const responses = [
        "I understand you're looking for grocery information. Could you be more specific? For example, you could ask about prices, stores, or specific products.",
        "I'm here to help with New Zealand grocery shopping! Try asking about specific items like 'How much is bread?' or 'Where can I find cheap vegetables?'",
        "Let me help you with that! I can assist with price comparisons, store recommendations, or finding budget/premium options. What specific information do you need?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

function handleAddressInput(address) {
    userLocation = address;
    const response = `Perfect! I've saved your address: "${address}". Now I can provide you with personalized recommendations for grocery stores near you. Based on your location, here are some options nearby:`;
    
    // Return the response and trigger location-based recommendations
    setTimeout(() => {
        addMessageToChat(generateLocationRecommendations(), 'bot');
    }, 1000);
    
    return response;
}

function provideLocationBasedRecommendations() {
    const recommendations = generateLocationRecommendations();
    addMessageToChat(recommendations, 'bot');
}

function generateLocationRecommendations() {
    return `
        <p>Based on your location, here are the closest NZ supermarkets with great deals:</p>
        
        <div class="recommendation-card">
            <div class="recommendation-header">
                <strong>New World</strong>
                <span class="store-distance">1.8 km away</span>
            </div>
            <p><strong>Best deals:</strong> Baby Spinach ($3.99 NZD), Anchor Milk ($4.50 NZD)</p>
            <p><strong>Specialty:</strong> Fresh produce and premium brands</p>
        </div>
        
        <div class="recommendation-card">
            <div class="recommendation-header">
                <strong>Countdown</strong>
                <span class="store-distance">2.1 km away</span>
            </div>
            <p><strong>Best deals:</strong> Vogel's Bread ($4.50 NZD), Mince Beef ($8.50 NZD), Greek Yogurt ($7.50 NZD)</p>
            <p><strong>Specialty:</strong> Great everyday prices and wide selection</p>
        </div>
        
        <div class="recommendation-card">
            <div class="recommendation-header">
                <strong>PAK'nSAVE</strong>
                <span class="store-distance">3.2 km away</span>
            </div>
            <p><strong>Best deals:</strong> Anchor Milk ($3.80 NZD), Vogel's Bread ($3.99 NZD), Greek Yogurt ($6.99 NZD)</p>
            <p><strong>Specialty:</strong> New Zealand's lowest food prices</p>
        </div>
        
        <div class="recommendation-card">
            <div class="recommendation-header">
                <strong>The Mad Butcher</strong>
                <span class="store-distance">1.2 km away</span>
            </div>
            <p><strong>Best deals:</strong> Mince Beef ($8.99 NZD), Chicken Breast ($10.50 NZD)</p>
            <p><strong>Specialty:</strong> Quality meat at great prices</p>
        </div>
    `;
}

// Dynamic response generation functions
function generateProductPriceResponse(products) {
    let response = "<p>Here are the current prices for the items you asked about:</p>";
    
    products.forEach(productName => {
        const items = groceryData.filter(item => 
            item.name.toLowerCase().includes(productName) || 
            productName.includes(item.name.toLowerCase().split(' ')[0])
        );
        
        if (items.length > 0) {
            const item = items[0];
            const sortedPrices = [...item.prices].sort((a, b) => a.price - b.price);
            
            response += `
                <div class="recommendation-card">
                    <div class="recommendation-header">
                        <strong>${item.name}</strong>
                    </div>
                    <p><strong>Cheapest:</strong> $${sortedPrices[0].price.toFixed(2)} NZD at ${sortedPrices[0].store}</p>
                    <p><strong>Most expensive:</strong> $${sortedPrices[sortedPrices.length-1].price.toFixed(2)} NZD at ${sortedPrices[sortedPrices.length-1].store}</p>
                    <p><em>Save $${(sortedPrices[sortedPrices.length-1].price - sortedPrices[0].price).toFixed(2)} NZD by choosing ${sortedPrices[0].store}!</em></p>
                </div>
            `;
        }
    });
    
    return response;
}

function generateStoreInfoResponse(stores) {
    let response = "<p>Here's what I know about the store(s) you mentioned:</p>";
    
    stores.forEach(storeName => {
        const storeItems = [];
        groceryData.forEach(item => {
            const storePrice = item.prices.find(p => p.store.toLowerCase().includes(storeName.toLowerCase()));
            if (storePrice) {
                storeItems.push({ ...item, price: storePrice.price, distance: storePrice.distance });
            }
        });
        
        if (storeItems.length > 0) {
            const avgPrice = storeItems.reduce((sum, item) => sum + item.price, 0) / storeItems.length;
            const cheapestItem = storeItems.sort((a, b) => a.price - b.price)[0];
            
            response += `
                <div class="recommendation-card">
                    <div class="recommendation-header">
                        <strong>${storeName.charAt(0).toUpperCase() + storeName.slice(1)}</strong>
                        <span class="store-distance">${storeItems[0].distance} km away</span>
                    </div>
                    <p><strong>Average price level:</strong> $${avgPrice.toFixed(2)} NZD</p>
                    <p><strong>Best deal:</strong> ${cheapestItem.name} for $${cheapestItem.price.toFixed(2)} NZD</p>
                    <p><strong>Total items available:</strong> ${storeItems.length} products in our database</p>
                </div>
            `;
        }
    });
    
    return response;
}

function generateProductInfoResponse(products) {
    let response = "<p>Here's detailed information about the products you're interested in:</p>";
    
    products.forEach(productName => {
        const items = groceryData.filter(item => 
            item.name.toLowerCase().includes(productName) || 
            productName.includes(item.name.toLowerCase().split(' ')[0])
        );
        
        if (items.length > 0) {
            const item = items[0];
            const avgPrice = item.prices.reduce((sum, p) => sum + p.price, 0) / item.prices.length;
            const priceRange = Math.max(...item.prices.map(p => p.price)) - Math.min(...item.prices.map(p => p.price));
            
            response += `
                <div class="recommendation-card">
                    <div class="recommendation-header">
                        <strong>${item.name}</strong>
                        <span class="category-badge">${item.category}</span>
                    </div>
                    <p><strong>Average price:</strong> $${avgPrice.toFixed(2)} NZD</p>
                    <p><strong>Price range:</strong> $${priceRange.toFixed(2)} NZD difference between stores</p>
                    <p><strong>Available at:</strong> ${item.prices.length} different stores</p>
                </div>
            `;
        }
    });
    
    return response;
}

function generateProductComparisonResponse(products) {
    if (products.length === 1) {
        return generateProductPriceResponse(products);
    }
    
    let response = "<p>Here's a comparison of the products you mentioned:</p>";
    
    products.forEach(productName => {
        const items = groceryData.filter(item => 
            item.name.toLowerCase().includes(productName)
        );
        
        if (items.length > 0) {
            const item = items[0];
            const cheapestPrice = Math.min(...item.prices.map(p => p.price));
            const cheapestStore = item.prices.find(p => p.price === cheapestPrice).store;
            
            response += `
                <div class="recommendation-card">
                    <div class="recommendation-header">
                        <strong>${item.name}</strong>
                    </div>
                    <p><strong>Best deal:</strong> $${cheapestPrice.toFixed(2)} NZD at ${cheapestStore}</p>
                </div>
            `;
        }
    });
    
    return response;
}

function generateBudgetProductResponse(products) {
    let response = "<p>Here are the most budget-friendly options for the items you mentioned:</p>";
    
    products.forEach(productName => {
        const items = groceryData.filter(item => 
            item.name.toLowerCase().includes(productName) || 
            productName.includes(item.name.toLowerCase().split(' ')[0])
        );
        
        if (items.length > 0) {
            const item = items[0];
            const cheapestPrice = Math.min(...item.prices.map(p => p.price));
            const cheapestStore = item.prices.find(p => p.price === cheapestPrice).store;
            
            response += `
                <div class="recommendation-card">
                    <div class="recommendation-header">
                        <strong>${item.name}</strong>
                        <span class="price lowest">$${cheapestPrice.toFixed(2)} NZD</span>
                    </div>
                    <p>Cheapest at <strong>${cheapestStore}</strong></p>
                </div>
            `;
        }
    });
    
    return response;
}

function generateBudgetCategoryResponse(categories) {
    let response = "<p>Here are the best budget options in the categories you mentioned:</p>";
    
    categories.forEach(category => {
        const categoryItems = groceryData.filter(item => item.category === category);
        
        if (categoryItems.length > 0) {
            const bestDeals = categoryItems.map(item => {
                const cheapestPrice = Math.min(...item.prices.map(p => p.price));
                const cheapestStore = item.prices.find(p => p.price === cheapestPrice).store;
                return { ...item, cheapestPrice, cheapestStore };
            }).sort((a, b) => a.cheapestPrice - b.cheapestPrice);
            
            response += `<h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4>`;
            
            bestDeals.slice(0, 3).forEach(item => {
                response += `
                    <div class="recommendation-card">
                        <div class="recommendation-header">
                            <strong>${item.name}</strong>
                            <span class="price lowest">$${item.cheapestPrice.toFixed(2)} NZD</span>
                        </div>
                        <p>Available at <strong>${item.cheapestStore}</strong></p>
                    </div>
                `;
            });
        }
    });
    
    return response;
}

function generateGeneralBudgetResponse() {
    const budgetItems = groceryData.map(item => {
        const lowestPrice = Math.min(...item.prices.map(p => p.price));
        const bestStore = item.prices.find(p => p.price === lowestPrice);
        return { ...item, bestPrice: lowestPrice, bestStore: bestStore.store };
    }).sort((a, b) => a.bestPrice - b.bestPrice);
    
    const top5Budget = budgetItems.slice(0, 5);
    
    let response = `<p>Here are the best budget-friendly options available:</p>`;
    
    top5Budget.forEach(item => {
        response += `
            <div class="recommendation-card">
                <div class="recommendation-header">
                    <strong>${item.name}</strong>
                    <span class="price lowest">$${item.bestPrice.toFixed(2)} NZD</span>
                </div>
                <p>Available at <strong>${item.bestStore}</strong></p>
            </div>
        `;
    });
    
    return response;
}

function generateLuxuryProductResponse(products) {
    let response = "<p>Here are the premium options for the items you mentioned:</p>";
    
    products.forEach(productName => {
        const items = groceryData.filter(item => 
            item.name.toLowerCase().includes(productName) || 
            productName.includes(item.name.toLowerCase().split(' ')[0])
        );
        
        if (items.length > 0) {
            const item = items[0];
            const expensivePrice = Math.max(...item.prices.map(p => p.price));
            const expensiveStore = item.prices.find(p => p.price === expensivePrice).store;
            
            response += `
                <div class="recommendation-card">
                    <div class="recommendation-header">
                        <strong>${item.name}</strong>
                        <span class="price highest">$${expensivePrice.toFixed(2)} NZD</span>
                    </div>
                    <p>Premium quality at <strong>${expensiveStore}</strong></p>
                </div>
            `;
        }
    });
    
    return response;
}

function generateGeneralLuxuryResponse() {
    const luxuryStores = ['Farro Fresh', 'Central Otago Orchard', 'New World'];
    
    const luxuryItems = groceryData.filter(item => 
        item.prices.some(p => luxuryStores.includes(p.store))
    ).map(item => {
        const luxuryOptions = item.prices.filter(p => luxuryStores.includes(p.store));
        const bestLuxury = luxuryOptions.sort((a, b) => b.price - a.price)[0];
        return { ...item, luxuryPrice: bestLuxury.price, luxuryStore: bestLuxury.store };
    });
    
    let response = `<p>Here are premium, high-quality options available in New Zealand:</p>`;
    
    luxuryItems.slice(0, 5).forEach(item => {
        response += `
            <div class="recommendation-card">
                <div class="recommendation-header">
                    <strong>${item.name}</strong>
                    <span class="price highest">$${item.luxuryPrice.toFixed(2)} NZD</span>
                </div>
                <p>Premium quality at <strong>${item.luxuryStore}</strong></p>
                <p><small>Higher price for superior quality and sourcing</small></p>
            </div>
        `;
    });
    
    return response;
}

// Location-based recommendation functions
function generateBudgetRecommendationsWithLocation() {
    return generateGeneralBudgetResponse() + "<p><em>Based on your location, I've prioritized stores that are closest to you.</em></p>";
}

function generateLuxuryRecommendationsWithLocation() {
    return generateGeneralLuxuryResponse() + "<p><em>These premium options are available at stores near your location.</em></p>";
}

function generateGeneralRecommendationsWithLocation() {
    return generateLocationRecommendations();
}

// Clean up - these functions are now handled by the intelligent system above

// Geolocation functionality
function getLocation() {
    if (navigator.geolocation) {
        const locationButton = document.getElementById('locationButton');
        locationButton.innerHTML = '<div class="loading"></div>';
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                // In a real app, you would use a reverse geocoding service
                // For demo purposes, we'll simulate a NZ address
                const nzCities = ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga'];
                const randomCity = nzCities[Math.floor(Math.random() * nzCities.length)];
                const simulatedAddress = `${Math.floor(Math.random() * 999) + 1} Queen Street, ${randomCity} ${Math.floor(Math.random() * 9000) + 1000}`;
                
                userLocation = simulatedAddress;
                
                locationButton.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
                
                const response = `I've detected your location in New Zealand! Based on your coordinates (${lat.toFixed(4)}, ${lon.toFixed(4)}), I'll provide recommendations for NZ supermarkets near you.`;
                addMessageToChat(response, 'bot');
                
                setTimeout(() => {
                    provideLocationBasedRecommendations();
                }, 1500);
            },
            function(error) {
                locationButton.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
                
                let errorMessage = "Unable to access your location. ";
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += "Please allow location access or enter your address manually.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage += "Location request timed out.";
                        break;
                    default:
                        errorMessage += "An unknown error occurred.";
                        break;
                }
                
                addMessageToChat(errorMessage, 'bot');
            }
        );
    } else {
        addMessageToChat("Geolocation is not supported by this browser. Please enter your address manually.", 'bot');
    }
}

// Utility function to handle enter key in search
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchGroceries();
    }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
