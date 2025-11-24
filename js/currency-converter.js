// Currency Converter Module
let currentCurrency = 'USD';
let exchangeRates = {};
let originalCosts = {};

// Fetch exchange rates
async function fetchExchangeRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        exchangeRates = data.rates;
        console.log('Exchange rates loaded:', exchangeRates);
    } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        // Fallback rates
        exchangeRates = {
            USD: 1,
            EUR: 0.92,
            GBP: 0.79,
            INR: 83.12,
            JPY: 149.50,
            AUD: 1.53,
            CAD: 1.36,
            CHF: 0.88,
            CNY: 7.24,
            AED: 3.67
        };
    }
}

// Currency symbols
const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF ',
    CNY: '¥',
    AED: 'AED '
};

// Convert amount from USD to target currency
function convertCurrency(usdAmount, targetCurrency) {
    if (!exchangeRates[targetCurrency]) return usdAmount;
    const rate = exchangeRates[targetCurrency];
    const converted = usdAmount * rate;

    // Format based on currency
    if (targetCurrency === 'JPY' || targetCurrency === 'INR') {
        return Math.round(converted); // No decimals for JPY and INR
    }
    return Math.round(converted * 100) / 100; // 2 decimals for others
}

// Format currency display
function formatCurrency(amount, currency) {
    const symbol = currencySymbols[currency] || currency + ' ';

    if (currency === 'JPY' || currency === 'INR') {
        return `${symbol}${Math.round(amount).toLocaleString()}`;
    }
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Extract numeric value from cost string (e.g., "$500" -> 500)
function extractAmount(costString) {
    if (!costString || costString === '--') return 0;
    // Remove all non-numeric characters except decimal point
    const cleaned = costString.replace(/[^0-9.]/g, '');
    const amount = parseFloat(cleaned) || 0;
    return amount;
}

// Store original USD costs
function storeOriginalCosts() {
    originalCosts = {
        accommodation: extractAmount(document.getElementById('cost-accommodation').textContent),
        transportation: extractAmount(document.getElementById('cost-transportation').textContent),
        food: extractAmount(document.getElementById('cost-food').textContent),
        activities: extractAmount(document.getElementById('cost-activities').textContent),
        total: extractAmount(document.getElementById('cost-total').textContent)
    };
    console.log('Stored original USD costs:', originalCosts);
}

// Update all costs to selected currency
function updateCostsDisplay(currency) {
    if (!originalCosts.total || originalCosts.total === 0) {
        console.warn('No original costs stored yet, storing now...');
        storeOriginalCosts();
        if (!originalCosts.total) {
            console.error('Still no costs available');
            return;
        }
    }

    currentCurrency = currency;
    console.log(`Converting to ${currency}`);

    // Convert and update cost breakdown
    const convertedCosts = {
        accommodation: convertCurrency(originalCosts.accommodation, currency),
        transportation: convertCurrency(originalCosts.transportation, currency),
        food: convertCurrency(originalCosts.food, currency),
        activities: convertCurrency(originalCosts.activities, currency),
        total: convertCurrency(originalCosts.total, currency)
    };

    // Update cost breakdown display
    document.getElementById('cost-accommodation').textContent = formatCurrency(convertedCosts.accommodation, currency);
    document.getElementById('cost-transportation').textContent = formatCurrency(convertedCosts.transportation, currency);
    document.getElementById('cost-food').textContent = formatCurrency(convertedCosts.food, currency);
    document.getElementById('cost-activities').textContent = formatCurrency(convertedCosts.activities, currency);
    document.getElementById('cost-total').textContent = formatCurrency(convertedCosts.total, currency);

    // Convert activity costs in daily itinerary
    const activityCosts = document.querySelectorAll('.activity-cost');
    activityCosts.forEach(costEl => {
        const originalText = costEl.getAttribute('data-original-cost');
        if (originalText) {
            const amount = extractAmount(originalText);
            if (amount > 0) {
                const converted = convertCurrency(amount, currency);
                costEl.textContent = formatCurrency(converted, currency);
            }
        } else {
            // Store original on first run
            costEl.setAttribute('data-original-cost', costEl.textContent);
            const amount = extractAmount(costEl.textContent);
            if (amount > 0) {
                const converted = convertCurrency(amount, currency);
                costEl.textContent = formatCurrency(converted, currency);
            }
        }
    });

    // Convert hotel prices
    const hotelPrices = document.querySelectorAll('.hotel-price');
    hotelPrices.forEach(priceEl => {
        const originalText = priceEl.getAttribute('data-original-price');
        if (originalText) {
            const amount = extractAmount(originalText);
            if (amount > 0) {
                const converted = convertCurrency(amount, currency);
                priceEl.textContent = formatCurrency(converted, currency) + '/night';
            }
        } else {
            // Store original on first run
            priceEl.setAttribute('data-original-price', priceEl.textContent);
            const amount = extractAmount(priceEl.textContent);
            if (amount > 0) {
                const converted = convertCurrency(amount, currency);
                priceEl.textContent = formatCurrency(converted, currency) + '/night';
            }
        }
    });

    console.log(`All prices converted to ${currency}`);
}

// Initialize currency converter
async function initCurrencyConverter() {
    await fetchExchangeRates();

    // Add currency selector to cost card header
    const costCardHeader = document.querySelector('.cost-card .card-header');
    if (costCardHeader && !document.getElementById('currency-select')) {
        // Make header flex
        costCardHeader.style.display = 'flex';
        costCardHeader.style.justifyContent = 'space-between';
        costCardHeader.style.alignItems = 'center';
        costCardHeader.style.flexWrap = 'wrap';
        costCardHeader.style.gap = '15px';

        // Create currency selector
        const currencySelector = document.createElement('div');
        currencySelector.className = 'currency-selector';
        currencySelector.innerHTML = `
            <label for="currency-select" style="margin-right: 8px; color: var(--text-muted); font-size: 0.9rem;">
                <i class="fa-solid fa-coins"></i> Currency:
            </label>
            <select id="currency-select" class="currency-dropdown">
                <option value="USD" selected>USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="AUD">AUD (A$)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="CHF">CHF</option>
                <option value="CNY">CNY (¥)</option>
                <option value="AED">AED</option>
            </select>
        `;

        costCardHeader.appendChild(currencySelector);

        // Add event listener
        const select = document.getElementById('currency-select');
        select.addEventListener('change', (e) => {
            updateCostsDisplay(e.target.value);
        });

        // Store original costs after a short delay
        setTimeout(() => {
            storeOriginalCosts();
        }, 500);

        console.log('Currency converter initialized');
    }
}

// Override the original updateCosts function to store original values
const originalUpdateCosts = window.updateCosts;
window.updateCosts = function (costs) {
    // Call original function
    if (originalUpdateCosts) {
        originalUpdateCosts(costs);
    } else {
        // Fallback if original doesn't exist
        document.getElementById('cost-accommodation').innerText = costs.accommodation;
        document.getElementById('cost-transportation').innerText = costs.transportation;
        document.getElementById('cost-food').innerText = costs.food;
        document.getElementById('cost-activities').innerText = costs.activities;
        document.getElementById('cost-total').innerText = costs.total;
    }

    // Store original USD costs after display is updated
    setTimeout(() => {
        storeOriginalCosts();
        // Reset to USD
        const select = document.getElementById('currency-select');
        if (select) {
            select.value = 'USD';
            currentCurrency = 'USD';
        }
    }, 200);
};

// Watch for results section to appear
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        const resultsSection = document.getElementById('results-section');
        if (resultsSection && resultsSection.style.display !== 'none') {
            setTimeout(() => {
                initCurrencyConverter();
            }, 1000);
            observer.disconnect(); // Stop observing once initialized
        }
    });
});

// Start observing
document.addEventListener('DOMContentLoaded', () => {
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
        observer.observe(resultsSection, {
            attributes: true,
            attributeFilter: ['style']
        });

        // Also check if already visible
        if (resultsSection.style.display !== 'none') {
            setTimeout(() => {
                initCurrencyConverter();
            }, 1000);
        }
    }
});
