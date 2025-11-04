# Frontend Components - Complete Explanation

## 🏗️ Architecture Overview

```
App.jsx (Root)
    ↓
Dashboard.jsx (Main Page)
    ├── Market Stats Cards (4 metrics)
    ├── CoinSelector (Dropdown filter)
    ├── CryptoAlert (Warnings/Notifications)
    └── CryptoChart (D3 Visualization)
```

---

## 📁 File Structure

```
frontend/src/
├── main.jsx              # React entry point
├── App.jsx               # Root component
├── pages/
│   └── Dashboard.jsx     # Main dashboard page
├── components/
│   ├── CitySelector.jsx  # Coin filter dropdown (renamed but file kept)
│   ├── AQIChart.jsx      # Crypto chart (renamed but file kept)
│   └── AQIAlert.jsx      # Alert notifications (renamed but file kept)
├── services/
│   └── socket.js         # WebSocket connection handler
└── styles/
    └── dashboard.css     # All styling
```

---

## 🎯 Component Breakdown

### 1. **Dashboard.jsx** - Main Container

**Purpose:** The main page that orchestrates everything

**Key Features:**

#### A. State Management
```javascript
const [updates, setUpdates] = useState([])        // Stores all crypto data
const [selectedCoin, setSelectedCoin] = useState('ALL')  // Current filter
```

- `updates`: Array of crypto coins with their latest data
- `selectedCoin`: Which coin to display (or 'ALL' for everything)

#### B. WebSocket Connection
```javascript
useEffect(() => {
  const ws = connectSocket((msg) => {
    if (msg?.type === 'aqi_update' && Array.isArray(msg.data)) {
      // Update state with new data
    }
  })
}, [])
```

**What it does:**
1. Connects to `ws://localhost:8000/ws`
2. Listens for messages with type `'aqi_update'`
3. Merges new data with existing data (updates coins, adds new ones)
4. Triggers re-render when data changes

#### C. Data Filtering
```javascript
const filtered = useMemo(() => 
  selectedCoin === 'ALL' ? updates : updates.filter(u => u.coin === selectedCoin), 
  [updates, selectedCoin]
)
```

**What it does:**
- If "All Coins" selected → show everything
- If specific coin selected → show only that coin
- `useMemo` caches the result to avoid re-calculating on every render

---

### 2. **Market Stats Cards** - Dashboard Analytics

These are the 4 colorful cards at the top showing overall market health.

#### **Card 1: 24h Volume** 💰
```javascript
${(marketStats.totalVolume / 1e9).toFixed(2)}B
```

**What it means:**
- **Total trading volume** across all tracked coins in the last 24 hours
- Measured in USD
- Divided by 1 billion (1e9) to show as "B" (billions)

**Example:**
```
$85.23B = $85,230,000,000 traded in last 24 hours
```

**Why it matters:**
- High volume = Active market, lots of trading
- Low volume = Quiet market, fewer trades
- Sudden volume spike = Major event happening

---

#### **Card 2: Avg Change** 📈📉
```javascript
{marketStats.avgChange >= 0 ? '+' : ''}{marketStats.avgChange.toFixed(2)}%
```

**What it means:**
- **Average price change** across all coins in last 24 hours
- Green (+) = Market going up overall
- Red (-) = Market going down overall

**Calculation:**
```javascript
const avgChange = updates.reduce((sum, u) => sum + u.change_24h, 0) / updates.length
// Sum all changes, divide by number of coins
```

**Example:**
```
+2.5% = On average, coins are up 2.5%
-3.2% = On average, coins are down 3.2%
```

**Why it matters:**
- Positive = Bullish market sentiment
- Negative = Bearish market sentiment
- Shows overall market direction at a glance

---

#### **Card 3: Market Sentiment** 🟢🔴
```javascript
🟢 {marketStats.gainers} | 🔴 {marketStats.losers}
```

**What it means:**
- **Gainers**: Number of coins with positive 24h change
- **Losers**: Number of coins with negative 24h change

**Calculation:**
```javascript
const gainers = updates.filter(u => u.change_24h > 0).length
const losers = updates.filter(u => u.change_24h < 0).length
```

**Example:**
```
🟢 7 | 🔴 3 = 7 coins up, 3 coins down (bullish)
🟢 2 | 🔴 8 = 2 coins up, 8 coins down (bearish)
```

**Why it matters:**
- Quick visual check of market mood
- More green = Optimistic market
- More red = Pessimistic market

---

#### **Card 4: Tracking** 🪙
```javascript
{updates.length} Coins
```

**What it means:**
- How many different cryptocurrencies we're currently monitoring
- Should be 10 (BTC, ETH, BNB, SOL, ADA, XRP, DOT, DOGE, AVAX, LINK)

**Why it matters:**
- Confirms data is flowing
- If 0 = No data received yet
- If less than 10 = Some coins haven't updated

---

### 3. **CoinSelector** - Filter Dropdown

**File:** `components/CitySelector.jsx` (name kept from AQI version)

**Purpose:** Filter to view specific coins or all coins

**How it works:**
```javascript
<select value={selected} onChange={e => onChange(e.target.value)}>
  <option value="ALL">All Coins</option>
  {coins.map(c => (
    <option key={c} value={c}>{c}</option>
  ))}
</select>
```

**User Experience:**
1. User clicks dropdown
2. Sees: "All Coins", "BTC", "ETH", "SOL", etc.
3. Selects a coin
4. Chart and alerts update to show only that coin

**Technical:**
- `coins` array is derived from `updates` data
- Uses `Array.from(new Set(...))` to get unique coin symbols
- Changing selection updates `selectedCoin` state
- Chart and alerts receive `filtered` data based on selection

---

### 4. **CryptoAlert** - Warning System

**File:** `components/AQIAlert.jsx`

**Purpose:** Highlight coins with extreme price movements (±10% or more)

**Logic:**
```javascript
const extremeMovers = data.filter(d => Math.abs(d.change_24h) >= 10)
```

**Visual Output:**

**Scenario 1: Extreme Movers Found**
```
🚨 Extreme Movers (±10% or more)

🚀 BTC: $103,811  +15.23%  (🚀 Surging)
💥 DOGE: $0.082  -12.50%  (💥 Crashing)
```

**Scenario 2: Stable Market**
```
✅ Market is relatively stable - no extreme movers
```

**Color Coding:**
- **Green background** = Coin surging (+10% or more)
- **Red background** = Coin crashing (-10% or more)

**Why it matters:**
- Quickly spot major opportunities or risks
- High volatility = Higher risk but potential profit
- Draws attention to coins making big moves

---

### 5. **CryptoChart** - D3 Visualization

**File:** `components/AQIChart.jsx`

**Purpose:** Visual comparison of all coins' prices and 24h changes

**Chart Type:** Dual-metric bar chart

#### **Top Part: Price Bars** (Blue)
```javascript
// Shows current price in USD
yPrice = d3.scaleLinear().domain([0, maxPrice])
```

**Visual:**
- Taller bar = Higher price
- Each bar labeled with exact price (e.g., "$103,811")
- Color: Blue (#4f46e5)

#### **Bottom Part: Change Bars** (Color-coded)
```javascript
const colorScale = d3.scaleLinear()
  .domain([-10, 0, 10])
  .range(['#ef4444', '#94a3b8', '#22c55e'])
  // Red → Gray → Green
```

**Visual:**
- 🟢 Green = Price up significantly
- ⚪ Gray = Price stable/neutral
- 🔴 Red = Price down significantly
- Shows percentage with +/- sign

**Example Interpretation:**
```
BTC Bar:
  Top (blue): $103,811 ← Current price
  Bottom (green): +5.2% ← 24h change
  
DOGE Bar:
  Top (blue): $0.08 ← Current price  
  Bottom (red): -12.5% ← 24h change
```

**D3 Technical Details:**

1. **X-axis (Horizontal):** Coin symbols (BTC, ETH, etc.)
2. **Y-axis Left (Vertical):** Price scale in dollars
3. **Bars:** Each coin gets 2 bars (price + change)
4. **Responsive:** Adapts to container width
5. **Updates:** Re-renders when `data` prop changes

---

## 🔄 Data Flow Diagram

```
1. Producer fetches from CoinGecko API
   ↓
2. Sends to Kafka topic: crypto_market_data
   ↓
3. Spark Consumer aggregates (30s windows)
   ↓
4. Posts to API Server /ingest endpoint
   {
     "data": [
       {
         "coin": "BTC",
         "price": 103811.00,
         "change_24h": -3.73,
         "volume_24h": 28500000000,
         "volatility": "Moving",
         "trend": "📉 Falling",
         "timestamp": "2025-11-04T14:42:00Z"
       }
     ]
   }
   ↓
5. API Server broadcasts via WebSocket
   → { type: 'aqi_update', data: [...] }
   ↓
6. Frontend receives message
   ↓
7. Dashboard updates state
   ↓
8. React re-renders components
   ↓
9. User sees updated data!
```

---

## 📊 Data Structure

**What the frontend receives:**

```javascript
[
  {
    coin: "BTC",           // Symbol (Bitcoin)
    coin_id: "bitcoin",    // Full ID from API
    price: 103811.00,      // Current USD price
    change_24h: -3.73,     // 24h change percentage
    volume_24h: 28500000000, // 24h trading volume in USD
    volatility: "Moving",  // Calculated status
    trend: "📉 Falling",   // Trend with emoji
    timestamp: "2025-11-04T14:42:00Z" // When data was processed
  },
  // ... 9 more coins
]
```

---

## 🎨 Styling System

**File:** `styles/dashboard.css`

### Color Scheme
```css
Background: Dark gradient (#0b1220 → #1a1f35)
Primary: Purple gradient (#667eea → #764ba2)
Success: Green (#22c55e)
Danger: Red (#ef4444)
Text: Light gray (#e8eefc)
```

### Key Classes

**`.market-stats`** - Grid layout for stat cards
```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
```
→ Responsive: 4 columns on desktop, stacks on mobile

**`.stat-card`** - Individual stat card
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```
→ Purple gradient with hover animation

**`.crypto-chart`** - Chart container
```css
background: #121a2b;
border-radius: 12px;
```
→ Dark card with rounded corners

**`.alert-item.success`** - Green alert
```css
background: linear-gradient(135deg, #065f46 0%, #047857 100%);
```
→ Green gradient for surging coins

**`.alert-item.danger`** - Red alert
```css
background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
```
→ Red gradient for crashing coins

---

## 🔧 React Hooks Used

### `useState` - State Management
```javascript
const [updates, setUpdates] = useState([])
```
→ Stores crypto data, triggers re-render when updated

### `useEffect` - Side Effects
```javascript
useEffect(() => {
  const ws = connectSocket(...)
  return () => ws.close()  // Cleanup on unmount
}, [])
```
→ Establishes WebSocket connection once when component mounts

### `useMemo` - Performance Optimization
```javascript
const coins = useMemo(() => 
  Array.from(new Set(updates.map(u => u.coin))), 
  [updates]
)
```
→ Only recalculates when `updates` changes, not on every render

### `useRef` - D3 DOM Reference
```javascript
const ref = useRef(null)
// Later: d3.select(ref.current)
```
→ Gives D3 direct access to SVG container element

---

## 🎯 Key Metrics Explained

### 1. **Price** 💵
- Current value of 1 coin in USD
- Example: BTC at $103,811 means 1 Bitcoin costs $103,811

### 2. **24h Change** 📈
- Percentage price moved up/down in last 24 hours
- +5% = Price increased 5%
- -3% = Price decreased 3%

### 3. **Volume** 💰
- Total USD value traded in 24 hours
- High volume = Lots of buying/selling activity
- Low volume = Less trading happening

### 4. **Volatility** 🎢
Status based on absolute change:
- **Stable**: ±0-2%
- **Moving**: ±2-5%
- **Volatile**: ±5-10%
- **High Volatility**: ±10-20%
- **Extreme**: ±20%+

### 5. **Trend** 📊
Direction based on change:
- **🚀 Surging**: +5% or more
- **📈 Rising**: +2% to +5%
- **➡️ Stable**: -2% to +2%
- **📉 Falling**: -5% to -2%
- **💥 Crashing**: -5% or worse

---

## 🚀 User Journey

1. **Page loads** → Dashboard.jsx mounts
2. **WebSocket connects** → `[ws] connecting...`
3. **Data arrives** (every 30s) → `[ui] 💱 received 10 crypto records`
4. **State updates** → React re-renders
5. **User sees:**
   - Market stats populate
   - Chart draws bars
   - Alerts appear if extreme movers
6. **User interacts:**
   - Selects "BTC" from dropdown
   - Chart shows only Bitcoin
   - Alerts show only Bitcoin (if volatile)
7. **More data arrives** → Components auto-update

---

## 💡 Why These Components?

### Market Stats Cards
→ **Quick health check** of entire market at a glance

### Coin Selector
→ **Focus on specific** coins you care about

### Alerts
→ **Catch major moves** without staring at charts

### Chart
→ **Visual comparison** easier than reading numbers

Together they provide:
- ✅ Overview (stats cards)
- ✅ Detail (chart)
- ✅ Alerts (notifications)
- ✅ Control (selector)

This is a standard **dashboard pattern** used in finance, analytics, and monitoring applications!

---

## 🔍 Common Questions

**Q: Why are we still using msg.type === 'aqi_update'?**
A: Legacy from air quality version. Works fine, but could be renamed to 'crypto_update'

**Q: Why 30-second updates?**
A: API rate limits. Free tier = ~10 calls/min. We use 2 calls/min to be safe.

**Q: Why useMemo everywhere?**
A: Performance. Avoids recalculating stats/filters on every render (which happens a lot in React)

**Q: Can I add more coins?**
A: Yes! Edit `COINS` array in `backend/kafka_producer/producer.py`

**Q: Can I change the ±10% alert threshold?**
A: Yes! Edit line 5 in `CryptoAlert.jsx`: `Math.abs(d.change_24h) >= 10`

---

Hope this helps you understand every piece of the frontend! 🎉

