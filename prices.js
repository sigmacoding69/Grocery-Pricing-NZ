// Prices page functionality with enhanced features

// Initialize filtered data
let filteredData = [];
let groceryDataLoaded = false;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('prices.html')) {
        initializePricesPage();
    }
});

async function initializePricesPage() {
    // Wait for groceryData to be available or fetch from API
    await ensureGroceryDataLoaded();
    
    if (groceryDataLoaded) {
        filteredData = [...groceryData];
        displayGroceries(groceryData);
        updatePriceStats();
        setupFilters();
        setupPriceChart();
        setupSearch();
    } else {
        displayError();
    }
}

async function ensureGroceryDataLoaded() {
    // Check if groceryData is available from script.js
    if (typeof groceryData !== 'undefined' && groceryData.length > 0) {
        groceryDataLoaded = true;
        return;
    }
    
    // If not available, try to fetch from API
    try {
        const response = await fetch('/api/prices');
        if (response.ok) {
            const result = await response.json();
            window.groceryData = result.data || [];
            groceryDataLoaded = true;
        } else {
            throw new Error('Failed to fetch from API');
        }
    } catch (error) {
        console.error('Error loading grocery data:', error);
        // Use fallback data if API fails
        window.groceryData = getFallbackData();
        groceryDataLoaded = true;
    }
}

function getFallbackData() {
    return [
        {
            id: 1,
            name: "Bananas (1 kg)",
            category: "fruits",
            prices: [
                { store: "Countdown", price: 3.50, distance: 2.1 },
                { store: "New World", price: 3.99, distance: 1.8 },
                { store: "PAK'nSAVE", price: 2.99, distance: 3.2 },
                { store: "FreshChoice", price: 3.79, distance: 2.5 }
            ]
        },
        {
            id: 2,
            name: "Mince Beef (500g)",
            category: "meat",
            prices: [
                { store: "Countdown", price: 8.50, distance: 2.1 },
                { store: "New World", price: 9.99, distance: 1.8 },
                { store: "PAK'nSAVE", price: 7.50, distance: 3.2 },
                { store: "The Mad Butcher", price: 8.99, distance: 1.2 }
            ]
        },
        {
            id: 3,
            name: "Anchor Milk (2L)",
            category: "dairy",
            prices: [
                { store: "Countdown", price: 4.20, distance: 2.1 },
                { store: "New World", price: 4.50, distance: 1.8 },
                { store: "PAK'nSAVE", price: 3.80, distance: 3.2 },
                { store: "Four Square", price: 4.70, distance: 2.5 }
            ]
        }
    ];
}

function displayError() {
    const grid = document.getElementById('groceryGrid');
    if (grid) {
        grid.innerHTML = `
            <div class="no-results">
                <h3>Unable to load price data</h3>
                <p>We're having trouble loading the latest prices. Please try refreshing the page or check back later.</p>
                <button onclick="location.reload()" class="refresh-btn">
                    <i class="fas fa-refresh"></i> Refresh Page
                </button>
            </div>
        `;
    }
}

function setupFilters() {
    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterByCategory);
    }
    
    // Sort filter
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', sortPrices);
    }
    
    // Store filter
    const storeFilter = document.getElementById('storeFilter');
    if (storeFilter) {
        storeFilter.addEventListener('change', filterByStore);
    }
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchGroceries();
            }
        });
    }
}

function searchGroceries() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (searchTerm.trim() === '') {
        filteredData = [...groceryData];
    } else {
        filteredData = groceryData.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm) ||
            item.prices.some(p => p.store.toLowerCase().includes(searchTerm))
        );
    }
    
    displayGroceries(filteredData);
    updatePriceStats();
}

function filterByCategory() {
    const category = document.getElementById('categoryFilter').value;
    
    if (category === '') {
        filteredData = [...groceryData];
    } else {
        filteredData = groceryData.filter(item => item.category === category);
    }
    
    displayGroceries(filteredData);
    updatePriceStats();
}

function filterByStore() {
    const storeName = document.getElementById('storeFilter').value.toLowerCase();
    
    if (storeName === '') {
        filteredData = [...groceryData];
    } else {
        filteredData = groceryData.filter(item => 
            item.prices.some(p => p.store.toLowerCase().includes(storeName))
        );
    }
    
    displayGroceries(filteredData);
    updatePriceStats();
}

function sortPrices() {
    const sortType = document.getElementById('sortFilter').value;
    
    switch (sortType) {
        case 'name':
            filteredData.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'price-low':
            filteredData.sort((a, b) => getLowestPrice(a) - getLowestPrice(b));
            break;
        case 'price-high':
            filteredData.sort((a, b) => getHighestPrice(b) - getHighestPrice(a));
            break;
        case 'savings':
            filteredData.sort((a, b) => getSavings(b) - getSavings(a));
            break;
        case 'updated':
            // Sort by most recently updated (simulated)
            filteredData.sort(() => Math.random() - 0.5);
            break;
    }
    
    displayGroceries(filteredData);
}

function getLowestPrice(item) {
    return Math.min(...item.prices.map(p => p.price));
}

function getHighestPrice(item) {
    return Math.max(...item.prices.map(p => p.price));
}

function getSavings(item) {
    const lowest = getLowestPrice(item);
    const highest = getHighestPrice(item);
    return highest - lowest;
}

function displayGroceries(data) {
    const grid = document.getElementById('groceryGrid');
    if (!grid) return;
    
    if (data.length === 0) {
        grid.innerHTML = '<div class="no-results"><h3>No groceries found matching your criteria.</h3><p>Try adjusting your filters or search terms.</p></div>';
        return;
    }
    
    grid.innerHTML = data.map(item => {
        const sortedPrices = [...item.prices].sort((a, b) => a.price - b.price);
        const lowestPrice = sortedPrices[0];
        const highestPrice = sortedPrices[sortedPrices.length - 1];
        const savings = highestPrice.price - lowestPrice.price;
        
        return `
            <div class="grocery-item enhanced" data-item-id="${item.id}">
                <div class="grocery-header">
                    <h3 class="grocery-name">${item.name}</h3>
                    <span class="category-badge">${item.category}</span>
                    <div class="item-actions">
                        <button onclick="toggleFavorite(${item.id})" class="favorite-btn" title="Add to favorites">
                            <i class="far fa-heart"></i>
                        </button>
                        <button onclick="addToPriceAlert(${item.id})" class="alert-btn" title="Set price alert">
                            <i class="fas fa-bell"></i>
                        </button>
                    </div>
                </div>
                
                <div class="price-comparison-list">
                    ${sortedPrices.map(priceItem => `
                        <div class="price-item enhanced" data-store="${priceItem.store}">
                            <div class="store-info">
                                <span class="store-name">${priceItem.store}</span>
                                <span class="store-distance">${priceItem.distance} km</span>
                            </div>
                            <div class="price-info">
                                <span class="price ${priceItem.price === lowestPrice.price ? 'lowest' : priceItem.price === highestPrice.price ? 'highest' : ''}" data-item-id="${item.id}" data-store="${priceItem.store}">
                                    <span class="price-amount">$${priceItem.price.toFixed(2)} NZD</span>
                                </span>
                                <button onclick="viewPriceHistory(${item.id}, '${priceItem.store}')" class="history-btn" title="View price history">
                                    <i class="fas fa-chart-line"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                ${savings > 0 ? `
                    <div class="savings-info">
                        <span class="savings">Save $${savings.toFixed(2)} NZD by choosing ${lowestPrice.store}</span>
                        <div class="savings-percentage">${((savings / highestPrice.price) * 100).toFixed(1)}% savings</div>
                    </div>
                ` : ''}
                
                <div class="item-stats">
                    <div class="stat">
                        <span class="stat-label">Avg Price:</span>
                        <span class="stat-value">$${(item.prices.reduce((sum, p) => sum + p.price, 0) / item.prices.length).toFixed(2)}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Price Range:</span>
                        <span class="stat-value">$${savings.toFixed(2)}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Stores:</span>
                        <span class="stat-value">${item.prices.length}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updatePriceStats() {
    if (!filteredData.length) return;
    
    // Update total items
    const totalItemsElement = document.getElementById('totalItems');
    if (totalItemsElement) {
        totalItemsElement.textContent = filteredData.length;
    }
    
    // Update average savings
    const avgSavingsElement = document.getElementById('avgSavings');
    if (avgSavingsElement) {
        const totalSavings = filteredData.reduce((sum, item) => sum + getSavings(item), 0);
        const avgSavings = totalSavings / filteredData.length;
        avgSavingsElement.textContent = `$${avgSavings.toFixed(2)}`;
    }
    
    // Update best store
    const bestStoreElement = document.getElementById('bestStore');
    if (bestStoreElement) {
        const storeSavings = {};
        
        filteredData.forEach(item => {
            const lowestPrice = getLowestPrice(item);
            const bestStore = item.prices.find(p => p.price === lowestPrice).store;
            storeSavings[bestStore] = (storeSavings[bestStore] || 0) + 1;
        });
        
        const bestStore = Object.keys(storeSavings).reduce((a, b) => 
            storeSavings[a] > storeSavings[b] ? a : b
        );
        
        bestStoreElement.textContent = bestStore;
    }
}

function setupPriceChart() {
    const canvas = document.getElementById('priceChart');
    if (!canvas || typeof Chart === 'undefined') return;
    
    const ctx = canvas.getContext('2d');
    
    // Generate sample price trend data
    const days = 7;
    const labels = [];
    const datasets = [];
    
    // Generate last 7 days
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-NZ', { weekday: 'short' }));
    }
    
    // Create datasets for top 3 most popular items
    const popularItems = filteredData.slice(0, 3);
    const colors = ['#667eea', '#f093fb', '#28a745'];
    
    popularItems.forEach((item, index) => {
        const basePrice = getLowestPrice(item);
        const data = [];
        
        // Generate realistic price fluctuations
        for (let i = 0; i < days; i++) {
            const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
            data.push(+(basePrice * (1 + variation)).toFixed(2));
        }
        
        datasets.push({
            label: item.name,
            data: data,
            borderColor: colors[index],
            backgroundColor: colors[index] + '20',
            borderWidth: 2,
            tension: 0.4
        });
    });
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Price Trends (Last 7 Days)'
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

// Enhanced functionality for premium features
function toggleFavorite(itemId) {
    if (!window.authSystem || !window.authSystem.isLoggedIn()) {
        showAuthModal('signup');
        return;
    }
    
    // Toggle favorite status (simplified implementation)
    const favoriteBtn = event.target;
    const isCurrentlyFavorite = favoriteBtn.classList.contains('favorited');
    
    if (isCurrentlyFavorite) {
        favoriteBtn.classList.remove('favorited');
        favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
        showToast('Removed from favorites', 'info');
    } else {
        favoriteBtn.classList.add('favorited');
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
        showToast('Added to favorites', 'success');
    }
}

function addToPriceAlert(itemId) {
    if (!window.authSystem || !window.authSystem.isLoggedIn()) {
        showAuthModal('signup');
        return;
    }
    
    if (!window.authSystem.isPremium()) {
        showPremiumModal();
        return;
    }
    
    // Premium feature: Set price alert
    const item = groceryData.find(i => i.id === itemId);
    if (item) {
        const targetPrice = prompt(`Set price alert for ${item.name}. Current lowest price: $${getLowestPrice(item).toFixed(2)} NZD\n\nAlert me when price drops below:`);
        
        if (targetPrice && !isNaN(targetPrice)) {
            showToast(`Price alert set for ${item.name} at $${parseFloat(targetPrice).toFixed(2)} NZD`, 'success');
        }
    }
}

function viewPriceHistory(itemId, store) {
    if (!window.authSystem || !window.authSystem.isLoggedIn()) {
        showAuthModal('signup');
        return;
    }
    
    if (!window.authSystem.isPremium()) {
        showPremiumModal();
        return;
    }
    
    // Premium feature: View detailed price history
    const item = groceryData.find(i => i.id === itemId);
    if (item) {
        showToast(`Opening price history for ${item.name} at ${store}`, 'info');
        // In a real app, this would open a detailed price history modal
    }
}

async function refreshPrices() {
    // Show loading state
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        refreshBtn.disabled = true;
    }
    
    try {
        // Try to fetch fresh data from API
        const response = await fetch('/api/prices');
        if (response.ok) {
            const result = await response.json();
            window.groceryData = result.data || [];
            filteredData = [...groceryData];
            displayGroceries(filteredData);
            updatePriceStats();
            
            // Update last updated time
            const lastUpdateElement = document.getElementById('lastUpdateTime');
            if (lastUpdateElement) {
                lastUpdateElement.textContent = new Date().toLocaleTimeString();
            }
            
            if (typeof showToast === 'function') {
                showToast('Price data refreshed!', 'success');
            }
        } else {
            throw new Error('Failed to refresh data');
        }
    } catch (error) {
        console.error('Error refreshing prices:', error);
        if (typeof showToast === 'function') {
            showToast('Unable to refresh prices. Using cached data.', 'warning');
        }
    } finally {
        // Reset refresh button
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-refresh"></i> Refresh';
            refreshBtn.disabled = false;
        }
    }
}

// filteredData is now initialized in initializePricesPage()


