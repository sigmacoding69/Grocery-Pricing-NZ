const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getUserById } = require('../models/User');
const router = express.Router();

// Import OpenAI (you'll need to set up API key)
let OpenAI;
let openai;

try {
    OpenAI = require('openai');
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here'
    });
} catch (error) {
    console.warn('⚠️ OpenAI not configured. Using fallback responses.');
}

// Store conversation history temporarily (use Redis/DB in production)
const conversationHistory = new Map();

// AI Chat endpoint
router.post('/chat', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const { message, conversationId } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                error: 'Message is required',
                message: 'Please provide a message to send to the AI assistant'
            });
        }

        // Check if user has AI access
        const user = await getUserById(userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User account not found'
            });
        }

        // Check AI usage limits for free users
        if (!user.isPremium) {
            const today = new Date().toDateString();
            const usageKey = `${userId}_${today}`;
            const dailyUsage = user.dailyAIUsage || {};
            
            if ((dailyUsage[today] || 0) >= 5) {
                return res.status(403).json({
                    error: 'AI limit reached',
                    message: 'Free users are limited to 5 AI messages per day. Upgrade to Premium for unlimited access.',
                    upgradeRequired: true
                });
            }
        }

        // Get or create conversation history
        const conversationKey = conversationId || `${userId}_${Date.now()}`;
        let history = conversationHistory.get(conversationKey) || [];

        // Add user message to history
        history.push({ role: 'user', content: message });

        let aiResponse;

        if (openai && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
            // Use real OpenAI API
            aiResponse = await getOpenAIResponse(message, history);
        } else {
            // Fallback to enhanced simulated AI
            aiResponse = await getEnhancedSimulatedResponse(message, history);
        }

        // Add AI response to history
        history.push({ role: 'assistant', content: aiResponse });

        // Store updated history (limit to last 20 messages)
        if (history.length > 20) {
            history = history.slice(-20);
        }
        conversationHistory.set(conversationKey, history);

        // Update user's daily usage for free users
        if (!user.isPremium) {
            // In production, update this in the database
            console.log(`Free user ${userId} used AI message. Daily count: ${(user.dailyAIUsage?.[new Date().toDateString()] || 0) + 1}`);
        }

        res.json({
            response: aiResponse,
            conversationId: conversationKey,
            messagesRemaining: user.isPremium ? 'unlimited' : Math.max(0, 5 - ((user.dailyAIUsage?.[new Date().toDateString()] || 0) + 1))
        });

    } catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({
            error: 'AI processing failed',
            message: 'Sorry, I encountered an error processing your message. Please try again.'
        });
    }
});

async function getOpenAIResponse(message, history) {
    try {
        const systemPrompt = `You are a helpful AI assistant for GroceryCompare NZ, a grocery price comparison service in New Zealand. 

Your role:
- Help users find the best grocery deals across NZ supermarkets (Countdown, New World, PAK'nSAVE, Four Square, etc.)
- Provide shopping advice and budget recommendations
- Answer questions about New Zealand grocery stores and products
- Be friendly, helpful, and knowledgeable about NZ grocery shopping

Available data:
- You can reference these NZ stores: Countdown, New World, PAK'nSAVE, Four Square, The Mad Butcher, FreshChoice, Farro Fresh
- Common NZ grocery items: Anchor milk, Vogel's bread, Mainland cheese, etc.
- Use NZD currency format ($X.XX NZD)

Keep responses concise but helpful. If users ask about specific prices, mention that prices change frequently and suggest they check the live comparison tool.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.slice(-10) // Include last 10 messages for context
        ];

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: 500,
            temperature: 0.7,
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI API error:', error);
        return getEnhancedSimulatedResponse(message, history);
    }
}

async function getEnhancedSimulatedResponse(message, history) {
    // Enhanced fallback with more sophisticated patterns
    const lowerMessage = message.toLowerCase();
    
    // Grocery-specific responses
    if (lowerMessage.includes('cheap') || lowerMessage.includes('budget')) {
        return "For budget shopping in NZ, I'd recommend PAK'nSAVE - they consistently have the lowest prices. Their tagline 'New Zealand's Lowest Food Prices' is usually accurate! For fresh produce, also check out local markets which can be 20-30% cheaper than supermarkets.";
    }
    
    if (lowerMessage.includes('milk') || lowerMessage.includes('anchor')) {
        return "Anchor milk is a popular NZ brand! Prices typically range from $3.80-$4.70 for 2L depending on the store. PAK'nSAVE usually has it cheapest around $3.80, while Four Square tends to be pricier at $4.70. Check the price comparison tool for current deals!";
    }
    
    if (lowerMessage.includes('countdown') || lowerMessage.includes('new world') || lowerMessage.includes('paknsave')) {
        const stores = {
            'countdown': 'Countdown offers good variety and frequent specials. Great for everyday shopping with decent prices.',
            'new world': 'New World focuses on quality and fresh produce. Slightly pricier but excellent for premium items.',
            'paknsave': "PAK'nSAVE is your best bet for budget shopping. No-frills warehouse style with the lowest prices in NZ."
        };
        
        for (const [store, description] of Object.entries(stores)) {
            if (lowerMessage.includes(store.replace('paknsave', 'pak'))) {
                return description;
            }
        }
    }
    
    if (lowerMessage.includes('bread') || lowerMessage.includes('vogel')) {
        return "Vogel's bread is a premium NZ brand, typically $3.99-$5.20 depending on where you shop. For budget bread options, try home-brand loaves at PAK'nSAVE for around $2.50-$3.00.";
    }
    
    // General grocery advice
    if (lowerMessage.includes('save money') || lowerMessage.includes('tips')) {
        return "Here are my top NZ grocery savings tips:\n1. Shop at PAK'nSAVE for staples\n2. Check weekly specials at each store\n3. Buy seasonal produce\n4. Use the '$1 deals' at The Warehouse\n5. Consider home brands - often 20-40% cheaper\n6. Shop late evening for markdown items";
    }
    
    // Default helpful response
    return "I'm here to help with your NZ grocery shopping! I can provide advice on store prices, budget tips, and finding the best deals across Countdown, New World, PAK'nSAVE and other NZ supermarkets. What would you like to know?";
}

// Get conversation history
router.get('/conversations/:conversationId', authenticateToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { userId } = req.user;
        
        // Verify conversation belongs to user
        if (!conversationId.startsWith(userId)) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You can only access your own conversations'
            });
        }
        
        const history = conversationHistory.get(conversationId) || [];
        
        res.json({
            conversationId,
            messages: history,
            messageCount: history.length
        });
        
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({
            error: 'Failed to fetch conversation',
            message: 'Unable to retrieve conversation history'
        });
    }
});

// Clear conversation history
router.delete('/conversations/:conversationId', authenticateToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { userId } = req.user;
        
        // Verify conversation belongs to user
        if (!conversationId.startsWith(userId)) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You can only delete your own conversations'
            });
        }
        
        conversationHistory.delete(conversationId);
        
        res.json({
            message: 'Conversation deleted successfully',
            conversationId
        });
        
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({
            error: 'Failed to delete conversation',
            message: 'Unable to delete conversation'
        });
    }
});

module.exports = router;
