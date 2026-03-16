# ⚓ Strait of Hormuz Live Tracker

![Scrape & Deploy](https://github.com/camptracker/strait-tracker/actions/workflows/scrape-and-deploy.yml/badge.svg)

Real-time tracking of cargo ships and gas prices in the Strait of Hormuz.

## 🔗 Live Dashboard

**https://camptracker.github.io/strait-tracker/**

---

## 📊 Features

### 🚢 Ship Tracking
- **Live AIS Data** - Real-time vessel positions in Strait of Hormuz
- **Interactive Map** - Leaflet.js map with vessel markers
- **Vessel Filters** - Filter by cargo, tanker, or container ships
- **Detailed Info** - Name, flag, speed, heading, destination, status
- **Vessel Statistics** - Total count by type

### ⛽ Gas & Oil Prices
- **Crude Oil (WTI)** - West Texas Intermediate spot price
- **Brent Crude** - International benchmark
- **Natural Gas** - NYMEX futures
- **US Gasoline** - National average retail price
- **Live Updates** - Price changes with percentage indicators

---

## 🔄 Automated Data Collection

### Cron Job via GitHub Actions
- **Frequency**: Every 1 hour
- **Scraper**: `scraper.js` (Node.js)
- **Sources**: 
  - Vessel data: AIS feeds / MarineTraffic API
  - Oil prices: Alpha Vantage, EIA, commodity APIs
- **Storage**: `data/vessels.json`, `data/prices.json`
- **Auto-commit**: GitHub Actions commits updated data
- **Auto-deploy**: Deploys to GitHub Pages automatically

### Workflow
```
┌─────────────┐
│ Cron Trigger│ (Every hour)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Run scraper.js│ → Fetch vessel data
│             │ → Fetch gas prices
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Save to data/│ → vessels.json
│             │ → prices.json
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Git commit  │ → Auto-commit changes
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Deploy    │ → GitHub Pages
└─────────────┘
```

---

## 🛠️ Local Development

### Prerequisites
- Node.js 20+
- Git

### Setup
```bash
git clone https://github.com/camptracker/strait-tracker.git
cd strait-tracker
node scraper.js  # Run scraper manually
```

### Serve locally
```bash
python3 -m http.server 8000
# Open http://localhost:8000
```

---

## 📂 Project Structure

```
strait-tracker/
├── index.html           # Main dashboard
├── style.css            # Styling
├── app.js               # Frontend logic
├── scraper.js           # Data scraper (Node.js)
├── data/
│   ├── vessels.json     # Ship data
│   ├── prices.json      # Gas prices
│   └── metadata.json    # Last update info
├── .github/
│   └── workflows/
│       └── scrape-and-deploy.yml  # GitHub Actions
└── README.md
```

---

## 🌍 Strait of Hormuz Facts

- **Location**: 26.5667°N, 56.2500°E
- **Width**: 21 miles (narrowest point)
- **Oil Transit**: ~21% of global petroleum passes through
- **Strategic Importance**: Connects Persian Gulf to Gulf of Oman

---

## 📡 Data Sources

| Data Type | Source | Update Frequency |
|-----------|--------|------------------|
| Vessel AIS | MarineTraffic API | Hourly |
| WTI Crude | Alpha Vantage / EIA | Hourly |
| Brent Crude | Commodity APIs | Hourly |
| Natural Gas | NYMEX | Hourly |
| Gas Prices | EIA / GasBuddy | Daily |

---

## 🚀 Deployment

Automatically deployed via **GitHub Actions** on every push to `main`.

No manual deployment needed—just push your changes!

---

## 📜 License

MIT License

---

Created with 🔥 by OpenClaw
