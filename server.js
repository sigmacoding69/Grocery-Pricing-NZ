const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');

// Try to load .env file, but set defaults if it fails
try {
    require('dotenv').config();
} catch (error) {
    console.log('No .env file found, using defaults');
}

// Set default environment variables if not provided
if (!process.env.STRIPE_SECRET_KEY) {
    process.env.STRIPE_SECRET_KEY = 'sk_test_your_stripe_secret_key_here';
}
if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_your_stripe_publishable_key_here';
}
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'grocery_compare_nz_super_secure_jwt_secret_2024';
}
if (!process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL = 'http://localhost:3001';
}
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
}

// Import routes
const authRoutes = require('./routes/auth');
const stripeRoutes = require('./routes/stripe');
const userRoutes = require('./routes/users');
const priceRoutes = require('./routes/prices');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware with CSP configuration for Stripe
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", // For inline scripts
        "'unsafe-hashes'", // For inline event handlers
        "https://js.stripe.com", // Allow Stripe scripts
        "https://checkout.stripe.com" // Allow Stripe checkout
      ],
      scriptSrcAttr: [
        "'unsafe-inline'", // Allow inline event handlers like onclick
        "'unsafe-hashes'"
      ],
      connectSrc: [
        "'self'",
        "https://api.stripe.com", // Allow Stripe API calls
        "https://checkout.stripe.com"
      ],
      frameSrc: [
        "'self'",
        "https://checkout.stripe.com", // Allow Stripe checkout iframe
        "https://js.stripe.com"
      ],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", // For inline styles
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com" // For Font Awesome
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:"
      ]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Stripe webhook endpoint (must be before other body parsing)
app.use('/webhook', bodyParser.raw({ type: 'application/json' }), stripeRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/ai', aiRoutes);

// Stripe redirect routes (before static files)
app.get('/success', (req, res) => {
  res.sendFile(__dirname + '/success.html');
});

app.get('/cancel', (req, res) => {
  res.sendFile(__dirname + '/cancel.html');
});

// Serve static files (your frontend)
app.use(express.static('.'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.type === 'StripeCardError') {
    return res.status(400).json({
      error: 'Payment failed',
      message: err.message
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 GroceryCompare NZ Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`💳 Stripe Mode: ${process.env.STRIPE_SECRET_KEY.includes('test') ? 'TEST' : 'LIVE'}`);
});

module.exports = app;
