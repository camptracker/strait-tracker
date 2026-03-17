// Strait of Hormuz Tracker App
let map;
let vesselMarkers = [];
let currentFilter = 'all';
let vesselData = [];
let priceHistory = [];
let currentChart = 'wti';

// Initialize map centered on Strait of Hormuz
function initMap() {
    map = L.map('map').setView([26.5667, 56.2500], 9);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);
    
    // Add Strait of Hormuz boundary
    const straitBounds = [
        [25.5, 55.0],
        [27.5, 57.5]
    ];
    L.rectangle(straitBounds, {
        color: '#ff6b6b',
        weight: 2,
        fillOpacity: 0.1,
        dashArray: '10, 10'
    }).addTo(map).bindPopup('Strait of Hormuz Area');
}

// Load vessel data
async function loadVesselData() {
    try {
        const response = await fetch('data/vessels.json');
        if (response.ok) {
            vesselData = await response.json();
            updateVesselDisplay();
            updateStats();
        } else {
            // Use mock data if file doesn't exist yet
            loadMockData();
        }
    } catch (error) {
        console.log('Loading mock data...');
        loadMockData();
    }
}

// Load gas price data
async function loadGasPrices() {
    try {
        const response = await fetch('data/prices.json');
        if (response.ok) {
            const prices = await response.json();
            updatePriceDisplay(prices);
        } else {
            loadMockPrices();
        }
    } catch (error) {
        loadMockPrices();
    }
}

// Mock vessel data
function loadMockData() {
    vesselData = [
        {
            name: "MAERSK ESSEX",
            type: "container",
            flag: "Denmark",
            lat: 26.45,
            lon: 56.15,
            speed: 14.2,
            heading: 285,
            destination: "ROTTERDAM",
            status: "underway"
        },
        {
            name: "VEGA OCEAN",
            type: "tanker",
            flag: "Liberia",
            lat: 26.72,
            lon: 56.38,
            speed: 11.5,
            heading: 90,
            destination: "FUJAIRAH",
            status: "underway"
        },
        {
            name: "BULK CARRIER 1",
            type: "cargo",
            flag: "Panama",
            lat: 26.30,
            lon: 56.50,
            speed: 0,
            heading: 0,
            destination: "BANDAR ABBAS",
            status: "anchored"
        },
        {
            name: "NOVA TRADER",
            type: "cargo",
            flag: "Marshall Islands",
            lat: 26.88,
            lon: 56.05,
            speed: 13.8,
            heading: 180,
            destination: "SINGAPORE",
            status: "underway"
        },
        {
            name: "GULF STAR",
            type: "tanker",
            flag: "Saudi Arabia",
            lat: 26.55,
            lon: 56.65,
            speed: 10.2,
            heading: 270,
            destination: "RAS TANURA",
            status: "underway"
        }
    ];
    updateVesselDisplay();
    updateStats();
}

// Mock price data
function loadMockPrices() {
    const mockPrices = {
        wti: { price: 77.45, change: 1.25 },
        brent: { price: 81.30, change: 0.85 },
        natgas: { price: 2.65, change: -0.05 },
        gasoline: { price: 3.52, change: 0.03 },
        updated: new Date().toISOString()
    };
    updatePriceDisplay(mockPrices);
}

// Update price display
function updatePriceDisplay(prices) {
    document.getElementById('wti-price').textContent = `$${prices.wti.price.toFixed(2)}`;
    document.getElementById('wti-change').textContent = formatChange(prices.wti.change);
    document.getElementById('wti-change').className = `price-change ${prices.wti.change >= 0 ? 'positive' : 'negative'}`;
    
    document.getElementById('brent-price').textContent = `$${prices.brent.price.toFixed(2)}`;
    document.getElementById('brent-change').textContent = formatChange(prices.brent.change);
    document.getElementById('brent-change').className = `price-change ${prices.brent.change >= 0 ? 'positive' : 'negative'}`;
    
    document.getElementById('natgas-price').textContent = `$${prices.natgas.price.toFixed(2)}`;
    document.getElementById('natgas-change').textContent = formatChange(prices.natgas.change);
    document.getElementById('natgas-change').className = `price-change ${prices.natgas.change >= 0 ? 'positive' : 'negative'}`;
    
    document.getElementById('gas-price').textContent = `$${prices.gasoline.price.toFixed(2)}`;
    document.getElementById('gas-change').textContent = formatChange(prices.gasoline.change);
    document.getElementById('gas-change').className = `price-change ${prices.gasoline.change >= 0 ? 'positive' : 'negative'}`;
    
    document.getElementById('lastUpdate').textContent = new Date(prices.updated).toLocaleString();
}

function formatChange(change) {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${((change / 77) * 100).toFixed(2)}%)`;
}

// Update vessel markers on map
function updateVesselDisplay() {
    // Clear existing markers
    vesselMarkers.forEach(marker => map.removeLayer(marker));
    vesselMarkers = [];
    
    // Filter vessels
    const filtered = vesselData.filter(v => {
        if (currentFilter === 'all') return true;
        return v.type === currentFilter;
    });
    
    // Add new markers
    filtered.forEach(vessel => {
        const icon = L.divIcon({
            className: 'vessel-marker',
            html: getVesselIcon(vessel.type),
            iconSize: [30, 30]
        });
        
        const marker = L.marker([vessel.lat, vessel.lon], { icon })
            .addTo(map)
            .bindPopup(`
                <strong>${vessel.name}</strong><br>
                Type: ${vessel.type}<br>
                Flag: ${vessel.flag}<br>
                Speed: ${vessel.speed} kn<br>
                Heading: ${vessel.heading}°<br>
                Destination: ${vessel.destination}<br>
                Status: ${vessel.status}
            `);
        
        vesselMarkers.push(marker);
    });
    
    // Update table
    updateVesselTable(filtered);
}

function getVesselIcon(type) {
    const icons = {
        'container': '📦',
        'tanker': '🛢️',
        'cargo': '🚢'
    };
    return icons[type] || '⚓';
}

// Update vessel table
function updateVesselTable(vessels) {
    const tbody = document.getElementById('vessel-tbody');
    tbody.innerHTML = '';
    
    if (vessels.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No vessels found</td></tr>';
        return;
    }
    
    vessels.forEach(vessel => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${vessel.name}</strong></td>
            <td>${vessel.type.charAt(0).toUpperCase() + vessel.type.slice(1)}</td>
            <td>${vessel.flag}</td>
            <td>${vessel.speed} kn</td>
            <td>${vessel.heading}°</td>
            <td>${vessel.destination}</td>
            <td><span class="status-badge status-${vessel.status}">${vessel.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Update statistics
function updateStats() {
    const total = vesselData.length;
    const cargo = vesselData.filter(v => v.type === 'cargo').length;
    const tankers = vesselData.filter(v => v.type === 'tanker').length;
    
    document.getElementById('total-vessels').textContent = total;
    document.getElementById('cargo-count').textContent = cargo;
    document.getElementById('tanker-count').textContent = tankers;
}

// Filter vessels by type
function filterVessels(type) {
    currentFilter = type;
    
    // Update button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`btn-${type}`).classList.add('active');
    
    updateVesselDisplay();
}

// Load price history
async function loadPriceHistory() {
    try {
        const response = await fetch('data/price-history.json');
        if (response.ok) {
            priceHistory = await response.json();
            renderPriceChart();
        }
    } catch (error) {
        console.log('Price history not available yet');
    }
}

// Switch between different price charts
function switchChart(type) {
    currentChart = type;
    
    // Update button states
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`chart-btn-${type}`).classList.add('active');
    
    renderPriceChart();
}

// Render price chart as SVG
function renderPriceChart() {
    if (!priceHistory || priceHistory.length === 0) {
        document.getElementById('priceChart').innerHTML = '<div class="chart-loading">Loading price history...</div>';
        return;
    }
    
    const container = document.getElementById('priceChart');
    const width = Math.min(900, container.offsetWidth || 800);
    const height = 300;
    const padding = { top: 20, right: 80, bottom: 50, left: 60 };
    
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Extract data for current chart type
    const data = priceHistory.map(d => ({
        date: d.date,
        price: d[currentChart]
    }));
    
    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices) * 0.98;
    const maxPrice = Math.max(...prices) * 1.02;
    const priceRange = maxPrice - minPrice;
    
    // Calculate position
    const getX = (i) => padding.left + (i / (data.length - 1)) * chartWidth;
    const getY = (price) => padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    
    // Build path
    const pathData = data.map((d, i) => 
        `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.price)}`
    ).join(' ');
    
    // Calculate change
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;
    const isPositive = change >= 0;
    const color = isPositive ? '#00e676' : '#ff6b6b';
    
    // Chart labels
    const labels = {
        wti: 'WTI Crude Oil',
        brent: 'Brent Crude',
        natgas: 'Natural Gas',
        gasoline: 'US Gasoline'
    };
    
    // Build SVG
    let svg = `<svg width="${width}" height="${height}" style="display:block; margin:0 auto; background:#1a1a2e;">`;
    
    // Grid lines (horizontal)
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        const price = maxPrice - (priceRange / 4) * i;
        svg += `
            <line x1="${padding.left}" y1="${y}" x2="${padding.left + chartWidth}" y2="${y}" 
                  stroke="#444" stroke-width="1" opacity="0.3"/>
            <text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" 
                  font-size="11" fill="#888">$${price.toFixed(2)}</text>
        `;
    }
    
    // X-axis labels (dates)
    data.forEach((d, i) => {
        if (i % Math.ceil(data.length / 5) !== 0 && i !== data.length - 1) return;
        const x = getX(i);
        const dateObj = new Date(d.date);
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        svg += `
            <text x="${x}" y="${padding.top + chartHeight + 30}" text-anchor="middle" 
                  font-size="11" fill="#888">${dateStr}</text>
        `;
    });
    
    // Area under curve
    svg += `
        <path d="${pathData} L ${getX(data.length - 1)} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z"
              fill="${color}" opacity="0.15"/>
    `;
    
    // Line
    svg += `
        <path d="${pathData}" fill="none" stroke="${color}" stroke-width="3" 
              stroke-linecap="round" stroke-linejoin="round"/>
    `;
    
    // Data points
    data.forEach((d, i) => {
        const cx = getX(i);
        const cy = getY(d.price);
        svg += `
            <circle cx="${cx}" cy="${cy}" r="4" fill="${color}" stroke="#1a1a2e" stroke-width="2">
                <title>${d.date}: $${d.price.toFixed(2)}</title>
            </circle>
        `;
    });
    
    // Current price indicator
    const lastY = getY(lastPrice);
    svg += `
        <line x1="${padding.left + chartWidth}" y1="${lastY}" 
              x2="${width - padding.right + 60}" y2="${lastY}" 
              stroke="${color}" stroke-width="1" stroke-dasharray="3,3"/>
        <text x="${width - padding.right + 8}" y="${lastY + 4}" 
              font-size="12" font-weight="600" fill="${color}">$${lastPrice.toFixed(2)}</text>
    `;
    
    // Title & stats
    svg += `
        <text x="${padding.left}" y="${padding.top - 5}" 
              font-size="14" font-weight="600" fill="#fff">${labels[currentChart]} - 10 Day Trend</text>
        <text x="${width - padding.right}" y="${padding.top - 5}" text-anchor="end"
              font-size="13" font-weight="600" fill="${color}">
            ${isPositive ? '+' : ''}$${change.toFixed(2)} (${isPositive ? '+' : ''}${changePercent.toFixed(2)}%)
        </text>
    `;
    
    svg += '</svg>';
    
    container.innerHTML = svg;
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadVesselData();
    loadGasPrices();
    loadPriceHistory();
    
    // Refresh data every 5 minutes
    setInterval(() => {
        loadVesselData();
        loadGasPrices();
        loadPriceHistory();
    }, 5 * 60 * 1000);
});
