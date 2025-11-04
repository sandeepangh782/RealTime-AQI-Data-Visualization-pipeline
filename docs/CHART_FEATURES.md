# 📊 Chart Features & Visualization Guide

## Overview

The dashboard features a **dual-chart system** that intelligently switches between visualization types based on user selection:
- **Bar Chart**: Compare all cryptocurrencies at once
- **Line Chart**: Analyze individual coin trends over time

---

## Chart Type Comparison

| Feature | Bar Chart | Line Chart |
|---------|-----------|------------|
| **Purpose** | Compare multiple coins | Track single coin trend |
| **Trigger** | "All Cryptocurrencies" selected | Any single coin selected |
| **X-Axis** | Coin symbols (BTC, ETH, etc.) | Time (HH:MM or HH:MM:SS) |
| **Y-Axis** | Price (USD) - Linear scale | Price (USD) - Dynamic scale |
| **Data Points** | Latest snapshot of all coins | Last 20 data points (~10 minutes) |
| **Interactivity** | Static view with labels | Hover tooltips on dots |
| **Best For** | Quick overview, relative comparison | Trend analysis, volatility tracking |

---

## Bar Chart (All Coins Comparison)

### Visual Design

```
Price Comparison
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$120K ┤                          $103.9K
      │                             █
      │                             █
 $60K ┤                             █
      │                             █
      │     $160.1  $949.6          █
      │        █       █            █     $16.6
      │        █       █            █        █
  $0K ┤  $2.6  █       █            █  $2.3  █  $0.17  $0.54  $14.9  $3.5K
      └───┴───┴───┴───┴───┴───┴───┴───┴───┴───
         DOT SOL BNB BTC  XRP AVAX DOGE ADA LINK ETH
         
      [━━━━]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       -6.8%  -8.7%  -7.0%  -3.2%  -6.3%  -4.6%  -4.8%  -6.1%  -7.5%  -5.8%
```

### Features

1. **Smart Y-Axis Formatting**
   - Linear scale from $0 to max price + 10% padding
   - Automatic "K" notation:
     - ≥$10,000 → `$100K`, `$50K` (no decimal)
     - ≥$1,000 → `$10.5K`, `$2.3K` (1 decimal)
     - ≥$1 → `$950`, `$160` (no decimal)
     - <$1 → `$0.54`, `$0.17` (2 decimals)

2. **Price Bars**
   - Height proportional to price
   - Color: `#667eea` (purple-blue)
   - Rounded corners (`rx: 4`)
   - Opacity: 0.8 for modern look

3. **Price Labels**
   - Displayed above each bar
   - Same smart formatting as Y-axis
   - Bold, purple-blue text

4. **Change Indicators**
   - Small bars below X-axis
   - Color-coded:
     - 🔴 Red: Negative change
     - 🟢 Green: Positive change
     - 🔵 Gray: Near zero change
   - Shows percentage with +/- sign

5. **Grid Lines**
   - Horizontal dashed lines
   - Light gray, 30% opacity
   - 6 ticks for clean appearance

6. **Note**
   - "Lower-priced coins may appear small due to scale"
   - Explains why DOGE ($0.17) looks tiny vs BTC ($103K)

### When to Use

✅ **Use Bar Chart When**:
- Comparing relative prices across all coins
- Identifying which coins are most/least expensive
- Quick market overview at a glance
- Spotting overall market trends (all red/green)

❌ **Avoid Bar Chart For**:
- Tracking price changes over time
- Analyzing volatility patterns
- Detailed trend analysis

---

## Line Chart (Single Coin Trend)

### Visual Design

```
BTC Price Trend: $103.82K  +3.45%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$104.5K ┤                             ●
        │                          ●╱   ╲●
        │                       ●╱         ╲
$104.0K ┤                    ●╱              ●
        │                 ●╱
        │              ●╱
$103.5K ┤           ●╱
        │        ●╱
        │     ●╱
$103.0K ┤  ●╱
        └──┴──┴──┴──┴──┴──┴──┴──┴──┴──
         14:30  14:32  14:34  14:36  14:38
         
         [Gradient fill underneath line in green/red]
```

### Features

1. **Dynamic Y-Axis Scaling**
   - Automatically adjusts to coin's price range
   - 10% padding above/below for visibility
   - Smart K formatting (same as bar chart)
   - Domain: `[minPrice - padding, maxPrice + padding]`

2. **Time-Based X-Axis**
   - Time format adapts to data span:
     - **< 1 hour**: `HH:MM:SS` (e.g., 14:32:45)
     - **≥ 1 hour**: `HH:MM` (e.g., 14:32)
   - 8 ticks for clean timeline

3. **Smooth Line**
   - Curve type: `d3.curveMonotoneX`
   - Creates smooth, natural curves
   - Stroke width: 3px
   - Color: 🟢 Green (positive change) or 🔴 Red (negative change)

4. **Gradient Fill**
   - Area under the line filled with gradient
   - Matches line color (green/red)
   - Opacity: Solid at top (50%), transparent at bottom
   - Adds visual weight and emphasis

5. **Interactive Dots**
   - Circular markers at each data point
   - Radius: 4px (normal), 6px (hover)
   - White stroke for contrast
   - **Hover Effect**:
     - Dot enlarges
     - Tooltip appears with:
       - Price (formatted with K)
       - Time (HH:MM:SS)
     - White rounded rectangle background

6. **Current Price Display**
   - Top center of chart
   - Shows: `COIN: $PRICE` (e.g., "BTC: $103.82K")
   - 24h change next to it: `+3.45%` (green) or `-2.10%` (red)

7. **Grid Lines**
   - Horizontal lines for price reference
   - Very light gray, 10% opacity
   - Subtle, doesn't distract from data

### Data History

- **Storage**: `priceHistory` state in Dashboard component
- **Retention**: Last 20 data points per coin
- **Time Span**: ~10 minutes at 30-second update intervals
- **Structure**:
  ```javascript
  {
    "BTC": [
      { timestamp: Date, price: 103895, change: 3.45 },
      { timestamp: Date, price: 104102, change: 3.52 },
      ...
    ],
    "ETH": [ ... ]
  }
  ```

### When to Use

✅ **Use Line Chart When**:
- Tracking a single coin's price movements
- Analyzing short-term trends (last 10 minutes)
- Identifying volatility patterns
- Spotting price spikes or dips
- Understanding momentum (rising/falling)

❌ **Avoid Line Chart For**:
- Comparing multiple coins simultaneously
- Long-term trend analysis (need more historical data)

---

## Chart Switching Logic

### Code Flow

```javascript
// In CryptoChart.jsx
if (selectedCoin !== 'ALL') {
  // Single coin → Line Chart
  const historyData = priceHistory.length > 0 
    ? priceHistory 
    : createFromCurrentData(selectedCoin)
  
  renderLineChart(svg, historyData, width, height, selectedCoin)
} else {
  // All coins → Bar Chart
  renderBarChart(svg, data, width, height)
}
```

### User Experience

1. **Initial Load**: Bar chart showing all coins
2. **Select BTC**: Chart animates to line chart with BTC trend
3. **Hover on Dots**: See exact price and time
4. **Select "All Cryptocurrencies"**: Chart switches back to bar view

---

## D3.js Implementation Details

### Scales

**Bar Chart**:
```javascript
// X-axis: Ordinal scale for coin names
const x = d3.scaleBand()
  .domain(['BTC', 'ETH', 'SOL', ...])
  .range([70, width - 20])
  .padding(0.3)  // Space between bars

// Y-axis: Linear scale for prices
const yPrice = d3.scaleLinear()
  .domain([0, maxPrice * 1.1])
  .nice()  // Round to clean numbers
  .range([height - 80, 60])
```

**Line Chart**:
```javascript
// X-axis: Time scale
const x = d3.scaleTime()
  .domain([earliestTime, latestTime])
  .range([0, chartWidth])

// Y-axis: Linear scale with dynamic range
const yPrice = d3.scaleLinear()
  .domain([minPrice - padding, maxPrice + padding])
  .nice()
  .range([chartHeight, 0])
```

### Axes

**Smart Tick Formatting**:
```javascript
const formatPrice = (d) => {
  if (d >= 1000) return `$${(d/1000).toFixed(d >= 10000 ? 0 : 1)}K`
  if (d >= 1) return `$${d.toFixed(0)}`
  return `$${d.toFixed(2)}`
}

// Apply to Y-axis
svg.append('g')
  .call(d3.axisLeft(yPrice).tickFormat(formatPrice))
```

### Animations & Transitions

- **Bar Chart**: Bars can be animated with `.transition().duration(500)` (optional)
- **Line Chart**: Dots scale up on hover (4px → 6px)
- **Tooltip**: Appears instantly, no delay
- **Chart Switch**: D3 removes old SVG and redraws (future: add transition)

---

## Color Palette

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| **Bars** | Purple-Blue | `#667eea` | Bar chart bars |
| **Line (Positive)** | Green | `#10b981` | Rising price trend |
| **Line (Negative)** | Red | `#ef4444` | Falling price trend |
| **Change (Positive)** | Green | `#22c55e` | Positive % change |
| **Change (Negative)** | Red | `#ef4444` | Negative % change |
| **Neutral** | Gray | `#94a3b8` | Near-zero change |
| **Grid Lines** | Light Gray | `#e5e7eb` | Background grid |
| **Text** | Dark Gray | `#6b7280` | Axis labels |

---

## Responsive Design

### Chart Sizing

- **Width**: `el.clientWidth` (fills container)
- **Height**: Fixed `400px`
- **Margins**: 
  - Bar chart: `left: 70px`, `right: 20px`, `top: 60px`, `bottom: 80px`
  - Line chart: `left: 60px`, `right: 30px`, `top: 20px`, `bottom: 50px`

### Mobile Considerations (Future Enhancement)

- Reduce font sizes on small screens
- Fewer ticks on axes
- Simplify hover tooltips (tap instead of hover)
- Stack bars horizontally on very narrow screens

---

## Performance Optimizations

1. **Redraw Only on Changes**: `useEffect` dependencies: `[data, selectedCoin, priceHistory]`
2. **Remove Old SVG**: `d3.select(el).selectAll('*').remove()` before redrawing
3. **Limited Data Points**: Only 20 points in line chart (prevents cluttering)
4. **Efficient Scales**: D3 scales are memoized internally

---

## Accessibility

**Current State**:
- Axis labels provide context
- Color-coded with text labels (not color-only)
- Hover tooltips for detailed info

**Improvements Needed**:
- Add ARIA labels to SVG elements
- Keyboard navigation for data points
- Screen reader descriptions for charts
- High-contrast mode support

---

## Examples

### Example 1: All Coins (Bar Chart)

**Scenario**: User wants to see which coins are most expensive.

**Result**: Bar chart clearly shows BTC ($103.9K) towers over others, while DOGE ($0.17) is barely visible.

### Example 2: Bitcoin Trend (Line Chart)

**Scenario**: User selects BTC to check if price is rising or falling.

**Result**: Line chart shows smooth green line trending upward, current price $103.82K (+3.45% today).

### Example 3: Volatile Coin (Line Chart)

**Scenario**: User selects SOL to analyze recent volatility.

**Result**: Line chart shows jagged red line with sharp ups and downs, indicating high volatility.

---

## Comparison with Other Visualization Tools

| Library | Pros | Cons | Our Choice |
|---------|------|------|------------|
| **D3.js** | ✅ Full control, custom designs | ❌ Steep learning curve | ✅ **Selected** |
| **Chart.js** | ✅ Easy to use | ❌ Less customizable | ❌ |
| **Recharts** | ✅ React-friendly | ❌ Limited design options | ❌ |
| **Plotly** | ✅ Feature-rich | ❌ Heavy bundle size | ❌ |

**Why D3.js?** We needed full control over scales (K formatting), dual-chart system, and custom interactions.

---

## Future Enhancements

1. **Candlestick Charts**: Show open/close/high/low for each time period
2. **Multiple Line Overlay**: Compare 2-3 coins on same chart
3. **Zoom & Pan**: Interactive time range selection
4. **Annotations**: Mark significant events (e.g., "All-time high")
5. **Export**: Download chart as PNG/SVG
6. **Animations**: Smooth transitions between bar and line charts
7. **Technical Indicators**: Add RSI, MACD, Bollinger Bands

---

**Last Updated**: November 4, 2025

