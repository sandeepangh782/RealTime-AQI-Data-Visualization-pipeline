import React from 'react'

export default function CitySelector({ cities, selected, onChange }) {
  return (
    <select value={selected} onChange={e => onChange(e.target.value)}>
      <option value="ALL">All Cities</option>
      {cities.map(c => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  )
}


