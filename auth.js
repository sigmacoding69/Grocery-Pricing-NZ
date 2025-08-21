// Authentication and User Management System
// This is a frontend-only demo - in production, you'd need a proper backend

// Stripe configuration
let stripe = null;

// Initialize Stripe when available
function initializeStripe() {
    try {
        if (typeof Stripe !== 'undefined') {
            stripe = Stripe('pk_test_your_stripe_publishable_key_here');
            console.log('✅ Stripe initialized successfully');
            return true;
        } else {
            console.warn('⚠️ Stripe not available yet');
            return false;
        }
    } catch (error) {
        console.error('❌ Error initializing Stripe:', error);
        return false;
    }
}

// Try to initialize Stripe immediately
initializeStripe();

// Also try after page load
window.addEventListener('load', function() {
    if (!stripe) {
        setTimeout(initializeStripe, 1000);
    }
});

// User state management
let currentUser = null;
let userSubscription = null;

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthState();
    setupAuthEventListeners();
});

async function checkAuthState() {
    const savedUser = localStorage.getItem('grocerycompare_user');
    const token = localStorage.getItem('grocerycompare_token');
    
    if (savedUser && token) {
        try {
            // Verify token with backend
            const response = await fetch('/api/auth/verify', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                currentUser = JSON.parse(savedUser);
                await checkSubscriptionStatus();
                updateUIForLoggedInUser();
            } else {
                // Token invalid, clear storage
                handleLogout();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            // If offline, use cached data
            currentUser = JSON.parse(savedUser);
            updateUIForLoggedInUser();
        }
    } else {
        updateUIForLoggedOutUser();
    }
}

function setupAuthEventListeners() {
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => showAuthModal('login'));
    }
    
    // Signup button
    const signupBtn = document.getElementById('signupBtn');
    if (signupBtn) {
        signupBtn.addEventListener('click', () => showAuthModal('signup'));
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Subscription status button
    const subscriptionBtn = document.getElementById('subscriptionStatus');
    if (subscriptionBtn) {
        subscriptionBtn.addEventListener('click', handleSubscriptionClick);
    }
}

function showAuthModal(mode = 'login') {
    const modal = document.getElementById('authModal');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (modal && loginForm && signupForm) {
        modal.classList.remove('hidden');
        
        if (mode === 'login') {
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        } else {
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
        }
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function switchToSignup() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm && signupForm) {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    }
}

function switchToLogin() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm && signupForm) {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    }
}

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
            // Save user data and token
            currentUser = data.user;
            localStorage.setItem('grocerycompare_token', data.token);
            localStorage.setItem('grocerycompare_user', JSON.stringify(data.user));
            
            // Check subscription status
            await checkSubscriptionStatus();
            
            // Update UI and close modal
            updateUIForLoggedInUser();
            closeAuthModal();
            
            showToast('Welcome back! You\'re now logged in.', 'success');
        } else {
            showToast(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed. Please check your connection.', 'error');
    }
}

async function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Save user data and token
            currentUser = data.user;
            localStorage.setItem('grocerycompare_token', data.token);
            localStorage.setItem('grocerycompare_user', JSON.stringify(data.user));
            
            // Initialize free trial
            initializeFreeTrial();
            
            // Update UI and close modal
            updateUIForLoggedInUser();
            closeAuthModal();
            
            showToast('Account created successfully! Welcome to GroceryCompare NZ.', 'success');
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showToast('Registration failed. Please check your connection.', 'error');
    }
}

async function handleLogout() {
    const token = localStorage.getItem('grocerycompare_token');
    
    if (token) {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
    
    // Clear user data
    currentUser = null;
    userSubscription = null;
    localStorage.removeItem('grocerycompare_user');
    localStorage.removeItem('grocerycompare_token');
    localStorage.removeItem('grocerycompare_subscription');
    localStorage.removeItem('ai_messages_used');
    localStorage.removeItem('trial_start_date');
    
    // Update UI
    updateUIForLoggedOutUser();
    
    showToast('You\'ve been logged out successfully.', 'info');
}

function updateUIForLoggedInUser() {
    const userSection = document.getElementById('userSection');
    const authSection = document.getElementById('authSection');
    const userEmail = document.getElementById('userEmail');
    const subscriptionStatus = document.getElementById('subscriptionStatus');
    
    if (userSection && authSection && userEmail && subscriptionStatus) {
        userSection.classList.remove('hidden');
        authSection.classList.add('hidden');
        
        userEmail.textContent = currentUser.email;
        
        // Update subscription status
        if (userSubscription && userSubscription.status === 'active') {
            subscriptionStatus.textContent = 'Premium';
            subscriptionStatus.className = 'subscription-btn premium';
        } else {
            subscriptionStatus.textContent = 'Free';
            subscriptionStatus.className = 'subscription-btn free';
        }
    }
    
    // Update AI assistant access
    updateAIAccess();
}

function updateUIForLoggedOutUser() {
    const userSection = document.getElementById('userSection');
    const authSection = document.getElementById('authSection');
    
    if (userSection && authSection) {
        userSection.classList.add('hidden');
        authSection.classList.remove('hidden');
    }
    
    // Show premium gate for AI assistant if on that page
    showPremiumGateIfNeeded();
}

function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

async function checkSubscriptionStatus() {
    const token = localStorage.getItem('grocerycompare_token');
    
    if (!token) return;
    
    try {
        const response = await fetch('/api/stripe/subscription-status', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            userSubscription = data;
            
            // Update user object with premium status
            if (currentUser) {
                currentUser.isPremium = data.isPremium;
                localStorage.setItem('grocerycompare_user', JSON.stringify(currentUser));
            }
        }
    } catch (error) {
        console.error('Subscription check failed:', error);
    }
}

function initializeFreeTrial() {
    // Initialize free trial for new users
    const trialData = {
        startDate: new Date().toISOString(),
        messagesUsed: 0,
        dailyLimit: 3
    };
    
    localStorage.setItem('trial_start_date', trialData.startDate);
    localStorage.setItem('ai_messages_used', '0');
}

function handleSubscriptionClick() {
    if (userSubscription && userSubscription.status === 'active') {
        // Show subscription management
        showSubscriptionManagement();
    } else {
        // Show upgrade modal
        showPremiumModal();
    }
}

// Add manual subscription refresh function for debugging
async function refreshSubscriptionStatus() {
    try {
        showToast && showToast('Refreshing subscription status...', 'info');
        await checkSubscriptionStatus();
        updateUIForLoggedInUser();
        
        const status = userSubscription && userSubscription.isPremium ? 'Premium' : 'Free';
        showToast && showToast(`Subscription status updated: ${status}`, 'success');
    } catch (error) {
        console.error('Error refreshing subscription:', error);
        showToast && showToast('Failed to refresh subscription status', 'error');
    }
}

// Make function available globally for manual testing
window.refreshSubscriptionStatus = refreshSubscriptionStatus;

function showPremiumModal() {
    const modal = document.getElementById('premiumModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closePremiumModal() {
    const modal = document.getElementById('premiumModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function handleSubscription() {
    if (!currentUser) {
        showAuthModal('signup');
        return;
    }
    
    try {
        // Create Stripe checkout session (in production, this would call your backend)
        const checkoutSession = await createCheckoutSession();
        
        // Check if Stripe is available
        if (!stripe) {
            // Try to initialize Stripe again
            if (!initializeStripe()) {
                showToast('Payment system not ready. Please refresh the page and try again.', 'error');
                return;
            }
        }
        
        // Redirect to Stripe checkout
        const result = await stripe.redirectToCheckout({
            sessionId: checkoutSession.id
        });
        
        if (result.error) {
            showToast('Payment failed: ' + result.error.message, 'error');
        }
    } catch (error) {
        console.error('Subscription error:', error);
        showToast('Something went wrong. Please try again.', 'error');
    }
}

async function createCheckoutSession() {
    const token = localStorage.getItem('grocerycompare_token');
    
    if (!token) {
        throw new Error('Please log in to subscribe');
    }
    
    try {
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
            throw new Error(data.message || 'Failed to create checkout session');
        }
    } catch (error) {
        console.error('Checkout session error:', error);
        throw error;
    }
}

function simulateSuccessfulSubscription() {
    // Create subscription object
    const subscription = {
        id: 'sub_' + Math.random().toString(36).substr(2, 9),
        customerId: currentUser.id,
        status: 'active',
        planId: 'premium_monthly',
        planName: 'Premium Monthly',
        amount: 999, // $9.99 in cents
        currency: 'nzd',
        startDate: new Date().toISOString(),
        nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    // Save subscription
    userSubscription = subscription;
    localStorage.setItem('grocerycompare_subscription', JSON.stringify(subscription));
    
    // Update UI
    updateUIForLoggedInUser();
    closePremiumModal();
    
    showToast('Welcome to Premium! You now have unlimited access to all features.', 'success');
}

function showSubscriptionManagement() {
    showToast('Subscription management coming soon! Contact support for changes.', 'info');
}

// AI Access Control
function updateAIAccess() {
    if (!currentUser) {
        showPremiumGateIfNeeded();
        return;
    }
    
    const isPremium = userSubscription && userSubscription.status === 'active';
    const messagesUsed = parseInt(localStorage.getItem('ai_messages_used') || '0');
    const dailyLimit = 3;
    
    if (isPremium) {
        // Premium user - full access
        hideAllGates();
        showAIInterface();
    } else if (messagesUsed < dailyLimit) {
        // Free user with messages remaining
        hideAllGates();
        showAIInterface();
        showFreeTrialBanner(dailyLimit - messagesUsed);
    } else {
        // Free user - limit reached
        showPremiumGate();
        hideAIInterface();
    }
}

function showPremiumGateIfNeeded() {
    if (window.location.pathname.includes('ai-assistant.html')) {
        showPremiumGate();
        hideAIInterface();
    }
}

function showPremiumGate() {
    const gate = document.getElementById('premiumGate');
    if (gate) {
        gate.classList.remove('hidden');
    }
}

function hidePremiumGate() {
    const gate = document.getElementById('premiumGate');
    if (gate) {
        gate.classList.add('hidden');
    }
}

function showFreeTrialBanner(remainingMessages) {
    const banner = document.getElementById('freeTrialSection');
    const messageCount = document.getElementById('trialMessages');
    
    if (banner && messageCount) {
        banner.classList.remove('hidden');
        messageCount.textContent = remainingMessages;
    }
}

function hideFreeTrialBanner() {
    const banner = document.getElementById('freeTrialSection');
    if (banner) {
        banner.classList.add('hidden');
    }
}

function showAIInterface() {
    const interface = document.getElementById('chatbotSection');
    if (interface) {
        interface.classList.remove('hidden');
    }
}

function hideAIInterface() {
    const interface = document.getElementById('chatbotSection');
    if (interface) {
        interface.classList.add('hidden');
    }
}

function hideAllGates() {
    hidePremiumGate();
    hideFreeTrialBanner();
}

async function useAIMessage() {
    if (!currentUser) {
        showAuthModal('signup');
        return false;
    }
    
    const token = localStorage.getItem('grocerycompare_token');
    
    try {
        const response = await fetch('/api/users/use-ai-message', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (response.ok && data.allowed) {
            updateAIAccess();
            return true;
        } else {
            updateAIAccess();
            if (data.message) {
                showToast(data.message, 'warning');
            }
            return false;
        }
    } catch (error) {
        console.error('AI message usage error:', error);
        // Fallback to local storage for offline use
        const messagesUsed = parseInt(localStorage.getItem('ai_messages_used') || '0');
        const dailyLimit = 3;
        
        if (messagesUsed < dailyLimit) {
            localStorage.setItem('ai_messages_used', (messagesUsed + 1).toString());
            updateAIAccess();
            return true;
        } else {
            updateAIAccess();
            return false;
        }
    }
}

// Utility functions
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add to page
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// Reset daily usage at midnight (simplified version)
function resetDailyUsage() {
    const lastReset = localStorage.getItem('last_usage_reset');
    const today = new Date().toDateString();
    
    if (lastReset !== today) {
        localStorage.setItem('ai_messages_used', '0');
        localStorage.setItem('last_usage_reset', today);
        updateAIAccess();
    }
}

// Check for daily reset on page load
document.addEventListener('DOMContentLoaded', resetDailyUsage);

// Export functions for use in other scripts
window.authSystem = {
    isLoggedIn: () => currentUser !== null,
    isPremium: () => userSubscription && userSubscription.status === 'active',
    getCurrentUser: () => currentUser,
    useAIMessage: useAIMessage,
    showPremiumModal: showPremiumModal
};

// Make functions globally available for onclick handlers
window.showAuthModal = showAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchToSignup = switchToSignup;
window.switchToLogin = switchToLogin;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.showPremiumModal = showPremiumModal;
window.closePremiumModal = closePremiumModal;
window.handleSubscription = handleSubscription;
