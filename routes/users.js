const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getUserById, updateUserSubscription } = require('../models/User');
const router = express.Router();

// Use AI message (for freemium restriction)
router.post('/use-ai-message', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found'
      });
    }

    // Check if user is premium
    if (user.isPremium) {
      return res.json({
        allowed: true,
        remaining: 'unlimited',
        isPremium: true,
        message: 'Premium user - unlimited access'
      });
    }

    // Check daily reset
    const today = new Date().toDateString();
    const lastResetDate = user.lastDailyReset ? new Date(user.lastDailyReset).toDateString() : null;
    
    if (lastResetDate !== today) {
      // Reset daily usage
      user.aiMessagesUsed = 0;
      user.lastDailyReset = new Date().toISOString();
    }

    // Check if user has reached daily limit
    const dailyLimit = user.dailyLimit || 3;
    if (user.aiMessagesUsed >= dailyLimit) {
      return res.json({
        allowed: false,
        remaining: 0,
        isPremium: false,
        dailyLimit,
        used: user.aiMessagesUsed,
        message: 'Daily limit reached. Upgrade to Premium for unlimited access.'
      });
    }

    // Increment usage
    user.aiMessagesUsed = (user.aiMessagesUsed || 0) + 1;
    await updateUserSubscription(userId, {
      aiMessagesUsed: user.aiMessagesUsed,
      lastDailyReset: user.lastDailyReset
    });

    const remaining = dailyLimit - user.aiMessagesUsed;

    res.json({
      allowed: true,
      remaining,
      isPremium: false,
      dailyLimit,
      used: user.aiMessagesUsed,
      message: remaining > 0 ? `${remaining} messages remaining today` : 'Last free message used today'
    });

  } catch (error) {
    console.error('Error using AI message:', error);
    res.status(500).json({
      error: 'Failed to process AI message usage',
      message: 'Unable to process request'
    });
  }
});

// Get user usage statistics
router.get('/usage-stats', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found'
      });
    }

    // Check daily reset
    const today = new Date().toDateString();
    const lastResetDate = user.lastDailyReset ? new Date(user.lastDailyReset).toDateString() : null;
    
    let aiMessagesUsed = user.aiMessagesUsed || 0;
    if (lastResetDate !== today && !user.isPremium) {
      aiMessagesUsed = 0;
    }

    const dailyLimit = user.dailyLimit || 3;
    const remaining = user.isPremium ? 'unlimited' : Math.max(0, dailyLimit - aiMessagesUsed);

    res.json({
      isPremium: user.isPremium || false,
      aiMessagesUsed,
      dailyLimit: user.isPremium ? 'unlimited' : dailyLimit,
      remaining,
      lastReset: user.lastDailyReset,
      subscriptionStatus: user.subscriptionStatus || 'inactive',
      memberSince: user.createdAt
    });

  } catch (error) {
    console.error('Error getting usage stats:', error);
    res.status(500).json({
      error: 'Failed to get usage statistics',
      message: 'Unable to fetch usage data'
    });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { preferences } = req.body;

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found'
      });
    }

    // Update preferences
    user.preferences = {
      ...user.preferences,
      ...preferences,
      updatedAt: new Date().toISOString()
    };

    await updateUserSubscription(userId, { preferences: user.preferences });

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });

  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      error: 'Failed to update preferences',
      message: 'Unable to update preferences'
    });
  }
});

// Add item to favorites
router.post('/favorites', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { itemId, itemName } = req.body;

    if (!itemId || !itemName) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Item ID and name are required'
      });
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found'
      });
    }

    user.favorites = user.favorites || [];
    
    // Check if already favorited
    const existingIndex = user.favorites.findIndex(fav => fav.itemId === itemId);
    if (existingIndex !== -1) {
      return res.status(409).json({
        error: 'Already favorited',
        message: 'Item is already in favorites'
      });
    }

    // Add to favorites
    user.favorites.push({
      itemId,
      itemName,
      addedAt: new Date().toISOString()
    });

    await updateUserSubscription(userId, { favorites: user.favorites });

    res.json({
      message: 'Item added to favorites',
      favorites: user.favorites
    });

  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({
      error: 'Failed to add to favorites',
      message: 'Unable to add item to favorites'
    });
  }
});

// Remove item from favorites
router.delete('/favorites/:itemId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { itemId } = req.params;

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found'
      });
    }

    user.favorites = user.favorites || [];
    
    // Remove from favorites
    const originalLength = user.favorites.length;
    user.favorites = user.favorites.filter(fav => fav.itemId !== itemId);

    if (user.favorites.length === originalLength) {
      return res.status(404).json({
        error: 'Item not found',
        message: 'Item not found in favorites'
      });
    }

    await updateUserSubscription(userId, { favorites: user.favorites });

    res.json({
      message: 'Item removed from favorites',
      favorites: user.favorites
    });

  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({
      error: 'Failed to remove from favorites',
      message: 'Unable to remove item from favorites'
    });
  }
});

// Get user favorites
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found'
      });
    }

    res.json({
      favorites: user.favorites || []
    });

  } catch (error) {
    console.error('Error getting favorites:', error);
    res.status(500).json({
      error: 'Failed to get favorites',
      message: 'Unable to fetch favorites'
    });
  }
});

module.exports = router;

