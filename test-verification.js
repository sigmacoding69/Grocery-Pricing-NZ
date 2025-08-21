// Test script to verify and fix subscription status
const { getUserById, updateUserSubscription } = require('./models/User');

async function testVerification() {
    console.log('🔍 Testing subscription verification...');
    
    // Test user ID (Terry Zhao who has stripeCustomerId)
    const userId = '420dbe15-b020-44a3-8f64-1e8474e34dfb';
    
    try {
        // Get current user data
        const user = await getUserById(userId);
        console.log('📄 Current user data:', {
            name: user.name,
            email: user.email,
            isPremium: user.isPremium,
            stripeCustomerId: user.stripeCustomerId
        });
        
        // Manually set user to premium for testing
        console.log('⬆️ Updating user to premium...');
        const updatedUser = await updateUserSubscription(userId, {
            isPremium: true,
            subscriptionStartDate: new Date().toISOString(),
            lastPaymentDate: new Date().toISOString()
        });
        
        console.log('✅ User updated successfully:', {
            name: updatedUser.name,
            email: updatedUser.email,
            isPremium: updatedUser.isPremium,
            subscriptionStartDate: updatedUser.subscriptionStartDate
        });
        
        // Verify the update
        const verifiedUser = await getUserById(userId);
        console.log('🔍 Verification check:', {
            isPremium: verifiedUser.isPremium,
            shouldShowPremium: verifiedUser.isPremium ? 'YES' : 'NO'
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Run the test
testVerification();

