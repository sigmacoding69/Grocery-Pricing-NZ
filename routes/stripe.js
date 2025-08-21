const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticateToken } = require('../middleware/auth');
const { updateUserSubscription, getUserById } = require('../models/User');
const router = express.Router();

// Create checkout session for premium subscription
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create or retrieve Stripe customer
    let customer;
    if (user.stripeCustomerId) {
      customer = await stripe.customers.retrieve(user.stripeCustomerId);
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: userId
        }
      });
      
      // Save customer ID to user record
      await updateUserSubscription(userId, { stripeCustomerId: customer.id });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'nzd',
            product_data: {
              name: 'GroceryCompare NZ Premium',
              description: 'Unlimited AI assistant, price alerts, and premium features',
              images: ['https://your-domain.com/premium-icon.png'], // Optional
            },
            unit_amount: 999, // $9.99 NZD in cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        userId: userId
      },
      subscription_data: {
        metadata: {
          userId: userId
        }
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
});

// Get subscription status
router.get('/subscription-status', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let subscriptionStatus = {
      isPremium: Boolean(user.isPremium), // Use the user's isPremium flag as fallback
      status: user.isPremium ? 'active' : 'inactive',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false
    };

    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        subscriptionStatus = {
          isPremium: subscription.status === 'active',
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          subscriptionId: subscription.id
        };
      } catch (error) {
        console.error('Error retrieving subscription:', error);
        // If Stripe fails, fall back to user's isPremium flag
        subscriptionStatus = {
          isPremium: Boolean(user.isPremium),
          status: user.isPremium ? 'active' : 'inactive',
          currentPeriodEnd: user.currentPeriodEnd ? new Date(user.currentPeriodEnd) : null,
          cancelAtPeriodEnd: false
        };
      }
    }

    res.json(subscriptionStatus);
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ 
      error: 'Failed to get subscription status',
      message: error.message 
    });
  }
});

// Verify and sync subscription status (for development mode)
router.post('/verify-subscription', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid' && session.metadata.userId === userId) {
      // Payment was successful, update user to premium
      await updateUserSubscription(userId, {
        isPremium: true,
        stripeCustomerId: session.customer,
        subscriptionStartDate: new Date().toISOString(),
        lastPaymentDate: new Date().toISOString()
      });

      // If there's a subscription ID, get the subscription details
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        await updateUserSubscription(userId, {
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
        });
      }

      res.json({ 
        success: true, 
        isPremium: true,
        message: 'Subscription verified and updated successfully'
      });
    } else {
      res.status(400).json({ 
        error: 'Invalid session or payment not completed',
        paymentStatus: session.payment_status 
      });
    }
  } catch (error) {
    console.error('Error verifying subscription:', error);
    res.status(500).json({ 
      error: 'Failed to verify subscription',
      message: error.message 
    });
  }
});

// Cancel subscription
router.post('/cancel-subscription', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await getUserById(userId);
    
    if (!user || !user.stripeSubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel subscription at period end
    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    res.json({ 
      message: 'Subscription will be cancelled at the end of the current period',
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ 
      error: 'Failed to cancel subscription',
      message: error.message 
    });
  }
});

// Reactivate subscription
router.post('/reactivate-subscription', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await getUserById(userId);
    
    if (!user || !user.stripeSubscriptionId) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    // Reactivate subscription
    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: false
    });

    res.json({ 
      message: 'Subscription reactivated successfully',
      status: subscription.status
    });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    res.status(500).json({ 
      error: 'Failed to reactivate subscription',
      message: error.message 
    });
  }
});

// Stripe webhook handler
router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Webhook event handlers
async function handleCheckoutSessionCompleted(session) {
  console.log('Checkout session completed:', session.id);
  
  const userId = session.metadata.userId;
  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }

  // Update user to premium
  await updateUserSubscription(userId, {
    isPremium: true,
    stripeCustomerId: session.customer,
    subscriptionStartDate: new Date().toISOString()
  });
}

async function handleSubscriptionCreated(subscription) {
  console.log('Subscription created:', subscription.id);
  
  const userId = subscription.metadata.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  await updateUserSubscription(userId, {
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    isPremium: subscription.status === 'active',
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
  });
}

async function handleSubscriptionUpdated(subscription) {
  console.log('Subscription updated:', subscription.id);
  
  const userId = subscription.metadata.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  await updateUserSubscription(userId, {
    subscriptionStatus: subscription.status,
    isPremium: subscription.status === 'active',
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: subscription.cancel_at_period_end
  });
}

async function handleSubscriptionDeleted(subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  const userId = subscription.metadata.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  await updateUserSubscription(userId, {
    subscriptionStatus: 'cancelled',
    isPremium: false,
    stripeSubscriptionId: null,
    cancelledAt: new Date().toISOString()
  });
}

async function handlePaymentSucceeded(invoice) {
  console.log('Payment succeeded for invoice:', invoice.id);
  
  // You can add additional logic here for successful payments
  // e.g., send confirmation email, update usage metrics, etc.
}

async function handlePaymentFailed(invoice) {
  console.log('Payment failed for invoice:', invoice.id);
  
  // Handle failed payments
  // e.g., send notification email, temporarily disable premium features
}

module.exports = router;

