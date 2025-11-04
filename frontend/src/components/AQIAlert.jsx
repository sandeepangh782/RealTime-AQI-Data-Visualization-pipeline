import React from 'react'
import { TrendingUp, TrendingDown, CheckCircle, AlertTriangle } from 'lucide-react'

export default function CryptoAlert({ data }) {
  // Show alerts for extreme volatility (>10% change)
  const extremeMovers = data.filter(d => Math.abs(d.change_24h) >= 10)
  
  if (extremeMovers.length === 0) {
    return (
      <div className="alerts stable">
        <div className="alert-item success">
          <CheckCircle size={20} />
          <div style={{flex: 1}}>
            <strong>All Clear</strong>
            <div style={{fontSize: '13px', marginTop: '2px', opacity: 0.8}}>
              No extreme price movements detected. Market is relatively stable.
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Sort by absolute change (highest first)
  const sorted = [...extremeMovers].sort((a, b) => Math.abs(b.change_24h) - Math.abs(a.change_24h))

  return (
    <div className="alerts">
      {sorted.map((d, i) => {
        const isPositive = d.change_24h > 0
        const className = isPositive ? 'alert-item success' : 'alert-item danger'
        
        return (
          <div key={i} className={className}>
            {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            <div style={{flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <strong style={{fontSize: '15px'}}>{d.coin}</strong>
                <div style={{fontSize: '13px', marginTop: '2px', opacity: 0.8}}>
                  ${d.price.toLocaleString()} • {d.volatility}
                </div>
              </div>
              <div style={{textAlign: 'right'}}>
                <div style={{fontSize: '18px', fontWeight: 'bold'}}>
                  {isPositive ? '+' : ''}{d.change_24h.toFixed(2)}%
                </div>
                <div style={{fontSize: '12px', opacity: 0.8}}>
                  24h change
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}


