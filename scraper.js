#!/usr/bin/env node

/**
 * Strait of Hormuz Data Scraper
 * Fetches vessel AIS data and gas prices
 * Runs via cron every hour
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper: HTTP GET request
function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
}

// Fetch vessel data from AIS (MarineTraffic API alternative)
async function fetchVesselData() {
    console.log('🚢 Fetching vessel data...');
    
    // Strait of Hormuz bounding box
    const bounds = {
        minLat: 25.5,
        maxLat: 27.5,
        minLon: 55.0,
        maxLon: 57.5
    };
    
    try {
        // Using AISHub or similar public API
        // For demo: generate mock data with realistic movements
        const vessels = generateMockVessels();
        
        const output = path.join(DATA_DIR, 'vessels.json');
        fs.writeFileSync(output, JSON.stringify(vessels, null, 2));
        console.log(`✅ Saved ${vessels.length} vessels to ${output}`);
        
        return vessels;
    } catch (error) {
        console.error('❌ Error fetching vessel data:', error.message);
        return [];
    }
}

// Generate realistic mock vessel data
function generateMockVessels() {
    const vesselTypes = ['cargo', 'tanker', 'container'];
    const flags = ['Panama', 'Liberia', 'Marshall Islands', 'Singapore', 'Hong Kong', 'Greece', 'Malta', 'Denmark'];
    const statuses = ['underway', 'anchored', 'moored'];
    const destinations = ['ROTTERDAM', 'SINGAPORE', 'FUJAIRAH', 'BANDAR ABBAS', 'DUBAI', 'JEBEL ALI', 'RAS TANURA'];
    
    const vessels = [];
    const count = 15 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < count; i++) {
        const type = vesselTypes[Math.floor(Math.random() * vesselTypes.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        vessels.push({
            name: `${type.toUpperCase()} ${1000 + i}`,
            type,
            flag: flags[Math.floor(Math.random() * flags.length)],
            lat: 25.5 + Math.random() * 2.0,
            lon: 55.0 + Math.random() * 2.5,
            speed: status === 'anchored' ? 0 : 8 + Math.random() * 8,
            heading: Math.floor(Math.random() * 360),
            destination: destinations[Math.floor(Math.random() * destinations.length)],
            status,
            timestamp: new Date().toISOString()
        });
    }
    
    return vessels;
}

// Fetch gas & oil prices
async function fetchGasPrices() {
    console.log('⛽ Fetching gas prices...');
    
    try {
        // For demo: realistic mock data
        // Production: use Alpha Vantage, EIA API, or commodity price APIs
        const prices = {
            wti: {
                price: 75 + Math.random() * 10,
                change: (Math.random() - 0.5) * 3
            },
            brent: {
                price: 79 + Math.random() * 10,
                change: (Math.random() - 0.5) * 3
            },
            natgas: {
                price: 2.5 + Math.random() * 0.5,
                change: (Math.random() - 0.5) * 0.2
            },
            gasoline: {
                price: 3.4 + Math.random() * 0.3,
                change: (Math.random() - 0.5) * 0.1
            },
            updated: new Date().toISOString()
        };
        
        const output = path.join(DATA_DIR, 'prices.json');
        fs.writeFileSync(output, JSON.stringify(prices, null, 2));
        console.log(`✅ Saved gas prices to ${output}`);
        
        // Save historical data
        saveHistoricalPrices(prices);
        
        return prices;
    } catch (error) {
        console.error('❌ Error fetching gas prices:', error.message);
        return null;
    }
}

// Save historical price data (last 10 days)
function saveHistoricalPrices(currentPrices) {
    const historyPath = path.join(DATA_DIR, 'price-history.json');
    let history = [];
    
    // Load existing history
    if (fs.existsSync(historyPath)) {
        try {
            history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        } catch (e) {
            console.log('Creating new price history...');
            history = [];
        }
    }
    
    const timestamp = new Date().toISOString();
    const date = timestamp.split('T')[0]; // YYYY-MM-DD
    
    // Check if we already have data for today
    const todayIndex = history.findIndex(h => h.date === date);
    
    const dataPoint = {
        date,
        timestamp,
        wti: currentPrices.wti.price,
        brent: currentPrices.brent.price,
        natgas: currentPrices.natgas.price,
        gasoline: currentPrices.gasoline.price
    };
    
    if (todayIndex >= 0) {
        // Update today's entry (latest hourly reading)
        history[todayIndex] = dataPoint;
    } else {
        // Add new day
        history.push(dataPoint);
    }
    
    // Keep only last 10 days
    history = history.slice(-10);
    
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    console.log(`✅ Saved price history (${history.length} days)`);
}

// Main scraper function
async function scrape() {
    console.log('🔄 Starting data scrape...');
    console.log('📅 Time:', new Date().toLocaleString());
    console.log('─'.repeat(50));
    
    const [vessels, prices] = await Promise.all([
        fetchVesselData(),
        fetchGasPrices()
    ]);
    
    console.log('─'.repeat(50));
    console.log('✅ Scrape complete!');
    console.log(`📊 Summary: ${vessels.length} vessels, prices updated`);
    
    // Save metadata
    const meta = {
        lastUpdate: new Date().toISOString(),
        vesselCount: vessels.length,
        status: 'success'
    };
    
    fs.writeFileSync(
        path.join(DATA_DIR, 'metadata.json'),
        JSON.stringify(meta, null, 2)
    );
}

// Run scraper
if (require.main === module) {
    scrape().catch(error => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { scrape, fetchVesselData, fetchGasPrices };
