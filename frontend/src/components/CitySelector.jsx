import React from 'react'

export default function CoinSelector({ coins, selected, onChange }) {
  return (
    <select 
      value={selected} 
      onChange={e => onChange(e.target.value)}
      aria-label="Select cryptocurrency"
    >
      <option value="ALL">All Cryptocurrencies</option>
      {coins.sort().map(c => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  )
}


