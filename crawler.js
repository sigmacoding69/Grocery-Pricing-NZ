// Price crawler simulation for real-time updates

let crawlerInterval;
let isRunning = false;

// Initialize crawler when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeCrawler();
});

function initializeCrawler() {
    // Start price updates every 30 seconds
    startPriceCrawler();
    
    // Initialize live updates feed
    initializeLiveUpdates();
}

function startPriceCrawler() {
    if (isRunning) return;
    
    isRunning = true;
    console.log('🤖 Price crawler started - simulating real-time updates');
    
    // Update prices every 30 seconds
    crawlerInterval = setInterval(() => {
        simulatePriceUpdate();
    }, 30000);
    
    // Initial update
    setTimeout(() => {
        simulatePriceUpdate();
    }, 5000);
}

function stopPriceCrawler() {
    if (crawlerInterval) {
        clearInterval(crawlerInterval);
        crawlerInterval = null;
        isRunning = false;
        console.log('🛑 Price crawler stopped');
    }
}

function simulatePriceUpdate() {
    // Simulate a price change for a random item
    const items = ['Bananas (1 kg)', 'Milk (2L)', 'Bread (Loaf)', 'Mince Beef (500g)', 'Eggs (12 pack)'];
    const stores = ['Countdown', 'New World', 'PAK\'nSAVE', 'FreshChoice', 'Four Square'];
    
    const randomItem = items[Math.floor(Math.random() * items.length)];
    const randomStore = stores[Math.floor(Math.random() * stores.length)];
    
    // Generate realistic price change (±10%)
    const basePrice = 3.50; // Example base price
    const change = (Math.random() - 0.5) * 0.7; // ±35 cents change
    const newPrice = Math.max(0.99, basePrice + change);
    const priceDirection = change > 0 ? 'up' : 'down';
    
    // Update live feed
    addLiveUpdate({
        item: randomItem,
        store: randomStore,
        price: newPrice,
        change: Math.abs(change),
        direction: priceDirection,
        timestamp: new Date()
    });
    
    // Update dashboard stats if on dashboard page
    if (typeof populateDashboardStats === 'function') {
        populateDashboardStats();
    }
    
    console.log(`📊 Price update: ${randomItem} at ${randomStore} - $${newPrice.toFixed(2)} (${priceDirection})`);
}

function initializeLiveUpdates() {
    const liveUpdatesContainer = document.querySelector('.live-updates');
    if (!liveUpdatesContainer) return;
    
    // Add header if not exists
    if (!liveUpdatesContainer.querySelector('h3')) {
        const headerHTML = `
            <div class="live-updates-header">
                <h3><i class="fas fa-bolt"></i> Live Price Updates</h3>
                <div class="crawler-status">
                    <span class="status-indicator active"></span>
                    <span>Active</span>
                </div>
            </div>
            <div class="updates-feed" id="updatesFeed">
                <div class="update-item initial">
                    <div class="update-info">
                        <span class="item-name">Price crawler initialized</span>
                        <span class="store-name">System</span>
                    </div>
                    <div class="update-meta">
                        <span class="timestamp">${new Date().toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>
        `;
        liveUpdatesContainer.innerHTML = headerHTML;
    }
}

function addLiveUpdate(update) {
    const updatesFeed = document.getElementById('updatesFeed');
    if (!updatesFeed) return;
    
    const updateElement = document.createElement('div');
    updateElement.className = `update-item ${update.direction}`;
    
    const changeIcon = update.direction === 'up' ? 'fa-arrow-up' : 'fa-arrow-down';
    const changeClass = update.direction === 'up' ? 'price-increase' : 'price-decrease';
    
    updateElement.innerHTML = `
        <div class="update-info">
            <span class="item-name">${update.item}</span>
            <span class="store-name">${update.store}</span>
        </div>
        <div class="update-price">
            <span class="price">$${update.price.toFixed(2)}</span>
            <span class="price-change ${changeClass}">
                <i class="fas ${changeIcon}"></i>
                $${update.change.toFixed(2)}
            </span>
        </div>
        <div class="update-meta">
            <span class="timestamp">${update.timestamp.toLocaleTimeString()}</span>
        </div>
    `;
    
    // Add to top of feed
    updatesFeed.insertBefore(updateElement, updatesFeed.firstChild);
    
    // Keep only last 10 updates
    const updates = updatesFeed.querySelectorAll('.update-item:not(.initial)');
    if (updates.length > 10) {
        updates[updates.length - 1].remove();
    }
    
    // Animate new update
    setTimeout(() => {
        updateElement.classList.add('animate');
    }, 100);
}

// Simulated data fetching (in production, this would call real APIs)
async function fetchLatestPrices() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock data
    return {
        timestamp: new Date().toISOString(),
        updates: [
            { item: 'Bananas (1 kg)', store: 'Countdown', price: 3.45, previous: 3.50 },
            { item: 'Milk (2L)', store: 'New World', price: 4.25, previous: 4.50 },
            { item: 'Bread (Loaf)', store: 'PAK\'nSAVE', price: 2.75, previous: 2.80 }
        ]
    };
}

// Update crawler status indicator
function updateCrawlerStatus(status) {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.crawler-status span:last-child');
    
    if (statusIndicator && statusText) {
        statusIndicator.className = `status-indicator ${status}`;
        statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
}

// Handle page visibility changes (pause when tab not active)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        updateCrawlerStatus('paused');
        console.log('📴 Price crawler paused (tab not visible)');
    } else {
        updateCrawlerStatus('active');
        console.log('📡 Price crawler resumed (tab visible)');
    }
});

// Export functions for global use
window.startPriceCrawler = startPriceCrawler;
window.stopPriceCrawler = stopPriceCrawler;
window.simulatePriceUpdate = simulatePriceUpdate;

