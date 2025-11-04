import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'

export default function CryptoChart({ data, selectedCoin, priceHistory }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const width = el.clientWidth
    const height = 400
    d3.select(el).selectAll('*').remove()

    if (data.length === 0) return

    const svg = d3.select(el).append('svg').attr('width', width).attr('height', height)

    // If single coin selected, ALWAYS show line chart
    if (selectedCoin !== 'ALL') {
      // If we have historical data, use it; otherwise create from current data
      const historyData = priceHistory.length > 0 ? priceHistory : 
        data.filter(d => d.coin === selectedCoin).map(d => ({
          timestamp: new Date(d.timestamp),
          price: d.price,
          change: d.change_24h
        }))
      
      if (historyData.length > 0) {
        renderLineChart(svg, historyData, width, height, selectedCoin)
      }
    } else {
      // Show bar chart for all coins comparison
      renderBarChart(svg, data, width, height)
    }
  }, [data, selectedCoin, priceHistory])

  return <div ref={ref} className="crypto-chart" />
}

// Line chart for single coin trend
function renderLineChart(svg, history, width, height, coinName) {
  const margin = { top: 20, right: 30, bottom: 50, left: 60 }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  // Scales
  const timeExtent = d3.extent(history, d => d.timestamp)
  const x = d3.scaleTime()
    .domain(timeExtent)
    .range([0, chartWidth])

  const minPrice = d3.min(history, d => d.price)
  const maxPrice = d3.max(history, d => d.price)
  const priceRange = maxPrice - minPrice
  const padding = priceRange > 0 ? priceRange * 0.1 : maxPrice * 0.05
  
  const yPrice = d3.scaleLinear()
    .domain([minPrice - padding, maxPrice + padding])
    .nice()
    .range([chartHeight, 0])

  // Grid lines
  g.append('g')
    .attr('class', 'grid')
    .attr('opacity', 0.1)
    .call(d3.axisLeft(yPrice).tickSize(-chartWidth).tickFormat(''))

  // X Axis - smart time formatting
  const timeDiff = timeExtent[1] - timeExtent[0]
  const timeFormat = timeDiff < 3600000 ? '%H:%M:%S' : '%H:%M' // Use seconds if < 1 hour
  
  g.append('g')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x).ticks(8).tickFormat(d3.timeFormat(timeFormat)))
    .selectAll('text')
    .style('font-size', '11px')
    .style('fill', '#6b7280')

  // Y Axis with smart K formatting (same as bar chart)
  g.append('g')
    .call(d3.axisLeft(yPrice).ticks(6).tickFormat(d => {
      if (d >= 1000) return `$${(d/1000).toFixed(d >= 10000 ? 0 : 1)}K`
      if (d >= 1) return `$${d.toFixed(0)}`
      return `$${d.toFixed(2)}`
    }))
    .selectAll('text')
    .style('font-size', '11px')
    .style('fill', '#6b7280')

  // Area under line
  const area = d3.area()
    .x(d => x(d.timestamp))
    .y0(chartHeight)
    .y1(d => yPrice(d.price))
    .curve(d3.curveMonotoneX)

  g.append('path')
    .datum(history)
    .attr('fill', 'url(#gradient)')
    .attr('d', area)
    .attr('opacity', 0.3)

  // Gradient for area
  const gradient = svg.append('defs')
    .append('linearGradient')
    .attr('id', 'gradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%')

  const lastChange = history[history.length - 1].change
  const isPositive = lastChange >= 0

  gradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', isPositive ? '#10b981' : '#ef4444')
    .attr('stop-opacity', 0.5)

  gradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', isPositive ? '#10b981' : '#ef4444')
    .attr('stop-opacity', 0)

  // Line
  const line = d3.line()
    .x(d => x(d.timestamp))
    .y(d => yPrice(d.price))
    .curve(d3.curveMonotoneX)

  g.append('path')
    .datum(history)
    .attr('fill', 'none')
    .attr('stroke', isPositive ? '#10b981' : '#ef4444')
    .attr('stroke-width', 3)
    .attr('d', line)

  // Dots
  g.selectAll('.dot')
    .data(history)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', d => x(d.timestamp))
    .attr('cy', d => yPrice(d.price))
    .attr('r', 4)
    .attr('fill', isPositive ? '#10b981' : '#ef4444')
    .attr('stroke', 'white')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this).attr('r', 6)
      
      // Helper to format price in tooltip
      const formatTooltipPrice = (price) => {
        if (price >= 1000) return `$${(price/1000).toFixed(2)}K`
        if (price >= 1) return `$${price.toFixed(2)}`
        return `$${price.toFixed(4)}`
      }
      
      // Tooltip
      const tooltip = g.append('g').attr('class', 'tooltip')
      
      tooltip.append('rect')
        .attr('x', x(d.timestamp) - 60)
        .attr('y', yPrice(d.price) - 50)
        .attr('width', 120)
        .attr('height', 40)
        .attr('fill', 'white')
        .attr('stroke', '#e5e7eb')
        .attr('rx', 6)
        .style('filter', 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))')

      tooltip.append('text')
        .attr('x', x(d.timestamp))
        .attr('y', yPrice(d.price) - 32)
        .attr('text-anchor', 'middle')
        .style('font-size', '13px')
        .style('font-weight', 'bold')
        .style('fill', '#1a1a1a')
        .text(formatTooltipPrice(d.price))

      tooltip.append('text')
        .attr('x', x(d.timestamp))
        .attr('y', yPrice(d.price) - 16)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('fill', '#6b7280')
        .text(d3.timeFormat('%H:%M:%S')(d.timestamp))
    })
    .on('mouseout', function() {
      d3.select(this).attr('r', 4)
      g.select('.tooltip').remove()
    })

  // Current price label with smart formatting
  const currentPrice = history[history.length - 1].price
  const currentChange = history[history.length - 1].change
  
  const formatPrice = (price) => {
    if (price >= 1000) return `$${(price/1000).toFixed(price >= 10000 ? 1 : 2)}K`
    if (price >= 1) return `$${price.toFixed(2)}`
    return `$${price.toFixed(4)}`
  }

  g.append('text')
    .attr('x', chartWidth / 2)
    .attr('y', -5)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .style('fill', '#1a1a1a')
    .text(`${coinName}: ${formatPrice(currentPrice)}`)

  g.append('text')
    .attr('x', chartWidth / 2 + 80)
    .attr('y', -5)
    .attr('text-anchor', 'start')
    .style('font-size', '14px')
    .style('font-weight', '600')
    .style('fill', isPositive ? '#10b981' : '#ef4444')
    .text(`${currentChange >= 0 ? '+' : ''}${currentChange.toFixed(2)}%`)
}

// Bar chart for multiple coins comparison
function renderBarChart(svg, data, width, height) {
  const coins = data.map(d => d.coin)
  const x = d3.scaleBand().domain(coins).range([70, width - 20]).padding(0.3)
  
  // Linear scale with smart range
  const maxPrice = d3.max(data, d => d.price) || 100
  const yPrice = d3.scaleLinear()
    .domain([0, maxPrice * 1.1]) // Add 10% padding at top
    .nice()
    .range([height - 80, 60])

  // Add horizontal grid lines for easier reading
  svg.append('g')
    .attr('class', 'grid')
    .attr('transform', 'translate(70,0)')
    .call(d3.axisLeft(yPrice)
      .ticks(6)
      .tickSize(-(width - 90))
      .tickFormat('')
    )
    .style('stroke', '#e5e7eb')
    .style('stroke-width', '1')
    .style('opacity', '0.3')
    .selectAll('line')
    .style('stroke-dasharray', '2,2')

  // Draw X-axis
  svg.append('g')
    .attr('transform', `translate(0,${height - 80})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .style('font-size', '12px')
    .style('font-weight', 'bold')
    .style('fill', '#6b7280')

  // Y-axis with smart formatting (K for thousands)
  svg.append('g')
    .attr('transform', 'translate(70,0)')
    .call(d3.axisLeft(yPrice)
      .ticks(6)
      .tickFormat(d => {
        if (d >= 1000) return `$${(d/1000).toFixed(d >= 10000 ? 0 : 1)}K`
        if (d >= 1) return `$${d.toFixed(0)}`
        return `$${d.toFixed(2)}`
      })
    )
    .selectAll('text')
    .style('font-size', '11px')
    .style('fill', '#6b7280')
  
  // Add axis label
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -(height / 2))
    .attr('y', 15)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('fill', '#6b7280')
    .style('font-weight', '600')
    .text('Price (USD)')
  
  // Add note about smaller values
  svg.append('text')
    .attr('x', width - 20)
    .attr('y', 75)
    .attr('text-anchor', 'end')
    .style('font-size', '10px')
    .style('fill', '#9ca3af')
    .style('font-style', 'italic')
    .text('Note: Lower-priced coins may appear small due to scale')

  // Color scale for change percentage
  const colorScale = d3.scaleLinear()
    .domain([-10, 0, 10])
    .range(['#ef4444', '#94a3b8', '#22c55e'])

  // Draw price bars
  svg.selectAll('.price-bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'price-bar')
    .attr('x', d => x(d.coin))
    .attr('y', d => yPrice(d.price))
    .attr('width', x.bandwidth())
    .attr('height', d => (height - 80) - yPrice(d.price))
    .attr('fill', '#667eea')
    .attr('opacity', 0.8)
    .attr('rx', 4)

  // Add price labels on top of bars
  svg.selectAll('.price-label')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'price-label')
    .attr('x', d => x(d.coin) + x.bandwidth() / 2)
    .attr('y', d => yPrice(d.price) - 5)
    .attr('text-anchor', 'middle')
    .style('font-size', '11px')
    .style('font-weight', 'bold')
    .style('fill', '#667eea')
    .text(d => `$${d.price.toLocaleString()}`)

  // Draw change % indicators below
  const changeBarHeight = 20
  svg.selectAll('.change-bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'change-bar')
    .attr('x', d => x(d.coin))
    .attr('y', height - 50)
    .attr('width', x.bandwidth())
    .attr('height', changeBarHeight)
    .attr('fill', d => colorScale(d.change_24h))
    .attr('opacity', 0.9)
    .attr('rx', 4)

  // Add change % labels
  svg.selectAll('.change-label')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'change-label')
    .attr('x', d => x(d.coin) + x.bandwidth() / 2)
    .attr('y', height - 35)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('font-weight', 'bold')
    .style('fill', '#fff')
    .text(d => `${d.change_24h > 0 ? '+' : ''}${d.change_24h.toFixed(1)}%`)
}


