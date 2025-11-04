# 👤 User Guide & Interaction Flow

## Overview

This guide explains how to use the Cryptocurrency Market Pulse Dashboard, including all interactive features, visual indicators, and user workflows.

---

## Dashboard Layout

```
┌────────────────────────────────────────────────────────────┐
│  🟢 Cryptocurrency Market Pulse  •  Live                   │
├────────────────────────────────────────────────────────────┤
│                    Market Overview                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Total   │  │  Avg     │  │  Coins   │  │  Market  │  │
│  │  Volume  │  │  Change  │  │  Tracked │  │Sentiment │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
├────────────────────────────────────────────────────────────┤
│                    Market Alerts                            │
│  ⚠️  BTC: $103.9K  |  Volatile  |  +7.5%                   │
│  ⚠️  ETH: $3.5K    |  Moving    |  -5.2%                   │
├────────────────────────────────────────────────────────────┤
│                  Price Analysis                             │
│  [Dropdown: All Cryptocurrencies ▼]                        │
│  ┌────────────────────────────────────────────────────┐   │
│  │                  Bar Chart / Line Chart             │   │
│  │                                                      │   │
│  └────────────────────────────────────────────────────┘   │
├────────────────────────────────────────────────────────────┤
│  Last updated: 5:45:30 PM (America/New_York) • Every 30s   │
└────────────────────────────────────────────────────────────┘
```

---

## User Interaction Flow

### Flow 1: Quick Market Overview

**Goal**: Get a snapshot of the overall crypto market.

**Steps**:
1. Open dashboard → Automatically loads with "All Cryptocurrencies" view
2. Look at **Market Overview** cards:
   - **Total Volume**: How much trading activity (in billions)
   - **Avg Change**: Overall market trend (positive/negative)
   - **Coins Tracked**: Number of coins being monitored
   - **Market Sentiment**: Visual breakdown (rising/falling/stable/volatile)
3. Check **Market Alerts** for extreme movers (±5%+)

**Time**: 5-10 seconds

**Use Case**: "Is the market generally up or down today?"

---

### Flow 2: Compare All Cryptocurrencies

**Goal**: See which coins are most expensive and compare prices.

**Steps**:
1. Ensure **"All Cryptocurrencies"** is selected in dropdown (default)
2. View **Bar Chart**:
   - Height of bars = price
   - Labels above bars = exact price (e.g., `$103.9K`)
   - Color bars below = 24h change % (red/green)
3. Identify patterns:
   - BTC typically highest bar
   - Altcoins (DOGE, ADA) appear much smaller due to scale

**Time**: 10-15 seconds

**Use Case**: "Which coin is most expensive right now?"

**Visual Example**:
```
$120K ┤                             █ BTC
 $60K ┤         █ SOL   █ BNB      █
  $0K ┤ █ DOT  █       █           █  █ XRP
      └───┴───┴───┴───┴───┴───┴───┴───
```

---

### Flow 3: Analyze Single Coin Trend

**Goal**: Track price movements of a specific cryptocurrency over time.

**Steps**:
1. Click **coin selector dropdown** (top right of chart section)
2. Select a specific coin (e.g., "BTC")
3. Chart **automatically switches to line chart**
4. Observe:
   - **Line color**: 🟢 Green (price rising) or 🔴 Red (price falling)
   - **Line shape**: Upward trend, downward trend, or volatile zigzag
   - **Current price**: Displayed at top center
   - **24h change**: Shown next to price with +/- sign
5. **Hover over dots** to see:
   - Exact price at that time
   - Timestamp (HH:MM:SS)

**Time**: 20-30 seconds

**Use Case**: "Is Bitcoin's price trending up or down in the last 10 minutes?"

**Visual Example**:
```
BTC: $103.82K  +3.45%
━━━━━━━━━━━━━━━━━━━━━━━
$104K ┤           ●
      │        ●╱
      │     ●╱
$103K ┤  ●╱
      └──┴──┴──┴──
      14:30  14:35
```

---

### Flow 4: Identify Extreme Movers

**Goal**: Quickly find coins with significant price changes.

**Steps**:
1. Look at **Market Alerts** section (below Market Overview)
2. Alerts show coins with ±5% or more change
3. Each alert displays:
   - **Icon**: 📈 (rising) or 📉 (falling)
   - **Coin name & price**: e.g., "BTC: $103.9K"
   - **Volatility badge**: "Stable", "Moving", "Volatile", etc.
   - **24h change**: e.g., "+7.5%" (green) or "-5.2%" (red)
4. Sorted by **largest absolute change** first

**Time**: 5-10 seconds

**Use Case**: "Which coins are moving the most right now?"

**Alert Examples**:
- 🟢 **BTC: $103.9K** | Volatile | **+7.5%**
- 🔴 **SOL: $160.1** | High Volatility | **-8.7%**
- 🟢 **DOGE: $0.17** | Moving | **+5.2%**

---

### Flow 5: Switch Between Views

**Goal**: Toggle between overview and detailed analysis.

**Steps**:
1. **Start with bar chart** (all coins)
2. **Select specific coin** → Line chart appears
3. **Analyze trend** for 10-20 seconds
4. **Switch to another coin** → New line chart for that coin
5. **Select "All Cryptocurrencies"** → Return to bar chart

**Time**: Variable

**Use Case**: "I want to check BTC trend, then ETH trend, then see overall market again."

---

## Interactive Features

### 1. Coin Selector Dropdown

**Location**: Top right of "Price Analysis" section

**Options**:
- **All Cryptocurrencies** (default): Shows bar chart
- **BTC**: Bitcoin line chart
- **ETH**: Ethereum line chart
- **SOL**: Solana line chart
- **...** (all 10 tracked coins)

**Behavior**:
- Click to open dropdown
- Select coin
- Chart automatically redraws (bar ↔ line)

**Keyboard Navigation**:
- Tab to focus
- Arrow keys to navigate options
- Enter to select

---

### 2. Line Chart Hover Tooltips

**Trigger**: Hover mouse over any dot on line chart

**Appears**: White rounded tooltip box

**Shows**:
- **Price**: Formatted with K notation (e.g., `$103.82K`)
- **Time**: HH:MM:SS format (e.g., `14:35:45`)

**Animation**:
- Dot enlarges (4px → 6px)
- Tooltip appears instantly
- Tooltip disappears when mouse moves away

**Example**:
```
     ┌───────────┐
     │ $103.82K  │
     │ 14:35:45  │
     └─────┬─────┘
           ●
```

---

### 3. Live Updates

**Frequency**: Every 30 seconds

**Indicator**: 
- Green pulse dot next to "Live" in header
- Animated pulsing effect (CSS)

**What Updates**:
- All coin prices
- Market overview stats
- Alerts (if extreme movers appear/disappear)
- Charts (if in view)
- Price history (for line charts)

**Footer**: Shows "Last updated: [time] ([timezone])"

---

### 4. Market Sentiment Visualization

**Location**: Fourth card in Market Overview

**Display Format**:
```
Market Sentiment
━━━━━━━━━━━━━━━
📈 Rising:    3 ████░░░░░░
📉 Falling:   4 █████░░░░░
➡️ Stable:    2 ██░░░░░░░░
🔥 Volatile:  1 █░░░░░░░░░
```

**Categories**:
- **Rising**: `change_24h > 2%`
- **Falling**: `change_24h < -2%`
- **Stable**: `|change_24h| ≤ 2%`
- **Volatile**: `volatility` includes "Volatile"

**Bars**:
- Width proportional to count
- Max width = 10 coins (100%)

---

## Visual Indicators & Color Coding

### Price Change Colors

| Change | Color | Hex | Usage |
|--------|-------|-----|-------|
| **Positive** (≥+2%) | 🟢 Green | `#10b981` | Line charts, alerts, badges |
| **Negative** (≤-2%) | 🔴 Red | `#ef4444` | Line charts, alerts, badges |
| **Neutral** (-2% to +2%) | 🔵 Gray | `#94a3b8` | Bar chart indicators |

### Volatility Colors

| Status | Color | Threshold |
|--------|-------|-----------|
| **Stable** | 🟦 Blue | \|change\| ≤ 2% |
| **Moving** | 🟨 Yellow | \|change\| ≤ 5% |
| **Volatile** | 🟧 Orange | \|change\| ≤ 10% |
| **High Volatility** | 🟥 Red | \|change\| ≤ 20% |
| **Extreme** | 🟪 Purple | \|change\| > 20% |

### Icon Meanings

| Icon | Meaning | Location |
|------|---------|----------|
| 💵 `DollarSign` | Total volume | Market overview card |
| 📊 `Activity` | Average change, header | Market overview card, header |
| 🎯 `Target` | Coins tracked | Market overview card |
| 🪙 `CoinsIcon` | Market sentiment | Market overview card |
| 📈 `TrendingUp` | Rising price | Alerts |
| 📉 `TrendingDown` | Falling price | Alerts |
| ✅ `CheckCircle` | All clear (no alerts) | Alerts section |
| ℹ️ `Info` | Help/info tooltip | Market overview cards |
| 🟢 Pulse Dot | Live indicator | Header |

---

## Understanding Market Overview Cards

### Card 1: Total Volume

**Purpose**: Shows total 24-hour trading volume across all tracked coins.

**Calculation**: `sum(volume_24h)` for all coins

**Format**: `$X.XXB` or `$X.XXT` (billions/trillions)

**Example**: `$234.56B`

**Interpretation**:
- **High volume** (>$200B): Active market, lots of trading
- **Low volume** (<$100B): Quiet market, less activity

**Icon Color**: 🟦 Blue (`#3b82f6`)

---

### Card 2: Average Change

**Purpose**: Shows average 24-hour price change across all coins.

**Calculation**: `sum(change_24h) / count(coins)`

**Format**: `+X.XX%` or `-X.XX%`

**Example**: `+2.34%` or `-1.23%`

**Interpretation**:
- **Positive**: Market trending up overall
- **Negative**: Market trending down overall
- **Near zero**: Mixed/neutral market

**Icon Color**: 
- 🟢 Green if positive
- 🔴 Red if negative

---

### Card 3: Coins Tracked

**Purpose**: Shows how many cryptocurrencies are being monitored.

**Value**: Fixed at `10` (BTC, ETH, BNB, SOL, XRP, ADA, DOGE, DOT, AVAX, LINK)

**Future Enhancement**: Could be dynamic if user customizes watchlist

**Icon Color**: 🟨 Yellow (`#f59e0b`)

---

### Card 4: Market Sentiment

**Purpose**: Visualizes distribution of coin performance.

**Components**:
- **4 bars**: Rising, Falling, Stable, Volatile
- **Counts**: Number of coins in each category
- **Color-coded**: Green (rising), red (falling), gray (stable), orange (volatile)

**Example**:
```
📈 Rising:    3 ████░░░░░░
📉 Falling:   4 █████░░░░░
➡️ Stable:    2 ██░░░░░░░░
🔥 Volatile:  1 █░░░░░░░░░
```

**Interpretation**:
- **More rising**: Bullish market
- **More falling**: Bearish market
- **Many volatile**: High uncertainty/risk

**Icon Color**: 🪙 Orange (`#f97316`)

---

## Chart Interpretation Guide

### Bar Chart (All Cryptocurrencies)

**Best For**:
- Quick price comparison
- Identifying most/least expensive coins
- Spotting overall market sentiment (all green/red)

**How to Read**:
1. **Bar height** = Current price
2. **Top label** = Exact price (formatted with K)
3. **Bottom bar color** = 24h change (green/red)
4. **Bottom label** = Change percentage

**Limitations**:
- Low-priced coins appear tiny (e.g., DOGE $0.17 vs BTC $103K)
- No trend information (only current snapshot)

**Pro Tip**: If a coin seems "missing", look at the bottom—it might just be very small compared to BTC!

---

### Line Chart (Single Coin)

**Best For**:
- Trend analysis (up/down/sideways)
- Spotting volatility (jagged vs smooth line)
- Identifying momentum (accelerating/decelerating)

**How to Read**:
1. **Line direction**: 
   - ↗️ Upward = Price rising
   - ↘️ Downward = Price falling
   - ↔️ Flat = Price stable
2. **Line smoothness**:
   - Smooth = Low volatility
   - Jagged = High volatility
3. **Line color**:
   - 🟢 Green = Overall positive change today
   - 🔴 Red = Overall negative change today
4. **Gradient fill**: Emphasizes trend direction

**Time Window**: Last 20 data points (~10 minutes at 30s intervals)

**Pro Tip**: Look for patterns like "higher highs" (bullish) or "lower lows" (bearish).

---

## Common Questions & Answers

### Q1: Why don't I see my favorite coin?

**A**: Currently tracking 10 major coins. To add more, edit `COINS` list in `backend/kafka_producer/producer.py` and restart.

---

### Q2: Why does the bar chart show DOGE so small?

**A**: Linear scale means all prices are proportional. DOGE ($0.17) is literally 600,000x smaller than BTC ($103K). Select DOGE individually for a proper view!

---

### Q3: How often does data update?

**A**: Every 30 seconds. Watch the footer timestamp or the green "Live" indicator pulse.

---

### Q4: Why did the line chart only show 1-2 points initially?

**A**: Price history builds over time. After a few minutes, you'll have a full 10-minute trend line.

---

### Q5: What does "Volatile" mean in alerts?

**A**: 24h price change between ±5% and ±10%. "High Volatility" is ±10-20%, "Extreme" is ±20%+.

---

### Q6: Can I see prices in EUR or other currencies?

**A**: Currently USD only. To add, modify CoinGecko API params in `producer.py` (`vs_currencies: "eur"`).

---

### Q7: Why are there no alerts sometimes?

**A**: If no coin moved ±5% or more in 24h, you'll see "All Clear" message. Market is calm!

---

### Q8: Can I zoom or pan the line chart?

**A**: Not yet. Future enhancement! Currently shows fixed 10-minute window.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Tab** | Navigate between interactive elements |
| **Arrow Keys** | Navigate dropdown options |
| **Enter** | Select dropdown option |
| **Esc** | Close dropdown (browser default) |

---

## Accessibility Features

### Current

✅ **Screen Readers**:
- Dropdown has `aria-label="Select cryptocurrency"`
- Semantic HTML (`<header>`, `<section>`)

✅ **Keyboard Navigation**:
- All interactive elements accessible via Tab

✅ **Color + Text**:
- Not relying on color alone (icons + labels)

### Future Enhancements

🔄 **Planned**:
- ARIA labels for chart SVG elements
- Keyboard navigation for chart data points
- High-contrast mode
- Reduced motion mode

---

## Mobile Experience (Future)

Currently optimized for **desktop/tablet**. Mobile enhancements planned:

- Responsive grid layout (4 cards → 2x2 or 1x4)
- Touch-friendly chart interactions
- Swipe between coins
- Simplified tooltips (tap instead of hover)

---

## Performance Tips

### For Best Experience

1. **Modern Browser**: Chrome, Firefox, Safari, Edge (latest versions)
2. **Fast Connection**: Stable internet for WebSocket
3. **Hardware Acceleration**: Enable in browser settings (for smooth D3.js)
4. **Single Tab**: Running multiple tabs can slow WebSocket updates

### If Dashboard Feels Slow

1. **Check DevTools Console**: Look for errors
2. **Refresh Page**: Reconnects WebSocket
3. **Close Other Tabs**: Free up resources
4. **Disable Extensions**: Some ad blockers interfere with WebSockets

---

## Troubleshooting

### No Data Showing

**Symptoms**: Charts empty, cards show "0" or "N/A"

**Solutions**:
1. Check all backend services are running (Producer, Spark, FastAPI)
2. Open DevTools → Console → Look for WebSocket errors
3. Verify `ws://localhost:8000/ws` is connected
4. Wait 30 seconds for first update

---

### Chart Not Updating

**Symptoms**: Timestamp not changing, data stale

**Solutions**:
1. Check "Live" indicator is pulsing
2. Look at footer timestamp—should update every 30s
3. Refresh page to reconnect WebSocket
4. Check backend logs for errors

---

### Dropdown Not Working

**Symptoms**: Can't select coins, dropdown won't open

**Solutions**:
1. Check browser console for JavaScript errors
2. Clear browser cache
3. Try different browser
4. Verify React app compiled successfully (`npm run dev`)

---

## Advanced Usage

### Analyzing Market Trends

**Scenario**: "Is this a good time to buy?"

**Steps**:
1. Check **Avg Change** card:
   - Positive? Market generally up
   - Negative? Market generally down
2. Look at **Market Sentiment**:
   - More rising than falling? Bullish signal
   - Many volatile? High risk
3. Select specific coins of interest
4. Analyze line charts:
   - Upward trend? Price increasing
   - Recent spike/dip? Could reverse

**⚠️ Disclaimer**: This dashboard shows historical data only. Not financial advice!

---

### Comparing Two Coins

**Current**: Can only view one line chart at a time

**Workaround**:
1. Select Coin A (e.g., BTC)
2. Note price, trend, volatility
3. Select Coin B (e.g., ETH)
4. Compare mentally

**Future**: Overlay mode to show 2-3 lines simultaneously

---

### Exporting Data

**Current**: No built-in export

**Workaround**:
1. Open DevTools → Console
2. Type: `copy(JSON.stringify([...websocket data...]))`
3. Paste into text editor

**Future**: CSV/JSON export button

---

## User Flow Diagram

```
┌─────────────┐
│  Dashboard  │
│   Opens     │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────┐
│  WebSocket Connects                  │
│  First data arrives (~30s)           │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│  User Views Bar Chart (All Coins)   │
│  Quick market overview               │
└──────┬──────────────────────────────┘
       │
       ├─────────────────────────────┐
       │                              │
       ↓                              ↓
┌──────────────┐            ┌─────────────────┐
│ Checks       │            │ Selects Specific│
│ Alerts       │            │ Coin (e.g. BTC) │
└──────┬───────┘            └────────┬────────┘
       │                              │
       │                              ↓
       │                    ┌─────────────────┐
       │                    │ Views Line Chart│
       │                    │ Hovers on Dots  │
       │                    └────────┬────────┘
       │                              │
       │                              ↓
       │                    ┌─────────────────┐
       │                    │ Selects Another │
       │                    │ Coin (e.g. ETH) │
       │                    └────────┬────────┘
       │                              │
       └──────────────┬───────────────┘
                      │
                      ↓
            ┌─────────────────────┐
            │ Waits for Updates   │
            │ (auto every 30s)    │
            └─────────────────────┘
```

---

## Summary

**Quick Start**:
1. Open dashboard
2. Wait 30s for first data
3. View bar chart (all coins)
4. Select specific coin for trend
5. Hover for details

**Best Practices**:
- Check Market Alerts first for extreme movers
- Use bar chart for comparison
- Use line chart for trend analysis
- Wait for at least 5-10 updates (2-5 min) for meaningful line charts

**Remember**:
- Data updates every 30 seconds
- Line charts show last 10 minutes
- Green = rising, Red = falling
- Hover on dots for exact values

---

**Last Updated**: November 4, 2025

