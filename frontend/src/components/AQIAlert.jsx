import React from 'react'

export default function AQIAlert({ data, threshold = 150 }) {
  const alerts = data.filter(d => d.avg_aqi >= threshold)
  if (alerts.length === 0) return null
  return (
    <div className="alerts">
      {alerts.map((d, i) => (
        <div key={i} className="alert-item">
          ⚠️ {d.city}: {d.avg_aqi} ({d.status})
        </div>
      ))}
    </div>
  )
}


