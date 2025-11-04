# ⚛️ React Components Guide

## Overview

The frontend is built with React 18 using a component-based architecture. Each component has a single responsibility and communicates through props and state.

---

## Component Hierarchy

```
App.jsx
  └── Dashboard.jsx (Main Page)
        ├── Header (inline)
        ├── Market Overview Cards (inline)
        │     ├── Total Volume Card
        │     ├── Average Change Card
        │     ├── Coins Tracked Card
        │     └── Market Sentiment Card
        ├── CryptoAlert.jsx
        ├── CryptoChart.jsx
        ├── CoinSelector.jsx
        └── Footer (inline)
```

---

## 1. Dashboard.jsx

**Location**: `frontend/src/pages/Dashboard.jsx`

**Purpose**: Main orchestrator component that manages application state, WebSocket connection, and layout.

### State Management

```javascript
const [updates, setUpdates] = useState([])           // Latest crypto data
const [selectedCoin, setSelectedCoin] = useState('ALL')  // Selected coin
const [priceHistory, setPriceHistory] = useState({}) // Historical prices
```

### Key Responsibilities

1. **WebSocket Connection**
   ```javascript
   useEffect(() => {
     const ws = new WebSocket('ws://localhost:8000/ws')
     ws.onmessage = (event) => {
       const msg = JSON.parse(event.data)
       if (msg.type === 'aqi_update') {
         setUpdates(msg.data)
         // Update price history...
       }
     }
   }, [])
   ```

2. **Price History Tracking**
   - Maintains last 20 data points per coin
   - Sliding window: new data pushes out old data
   - Stores: `{ BTC: [...], ETH: [...], ... }`

3. **Market Statistics Calculation**
   ```javascript
   const marketStats = useMemo(() => ({
     totalVolume: updates.reduce((sum, u) => sum + u.volume_24h, 0),
     avgChange: updates.reduce((sum, u) => sum + u.change_24h, 0) / updates.length,
     rising: updates.filter(u => u.change_24h > 2).length,
     falling: updates.filter(u => u.change_24h < -2).length,
     stable: updates.filter(u => Math.abs(u.change_24h) <= 2).length,
     volatile: updates.filter(u => u.volatility.includes('Volatile')).length
   }), [updates])
   ```

4. **Data Filtering**
   ```javascript
   const filtered = selectedCoin === 'ALL' 
     ? updates 
     : updates.filter(u => u.coin === selectedCoin)
   ```

### Props Passed Down

| Component | Props | Description |
|-----------|-------|-------------|
| `CryptoAlert` | `data` | Filtered crypto data |
| `CryptoChart` | `data`, `selectedCoin`, `priceHistory` | Chart data and config |
| `CoinSelector` | `coins`, `selected`, `onChange` | Coin list and selection handler |

### Layout Structure

```jsx
<div className="dashboard">
  {/* Header */}
  <header className="dashboard-header">
    <Activity /> + Title + Live Indicator
  </header>

  {/* Market Overview */}
  <section className="market-overview">
    <div className="stats-grid">
      {/* 4 stat cards */}
    </div>
  </section>

  {/* Alerts */}
  <div className="alerts-section">
    <CryptoAlert data={filtered} />
  </div>

  {/* Chart */}
  <div className="chart-section">
    <CoinSelector />
    <CryptoChart />
  </div>

  {/* Footer */}
  <div className="dashboard-footer">
    Last updated: {time} ({timezone})
  </div>
</div>
```

---

## 2. CryptoChart.jsx

**Location**: `frontend/src/components/CryptoChart.jsx`

**Purpose**: Render bar chart or line chart based on selected coin using D3.js.

### Props

```typescript
interface CryptoChartProps {
  data: Array<{
    coin: string
    price: number
    change_24h: number
    volume_24h: number
    volatility: string
    trend: string
    timestamp: string
  }>
  selectedCoin: string  // 'ALL' or coin ID
  priceHistory: Array<{
    timestamp: Date
    price: number
    change: number
  }>
}
```

### Chart Logic

```javascript
useEffect(() => {
  // Clear previous chart
  d3.select(el).selectAll('*').remove()
  
  const svg = d3.select(el).append('svg')
  
  if (selectedCoin !== 'ALL') {
    // Single coin → Line Chart
    const historyData = priceHistory.length > 0 
      ? priceHistory 
      : createHistoryFromCurrent(data, selectedCoin)
    renderLineChart(svg, historyData, width, height, selectedCoin)
  } else {
    // All coins → Bar Chart
    renderBarChart(svg, data, width, height)
  }
}, [data, selectedCoin, priceHistory])
```

### Internal Functions

#### `renderBarChart(svg, data, width, height)`

**Steps**:
1. Create scales (`scaleBand` for X, `scaleLinear` for Y)
2. Add grid lines
3. Draw axes with smart formatting
4. Render price bars (blue, rounded corners)
5. Add price labels above bars
6. Add change % indicators below bars

**Key Code**:
```javascript
// Y-axis with K formatting
.tickFormat(d => {
  if (d >= 1000) return `$${(d/1000).toFixed(d >= 10000 ? 0 : 1)}K`
  if (d >= 1) return `$${d.toFixed(0)}`
  return `$${d.toFixed(2)}`
})
```

#### `renderLineChart(svg, history, width, height, coinName)`

**Steps**:
1. Calculate time and price extents
2. Create scales (`scaleTime` for X, `scaleLinear` for Y)
3. Add grid lines
4. Render gradient fill under line
5. Draw smooth line (`curveMonotoneX`)
6. Add interactive dots with hover tooltips
7. Display current price and change at top

**Key Code**:
```javascript
// Interactive dots
g.selectAll('.dot')
  .data(history)
  .enter().append('circle')
  .attr('class', 'dot')
  .attr('r', 4)
  .on('mouseover', function(event, d) {
    d3.select(this).attr('r', 6)  // Enlarge
    // Show tooltip...
  })
  .on('mouseout', function() {
    d3.select(this).attr('r', 4)  // Restore
    g.select('.tooltip').remove()
  })
```

### D3.js Usage

- **Scales**: `scaleLinear`, `scaleTime`, `scaleBand`
- **Axes**: `axisLeft`, `axisBottom`
- **Shapes**: `line`, `area` (with `curveMonotoneX`)
- **Selections**: `select`, `selectAll`, `data`, `enter`
- **Events**: `on('mouseover')`, `on('mouseout')`

---

## 3. CryptoAlert.jsx

**Location**: `frontend/src/components/CryptoAlert.jsx`

**Purpose**: Display alerts for extreme price movements (±5% or more).

### Props

```typescript
interface CryptoAlertProps {
  data: Array<{
    coin: string
    price: number
    change_24h: number
    volatility: string
    trend: string
  }>
}
```

### Logic

```javascript
// Filter extreme movers
const extremeMovers = data.filter(item => Math.abs(item.change_24h) >= 5)

// Sort by absolute change (largest first)
extremeMovers.sort((a, b) => 
  Math.abs(b.change_24h) - Math.abs(a.change_24h)
)
```

### Alert Types

- **Success Alert** (Green): `change_24h > 0` (rising)
- **Danger Alert** (Red): `change_24h < 0` (falling)

### Display Format

```jsx
<div className={`alert-item alert-${type}`}>
  <div className="alert-icon">
    {isRising ? <TrendingUp /> : <TrendingDown />}
  </div>
  <div className="alert-content">
    <div className="alert-left">
      <strong>{coin}</strong>
      <span className="alert-price">${price}</span>
    </div>
    <div className="alert-right">
      <span className="alert-badge">{volatility}</span>
      <span className="alert-change">{change}%</span>
    </div>
  </div>
</div>
```

### Edge Cases

- **No extreme movers**: Shows "All Clear" message with `CheckCircle` icon
- **Empty data**: Shows nothing

---

## 4. CoinSelector.jsx

**Location**: `frontend/src/components/CoinSelector.jsx`

**Purpose**: Dropdown selector for choosing a cryptocurrency.

### Props

```typescript
interface CoinSelectorProps {
  coins: string[]       // e.g., ['BTC', 'ETH', 'SOL']
  selected: string      // Current selection (e.g., 'BTC' or 'ALL')
  onChange: (coin: string) => void  // Selection handler
}
```

### Implementation

```jsx
export default function CoinSelector({ coins, selected, onChange }) {
  return (
    <select 
      value={selected} 
      onChange={(e) => onChange(e.target.value)}
      className="coin-selector"
      aria-label="Select cryptocurrency"
    >
      <option value="ALL">All Cryptocurrencies</option>
      {coins.sort().map(coin => (
        <option key={coin} value={coin}>
          {coin}
        </option>
      ))}
    </select>
  )
}
```

### Features

- **Default option**: "All Cryptocurrencies" (`value="ALL"`)
- **Alphabetical sorting**: Coins sorted A-Z for easy finding
- **Accessibility**: `aria-label` for screen readers
- **Styling**: Custom CSS in `dashboard.css`

---

## Component Communication

### Props Down, Events Up

```
Dashboard
  │
  ├─ State: updates, selectedCoin, priceHistory
  │
  ├─> CoinSelector
  │     Props: coins, selected
  │     Events: onChange(coin) → setSelectedCoin(coin)
  │
  ├─> CryptoChart
  │     Props: data, selectedCoin, priceHistory
  │     Events: None (read-only)
  │
  └─> CryptoAlert
        Props: data
        Events: None (read-only)
```

### Data Flow Example

1. User selects "BTC" in `CoinSelector`
2. `onChange('BTC')` fires
3. Dashboard updates `selectedCoin` state
4. `CryptoChart` re-renders with `selectedCoin='BTC'`
5. Chart logic switches to line chart
6. D3.js redraws visualization

---

## Styling

### CSS Architecture

**File**: `frontend/src/styles/dashboard.css`

**Structure**:
- Global styles (body, fonts)
- Dashboard layout (`.dashboard`, `.dashboard-header`)
- Market overview (`.market-overview`, `.stat-card`)
- Alerts (`.alerts-section`, `.alert-item`)
- Charts (`.chart-section`, `.crypto-chart`)
- D3.js styles (`.dot`, `.grid`, `path`)

### Key Classes

| Class | Purpose |
|-------|---------|
| `.dashboard` | Main container |
| `.stat-card` | Market overview cards |
| `.icon-wrapper` | Colored icon backgrounds |
| `.alert-item` | Individual alert |
| `.crypto-chart` | Chart container |
| `.coin-selector` | Dropdown selector |

### Responsive Design

- Flexbox for layout
- Grid for stat cards (`display: grid; grid-template-columns: repeat(4, 1fr)`)
- Media queries (future enhancement for mobile)

---

## Icons (Lucide React)

### Imported Icons

```javascript
import { 
  TrendingUp,      // Rising alerts
  TrendingDown,    // Falling alerts
  DollarSign,      // Total volume
  Activity,        // Header & avg change
  Target,          // Coins tracked
  Info,            // Tooltips
  CoinsIcon,       // Market sentiment
  CheckCircle,     // All clear
  AlertTriangle    // Warnings (unused)
} from 'lucide-react'
```

### Usage Pattern

```jsx
<div className="icon-wrapper icon-volume">
  <DollarSign size={24} />
</div>
```

---

## Performance Optimizations

### 1. useMemo for Expensive Calculations

```javascript
const marketStats = useMemo(() => {
  // Heavy computation only runs when updates change
  return { totalVolume, avgChange, ... }
}, [updates])
```

### 2. Conditional Rendering

```javascript
{updates.length > 0 && (
  <div className="dashboard-footer">...</div>
)}
```

### 3. D3.js Cleanup

```javascript
// Remove old chart before rendering new one
d3.select(el).selectAll('*').remove()
```

### 4. Limited History

- Only store 20 price points (not thousands)
- Prevents memory bloat

---

## Error Handling

### WebSocket Errors

```javascript
ws.onerror = (error) => {
  console.error('[ws] error:', error)
}

ws.onclose = () => {
  console.log('[ws] connection closed')
}
```

### Missing Data

```javascript
// Fallback for no price history
const historyData = priceHistory.length > 0 
  ? priceHistory 
  : data.filter(d => d.coin === selectedCoin).map(...)
```

### Empty States

- **No updates**: Show loading state (future)
- **No extreme movers**: Show "All Clear" message
- **Invalid coin**: Fallback to "ALL"

---

## Testing Considerations

### Unit Tests (Future)

```javascript
describe('Dashboard', () => {
  it('calculates market stats correctly', () => {
    const updates = [
      { change_24h: 5, volume_24h: 1000 },
      { change_24h: -3, volume_24h: 2000 }
    ]
    const stats = calculateMarketStats(updates)
    expect(stats.avgChange).toBe(1)
    expect(stats.totalVolume).toBe(3000)
  })
})
```

### Integration Tests

- Mock WebSocket connection
- Verify chart renders
- Test coin selection triggers redraw

---

## Future Enhancements

### Components

1. **LoadingSpinner**: Show while WebSocket connects
2. **ErrorBoundary**: Catch React errors gracefully
3. **PriceTable**: Tabular view of all coins
4. **SettingsPanel**: Customize update frequency, coins tracked
5. **Notifications**: Browser push notifications

### Features

1. **Dark Mode Toggle**: Use theme context
2. **Export Data**: Download CSV of current prices
3. **Favorites**: Star coins for quick access
4. **Price Alerts**: Set custom thresholds (e.g., alert if BTC > $100K)

---

**Last Updated**: November 4, 2025

