import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'

export default function AQIChart({ data }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const width = el.clientWidth
    const height = 280
    d3.select(el).selectAll('*').remove()
    const svg = d3.select(el).append('svg').attr('width', width).attr('height', height)

    const cities = data.map(d => d.city)
    const x = d3.scaleBand().domain(cities).range([40, width - 20]).padding(0.2)
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.avg_aqi) || 200]).nice().range([height - 30, 10])

    svg.append('g').attr('transform', `translate(0,${height - 30})`).call(d3.axisBottom(x))
    svg.append('g').attr('transform', 'translate(40,0)').call(d3.axisLeft(y))

    const color = d3.scaleSequential(d3.interpolateTurbo).domain([50, 300])

    svg.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => x(d.city))
      .attr('y', d => y(d.avg_aqi))
      .attr('width', x.bandwidth())
      .attr('height', d => (height - 30) - y(d.avg_aqi))
      .attr('fill', d => color(d.avg_aqi))

  }, [data])

  return <div ref={ref} className="aqi-chart" />
}


