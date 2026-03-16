// Strait of Hormuz Tracker App
let map;
let vesselMarkers = [];
let currentFilter = 'all';
let vesselData = [];

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

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadVesselData();
    loadGasPrices();
    
    // Refresh data every 5 minutes
    setInterval(() => {
        loadVesselData();
        loadGasPrices();
    }, 5 * 60 * 1000);
});
