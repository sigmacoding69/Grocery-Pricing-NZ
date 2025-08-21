const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getUserById } = require('../models/User');
const router = express.Router();

// Simple price data (in production, this would come from a database)
let groceryData = [
    {
        id: 1,
        name: "Bananas (1 kg)",
        category: "fruits",
        prices: [
            { store: "Countdown", price: 3.50, distance: 2.1, lastUpdated: new Date().toISOString() },
            { store: "New World", price: 3.99, distance: 1.8, lastUpdated: new Date().toISOString() },
            { store: "PAK'nSAVE", price: 2.99, distance: 3.2, lastUpdated: new Date().toISOString() },
            { store: "FreshChoice", price: 3.79, distance: 2.5, lastUpdated: new Date().toISOString() }
        ],
        lastUpdated: new Date().toISOString()
    },
    {
        id: 2,
        name: "Mince Beef (500g)",
        category: "meat",
        prices: [
            { store: "Countdown", price: 8.50, distance: 2.1, lastUpdated: new Date().toISOString() },
            { store: "New World", price: 9.99, distance: 1.8, lastUpdated: new Date().toISOString() },
            { store: "PAK'nSAVE", price: 7.50, distance: 3.2, lastUpdated: new Date().toISOString() },
            { store: "The Mad Butcher", price: 8.99, distance: 1.2, lastUpdated: new Date().toISOString() }
        ],
        lastUpdated: new Date().toISOString()
    },
    {
        id: 3,
        name: "Anchor Milk (2L)",
        category: "dairy",
        prices: [
            { store: "Countdown", price: 4.20, distance: 2.1, lastUpdated: new Date().toISOString() },
            { store: "New World", price: 4.50, distance: 1.8, lastUpdated: new Date().toISOString() },
            { store: "PAK'nSAVE", price: 3.80, distance: 3.2, lastUpdated: new Date().toISOString() },
            { store: "Four Square", price: 4.70, distance: 2.5, lastUpdated: new Date().toISOString() }
        ],
        lastUpdated: new Date().toISOString()
    },
    {
        id: 4,
        name: "Baby Spinach (120g)",
        category: "vegetables",
        prices: [
            { store: "Countdown", price: 3.50, distance: 2.1, lastUpdated: new Date().toISOString() },
            { store: "New World", price: 3.99, distance: 1.8, lastUpdated: new Date().toISOString() },
            { store: "PAK'nSAVE", price: 2.99, distance: 3.2, lastUpdated: new Date().toISOString() },
            { store: "FreshChoice", price: 3.79, distance: 2.8, lastUpdated: new Date().toISOString() }
        ],
        lastUpdated: new Date().toISOString()
    },
    {
        id: 5,
        name: "Vogel's Wholemeal Bread",
        category: "pantry",
        prices: [
            { store: "Countdown", price: 4.50, distance: 2.1, lastUpdated: new Date().toISOString() },
            { store: "New World", price: 4.99, distance: 1.8, lastUpdated: new Date().toISOString() },
            { store: "PAK'nSAVE", price: 3.99, distance: 3.2, lastUpdated: new Date().toISOString() },
            { store: "Four Square", price: 5.20, distance: 3.8, lastUpdated: new Date().toISOString() }
        ],
        lastUpdated: new Date().toISOString()
    }
];

// Get all grocery prices
router.get('/', (req, res) => {
  try {
    const { category, store, search, sortBy } = req.query;
    
    let filteredData = [...groceryData];

    // Filter by category
    if (category) {
      filteredData = filteredData.filter(item => 
        item.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by store
    if (store) {
      filteredData = filteredData.filter(item =>
        item.prices.some(price => 
          price.store.toLowerCase().includes(store.toLowerCase())
        )
      );
    }

    // Search by name
    if (search) {
      filteredData = filteredData.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort results
    if (sortBy) {
      switch (sortBy) {
        case 'name':
          filteredData.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'price-low':
          filteredData.sort((a, b) => {
            const minA = Math.min(...a.prices.map(p => p.price));
            const minB = Math.min(...b.prices.map(p => p.price));
            return minA - minB;
          });
          break;
        case 'price-high':
          filteredData.sort((a, b) => {
            const maxA = Math.max(...a.prices.map(p => p.price));
            const maxB = Math.max(...b.prices.map(p => p.price));
            return maxB - maxA;
          });
          break;
        case 'updated':
          filteredData.sort((a, b) => 
            new Date(b.lastUpdated) - new Date(a.lastUpdated)
          );
          break;
      }
    }

    res.json({
      data: filteredData,
      count: filteredData.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({
      error: 'Failed to fetch prices',
      message: 'Unable to retrieve price data'
    });
  }
});

// Get price for specific item
router.get('/:itemId', (req, res) => {
  try {
    const { itemId } = req.params;
    const item = groceryData.find(item => item.id === parseInt(itemId));

    if (!item) {
      return res.status(404).json({
        error: 'Item not found',
        message: 'The requested item was not found'
      });
    }

    res.json(item);

  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({
      error: 'Failed to fetch item',
      message: 'Unable to retrieve item data'
    });
  }
});

// Create price alert (Premium feature)
router.post('/alerts', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { itemId, targetPrice, store } = req.body;

    // Check if user is premium
    const user = await getUserById(userId);
    if (!user || !user.isPremium) {
      return res.status(403).json({
        error: 'Premium required',
        message: 'Price alerts are a premium feature. Please upgrade to access this functionality.'
      });
    }

    if (!itemId || !targetPrice) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Item ID and target price are required'
      });
    }

    // Validate item exists
    const item = groceryData.find(item => item.id === parseInt(itemId));
    if (!item) {
      return res.status(404).json({
        error: 'Item not found',
        message: 'The specified item was not found'
      });
    }

    // Create alert (in production, save to database)
    const alert = {
      id: Date.now(), // Simple ID generation
      userId,
      itemId: parseInt(itemId),
      itemName: item.name,
      targetPrice: parseFloat(targetPrice),
      store: store || null,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    res.status(201).json({
      message: 'Price alert created successfully',
      alert
    });

  } catch (error) {
    console.error('Error creating price alert:', error);
    res.status(500).json({
      error: 'Failed to create price alert',
      message: 'Unable to create price alert'
    });
  }
});

// Get user's price alerts
router.get('/alerts/my-alerts', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;

    // Check if user is premium
    const user = await getUserById(userId);
    if (!user || !user.isPremium) {
      return res.status(403).json({
        error: 'Premium required',
        message: 'Price alerts are a premium feature'
      });
    }

    // In production, fetch from database
    const alerts = []; // Placeholder

    res.json({
      alerts,
      count: alerts.length
    });

  } catch (error) {
    console.error('Error fetching price alerts:', error);
    res.status(500).json({
      error: 'Failed to fetch price alerts',
      message: 'Unable to retrieve price alerts'
    });
  }
});

// Submit user price (crowdsourced data)
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { itemName, store, price, category, location, receipt } = req.body;

    if (!itemName || !store || !price) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Item name, store, and price are required'
      });
    }

    // Validate price
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        error: 'Invalid price',
        message: 'Price must be a valid positive number'
      });
    }

    // Create submission record
    const submission = {
      id: Date.now(),
      userId,
      itemName: itemName.trim(),
      store: store.trim(),
      price: numericPrice,
      category: category || 'other',
      location: location || null,
      receipt: receipt || null, // Base64 image data
      verified: false,
      submittedAt: new Date().toISOString()
    };

    // In production, save to database and potentially update main price data
    console.log('Price submission received:', submission);

    res.status(201).json({
      message: 'Price submitted successfully',
      submission: {
        id: submission.id,
        itemName: submission.itemName,
        store: submission.store,
        price: submission.price,
        submittedAt: submission.submittedAt
      }
    });

  } catch (error) {
    console.error('Error submitting price:', error);
    res.status(500).json({
      error: 'Failed to submit price',
      message: 'Unable to submit price data'
    });
  }
});

// Get price history for an item (Premium feature)
router.get('/:itemId/history', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { itemId } = req.params;
    const { store, days = 30 } = req.query;

    // Check if user is premium
    const user = await getUserById(userId);
    if (!user || !user.isPremium) {
      return res.status(403).json({
        error: 'Premium required',
        message: 'Price history is a premium feature'
      });
    }

    // Validate item exists
    const item = groceryData.find(item => item.id === parseInt(itemId));
    if (!item) {
      return res.status(404).json({
        error: 'Item not found',
        message: 'The specified item was not found'
      });
    }

    // Generate mock historical data
    const history = generateMockPriceHistory(item, store, parseInt(days));

    res.json({
      itemId: parseInt(itemId),
      itemName: item.name,
      store: store || 'all',
      days: parseInt(days),
      history
    });

  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({
      error: 'Failed to fetch price history',
      message: 'Unable to retrieve price history'
    });
  }
});

// Helper function to generate mock price history
function generateMockPriceHistory(item, store, days) {
  const history = [];
  const now = new Date();
  
  // Get current prices for the item
  let storePrices = item.prices;
  if (store) {
    storePrices = item.prices.filter(p => 
      p.store.toLowerCase().includes(store.toLowerCase())
    );
  }

  // Generate historical data points
  for (let i = days; i >= 0; i--) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    
    storePrices.forEach(storePrice => {
      // Add some realistic price variation
      const variation = (Math.random() - 0.5) * 0.4; // ±20% variation
      const historicalPrice = Math.max(0.5, storePrice.price * (1 + variation));
      
      history.push({
        date: date.toISOString().split('T')[0],
        store: storePrice.store,
        price: Math.round(historicalPrice * 100) / 100,
        timestamp: date.toISOString()
      });
    });
  }

  return history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

module.exports = router;

