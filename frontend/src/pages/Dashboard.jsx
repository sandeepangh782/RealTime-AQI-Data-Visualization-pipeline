import React, { useEffect, useMemo, useState } from 'react'
import { connectSocket } from '../services/socket'
import AQIChart from '../components/AQIChart.jsx'
import AQIAlert from '../components/AQIAlert.jsx'
import CitySelector from '../components/CitySelector.jsx'

export default function Dashboard() {
  const [updates, setUpdates] = useState([])
  const [selectedCity, setSelectedCity] = useState('ALL')

  useEffect(() => {
    const ws = connectSocket((msg) => {
      if (msg?.type === 'aqi_update' && Array.isArray(msg.data)) {
        console.log('[ui] received', msg.data.length, 'records')
        setUpdates(prev => {
          const merged = [...prev]
          msg.data.forEach(item => {
            const idx = merged.findIndex(m => m.city === item.city)
            if (idx >= 0) merged[idx] = item
            else merged.push(item)
          })
          console.log('[ui] merged updates ->', merged.length)
          return merged
        })
      }
    })
    return () => ws.close()
  }, [])

  const cities = useMemo(() => Array.from(new Set(updates.map(u => u.city))), [updates])
  const filtered = useMemo(() => selectedCity === 'ALL' ? updates : updates.filter(u => u.city === selectedCity), [updates, selectedCity])

  return (
    <div className="dashboard">
      <h1>🌍 Live Air Quality Dashboard</h1>
      <div className="controls">
        <CitySelector cities={cities} selected={selectedCity} onChange={setSelectedCity} />
      </div>
      <AQIAlert data={filtered} />
      <AQIChart data={filtered} />
    </div>
  )
}


