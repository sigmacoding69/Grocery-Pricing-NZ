const jwt = require('jsonwebtoken');

// Middleware to authenticate JWT tokens
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        error: 'Invalid token',
        message: 'Invalid authentication token'
      });
    }
    
    return res.status(403).json({
      error: 'Token verification failed',
      message: 'Unable to verify authentication token'
    });
  }
}

// Optional authentication (doesn't fail if no token)
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    console.error('Optional auth token verification failed:', error);
    req.user = null;
  }
  
  next();
}

// Middleware to check if user is premium
function requirePremium(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to access this feature'
    });
  }

  // In a real app, you'd check the user's subscription status from the database
  // For now, we'll make a simple check
  const { getUserById } = require('../models/User');
  
  getUserById(req.user.userId)
    .then(user => {
      if (!user || !user.isPremium) {
        return res.status(403).json({
          error: 'Premium required',
          message: 'This feature requires a premium subscription'
        });
      }
      next();
    })
    .catch(error => {
      console.error('Error checking premium status:', error);
      res.status(500).json({
        error: 'Unable to verify premium status',
        message: 'Please try again later'
      });
    });
}

// Rate limiting for specific actions
function createRateLimiter(windowMs, max, message) {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    // Clean old entries
    for (const [ip, data] of attempts.entries()) {
      if (now - data.resetTime > windowMs) {
        attempts.delete(ip);
      }
    }
    
    // Get or create attempt record
    if (!attempts.has(key)) {
      attempts.set(key, {
        count: 0,
        resetTime: now
      });
    }
    
    const record = attempts.get(key);
    
    // Reset if window has passed
    if (now - record.resetTime > windowMs) {
      record.count = 0;
      record.resetTime = now;
    }
    
    // Check if limit exceeded
    if (record.count >= max) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: message || `Too many requests. Try again in ${Math.ceil(windowMs / 1000)} seconds.`,
        retryAfter: Math.ceil((record.resetTime + windowMs - now) / 1000)
      });
    }
    
    // Increment counter
    record.count++;
    
    next();
  };
}

// Specific rate limiters
const authRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts. Please try again in 15 minutes.'
);

const aiMessageRateLimit = createRateLimiter(
  60 * 1000, // 1 minute
  10, // 10 requests
  'Too many AI requests. Please wait a moment before trying again.'
);

module.exports = {
  authenticateToken,
  optionalAuth,
  requirePremium,
  createRateLimiter,
  authRateLimit,
  aiMessageRateLimit
};

