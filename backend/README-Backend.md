# GroceryCompare NZ Backend

Real backend server with Stripe payment integration for the GroceryCompare NZ platform.

## 🚀 Features

- **Real Stripe Integration** - Actual payment processing with your test keys
- **User Authentication** - JWT-based auth with registration/login
- **Freemium Model** - AI message limits for free users
- **Premium Subscriptions** - $9.99/month NZD via Stripe
- **Price API** - RESTful API for grocery price data
- **Crowdsourced Pricing** - Users can submit price data
- **Rate Limiting** - Protection against abuse
- **Webhook Support** - Stripe webhook handling

## 📁 Project Structure

```
backend/
├── server.js              # Main server file
├── package.json           # Dependencies
├── env.example            # Environment variables template
├── routes/
│   ├── auth.js           # Authentication endpoints
│   ├── stripe.js         # Stripe payment integration
│   ├── users.js          # User management
│   └── prices.js         # Price data API
├── middleware/
│   └── auth.js           # Authentication middleware
├── models/
│   └── User.js           # User data model (JSON file storage)
└── data/
    └── users.json        # User database (auto-created)
```

## 🛠 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create `.env` file from template:
```bash
cp env.example .env
```

Update `.env` with your settings:
```env
# Your Stripe keys (already included)
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here

# Server settings
PORT=3000
JWT_SECRET=your_very_secure_jwt_secret_key_here
FRONTEND_URL=http://localhost:8080
```

### 3. Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

Server will run on http://localhost:3000

## 💳 Stripe Integration

### Payment Flow
1. User clicks "Subscribe" on frontend
2. Frontend calls `/api/stripe/create-checkout-session`
3. Backend creates Stripe checkout session
4. User redirected to Stripe checkout
5. After payment, Stripe webhook updates user to premium

### Webhook Setup
For production, configure Stripe webhook:
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## 🔐 API Endpoints

### Authentication
```
POST /api/auth/register    # Register new user
POST /api/auth/login       # Login user
GET  /api/auth/profile     # Get user profile
PUT  /api/auth/profile     # Update profile
POST /api/auth/logout      # Logout
```

### Stripe Payments
```
POST /api/stripe/create-checkout-session  # Create payment session
GET  /api/stripe/subscription-status      # Get subscription status
POST /api/stripe/cancel-subscription      # Cancel subscription
POST /webhook                              # Stripe webhook handler
```

### User Management
```
POST /api/users/use-ai-message   # Use AI message (freemium)
GET  /api/users/usage-stats      # Get usage statistics
POST /api/users/favorites        # Add to favorites
GET  /api/users/favorites        # Get favorites
```

### Price Data
```
GET  /api/prices                 # Get all prices (with filters)
GET  /api/prices/:id            # Get specific item
POST /api/prices/submit         # Submit user price data
POST /api/prices/alerts         # Create price alert (premium)
GET  /api/prices/:id/history    # Get price history (premium)
```

## 🎯 Testing the Integration

### 1. Test User Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### 2. Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. Test Stripe Payment
1. Register/login on frontend
2. Click "Upgrade to Premium"
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete checkout
5. Check user becomes premium

### 4. Test AI Message Limits
- Free users: 3 messages per day
- Premium users: Unlimited

## 🔧 Frontend Integration

Update your frontend `auth.js` to use the real backend:

```javascript
// Replace the simulated functions with real API calls
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            updateUIForLoggedInUser();
            closeAuthModal();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Login failed. Please try again.', 'error');
    }
}

async function createCheckoutSession() {
    const token = localStorage.getItem('token');
    
    const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    const data = await response.json();
    
    if (response.ok) {
        return { id: data.sessionId };
    } else {
        throw new Error(data.message);
    }
}
```

## 📊 Database

Currently uses JSON file storage for simplicity. For production, migrate to:
- **PostgreSQL** - Recommended for structured data
- **MongoDB** - Good for flexible schemas
- **Firebase** - Managed solution
- **Supabase** - PostgreSQL with real-time features

## 🚀 Production Deployment

### Environment Variables
Set these in your production environment:
```env
NODE_ENV=production
JWT_SECRET=very_secure_random_string_for_production
FRONTEND_URL=https://yourdomain.com
DATABASE_URL=your_production_database_url
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_from_stripe
```

### Recommended Hosting
- **Vercel** - Easy deployment with serverless functions
- **Railway** - Simple deployment with PostgreSQL
- **Heroku** - Classic PaaS with add-ons
- **DigitalOcean App Platform** - Managed container hosting

## 🔒 Security Features

- **JWT Authentication** with secure token handling
- **Rate Limiting** to prevent abuse
- **Input Validation** on all endpoints
- **CORS Protection** configured for your domain
- **Helmet.js** for security headers
- **Password Hashing** with bcrypt
- **Stripe Webhook Verification** for payment security

## 📈 Monitoring & Analytics

Consider adding:
- **Error tracking** (Sentry)
- **Analytics** (Google Analytics, Mixpanel)
- **Performance monitoring** (New Relic)
- **Logging** (Winston, structured logs)
- **Health checks** (already included at `/health`)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📞 Support

For issues with the backend integration:
1. Check server logs for errors
2. Verify environment variables
3. Test API endpoints with Postman/curl
4. Check Stripe dashboard for payment issues

---

**🎉 Your real Stripe integration is now ready!** Users can make actual payments and get premium access to unlimited AI features.

