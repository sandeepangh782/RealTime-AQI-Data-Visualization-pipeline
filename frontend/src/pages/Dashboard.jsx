import React, { useEffect, useMemo, useState } from 'react'
import { connectSocket } from '../services/socket'
import CryptoChart from '../components/AQIChart.jsx'
import CryptoAlert from '../components/AQIAlert.jsx'
import CoinSelector from '../components/CitySelector.jsx'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  Target,
  Info,
  Coins as CoinsIcon
} from 'lucide-react'

export default function Dashboard() {
  const [updates, setUpdates] = useState([])
  const [selectedCoin, setSelectedCoin] = useState('ALL')
  const [priceHistory, setPriceHistory] = useState({}) // Store historical data for line charts

  useEffect(() => {
    const ws = connectSocket((msg) => {
      if (msg?.type === 'aqi_update' && Array.isArray(msg.data)) {
        console.log('[ui] 💱 received', msg.data.length, 'crypto records')
        
        // Update current values
        setUpdates(prev => {
          const merged = [...prev]
          msg.data.forEach(item => {
            const idx = merged.findIndex(m => m.coin === item.coin)
            if (idx >= 0) merged[idx] = item
            else merged.push(item)
          })
          console.log('[ui] merged updates ->', merged.length)
          return merged
        })

        // Store historical data for line charts (keep last 20 data points per coin)
        setPriceHistory(prev => {
          const updated = { ...prev }
          msg.data.forEach(item => {
            if (!updated[item.coin]) {
              updated[item.coin] = []
            }
            updated[item.coin].push({
              timestamp: new Date(item.timestamp),
              price: item.price,
              change: item.change_24h
            })
            // Keep only last 20 points (10 minutes of data at 30s intervals)
            if (updated[item.coin].length > 20) {
              updated[item.coin] = updated[item.coin].slice(-20)
            }
          })
          return updated
        })
      }
    })
    return () => ws.close()
  }, [])

  const coins = useMemo(() => Array.from(new Set(updates.map(u => u.coin))), [updates])
  const filtered = useMemo(() => 
    selectedCoin === 'ALL' ? updates : updates.filter(u => u.coin === selectedCoin), 
    [updates, selectedCoin]
  )

  // Calculate market stats
  const marketStats = useMemo(() => {
    if (updates.length === 0) return null
    const totalVolume = updates.reduce((sum, u) => sum + (u.volume_24h || 0), 0)
    const avgChange = updates.reduce((sum, u) => sum + u.change_24h, 0) / updates.length
    const gainers = updates.filter(u => u.change_24h > 0).length
    const losers = updates.filter(u => u.change_24h < 0).length
    const volatile = updates.filter(u => Math.abs(u.change_24h) >= 10).length
    
    return { totalVolume, avgChange, gainers, losers, volatile }
  }, [updates])

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-icon">
            <Activity size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1>Crypto Market Pulse</h1>
            <p className="subtitle">Real-time cryptocurrency market monitoring</p>
          </div>
        </div>
        <div className="live-indicator">
          <span className="pulse-dot"></span>
          Live
        </div>
      </div>

      {/* Market Overview Cards */}
      {marketStats && (
        <div className="market-overview">
          <h2 className="section-title">Market Overview</h2>
          <div className="stats-grid">
            
            {/* 24h Volume Card */}
            <div className="stat-card">
              <div className="card-header">
                <div className="icon-wrapper volume">
                  <DollarSign size={20} />
                </div>
                <div className="card-info-trigger" title="Total USD value traded across all tracked cryptocurrencies in the last 24 hours">
                  <Info size={16} />
                </div>
              </div>
              <div className="card-body">
                <div className="stat-label">24h Trading Volume</div>
                <div className="stat-value">
                  ${(marketStats.totalVolume / 1e9).toFixed(2)}B
                </div>
                <div className="stat-description">
                  Total market activity
                </div>
              </div>
            </div>

            {/* Average Change Card */}
            <div className="stat-card">
              <div className="card-header">
                <div className={`icon-wrapper ${marketStats.avgChange >= 0 ? 'positive' : 'negative'}`}>
                  {marketStats.avgChange >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>
                <div className="card-info-trigger" title="Average price change across all coins in the last 24 hours">
                  <Info size={16} />
                </div>
              </div>
              <div className="card-body">
                <div className="stat-label">Average Change</div>
                <div className={`stat-value ${marketStats.avgChange >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {marketStats.avgChange >= 0 ? '+' : ''}{marketStats.avgChange.toFixed(2)}%
                </div>
                <div className="stat-description">
                  {marketStats.avgChange >= 0 ? 'Bullish momentum' : 'Bearish pressure'}
                </div>
              </div>
            </div>

            {/* Market Sentiment Card */}
            <div className="stat-card">
              <div className="card-header">
                <div className="icon-wrapper sentiment">
                  <Target size={20} />
                </div>
                <div className="card-info-trigger" title="Number of coins with positive vs negative 24h performance">
                  <Info size={16} />
                </div>
              </div>
              <div className="card-body">
                <div className="stat-label">Market Sentiment</div>
                <div className="sentiment-bars">
                  <div className="sentiment-item gainers">
                    <span className="sentiment-count">{marketStats.gainers}</span>
                    <div className="sentiment-bar" style={{width: `${(marketStats.gainers / updates.length) * 100}%`}}></div>
                    <span className="sentiment-label">Gainers</span>
                  </div>
                  <div className="sentiment-item losers">
                    <span className="sentiment-count">{marketStats.losers}</span>
                    <div className="sentiment-bar" style={{width: `${(marketStats.losers / updates.length) * 100}%`}}></div>
                    <span className="sentiment-label">Losers</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Status Card */}
            <div className="stat-card">
              <div className="card-header">
                <div className="icon-wrapper tracking">
                  <CoinsIcon size={20} />
                </div>
                <div className="card-info-trigger" title="Number of cryptocurrencies currently being monitored">
                  <Info size={16} />
                </div>
              </div>
              <div className="card-body">
                <div className="stat-label">Assets Tracked</div>
                <div className="stat-value">{updates.length}</div>
                <div className="stat-description">
                  {marketStats.volatile > 0 ? 
                    `${marketStats.volatile} highly volatile` : 
                    'Market stable'
                  }
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Alerts Section */}
      <div className="alerts-section">
        <h2 className="section-title">Market Alerts</h2>
        <CryptoAlert data={filtered} />
      </div>

      {/* Chart Section */}
      <div className="chart-section">
        <div className="section-header">
          <h2 className="section-title">
            {selectedCoin === 'ALL' ? 'Price Comparison' : `${selectedCoin} Price Trend`}
          </h2>
          <div className="chart-controls">
            <CoinSelector coins={coins} selected={selectedCoin} onChange={setSelectedCoin} />
          </div>
        </div>
        <CryptoChart 
          data={filtered} 
          selectedCoin={selectedCoin}
          priceHistory={priceHistory[selectedCoin] || []}
        />
      </div>

      {/* Footer Info */}
      {updates.length > 0 && (
        <div className="dashboard-footer">
          <div className="footer-info">
            <span>Last updated: {new Date().toLocaleTimeString()} ({Intl.DateTimeFormat().resolvedOptions().timeZone})</span>
            <span>•</span>
            <span>Updates every 30 seconds</span>
            <span>•</span>
            <span>Data from CoinGecko API</span>
          </div>
        </div>
      )}
    </div>
  )
}


