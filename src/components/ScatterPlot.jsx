/**
 * Reusable D3-based scatter plot component
 */
import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { CLUSTER_COLORS } from '../utils/dataGenerators';

export function ScatterPlot({
  data,
  labels = null,
  width = 400,
  height = 400,
  margin = { top: 20, right: 20, bottom: 30, left: 40 },
  pointRadius = 4,
  selectedPoint = null,
  highlightedPoints = [],
  onPointClick = null,
  onPointHover = null,
  showAxes = true,
  colors = CLUSTER_COLORS,
  className = '',
  animate = false,
  edges = null,
  edgeOpacity = 0.3,
}) {
  const svgRef = useRef(null);
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Compute scales
  const { xScale, yScale } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        xScale: d3.scaleLinear().domain([0, 1]).range([0, plotWidth]),
        yScale: d3.scaleLinear().domain([0, 1]).range([plotHeight, 0]),
      };
    }

    const xExtent = d3.extent(data, d => d[0]);
    const yExtent = d3.extent(data, d => d[1]);

    // Add padding
    const xPadding = (xExtent[1] - xExtent[0]) * 0.1 || 1;
    const yPadding = (yExtent[1] - yExtent[0]) * 0.1 || 1;

    return {
      xScale: d3.scaleLinear()
        .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
        .range([0, plotWidth]),
      yScale: d3.scaleLinear()
        .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
        .range([plotHeight, 0]),
    };
  }, [data, plotWidth, plotHeight]);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Draw edges if provided
    if (edges && edges.length > 0) {
      const edgeGroup = g.append('g').attr('class', 'edges');
      edgeGroup.selectAll('line')
        .data(edges)
        .enter()
        .append('line')
        .attr('x1', d => xScale(data[d.source][0]))
        .attr('y1', d => yScale(data[d.source][1]))
        .attr('x2', d => xScale(data[d.target][0]))
        .attr('y2', d => yScale(data[d.target][1]))
        .attr('stroke', '#64748b')
        .attr('stroke-width', d => d.weight ? d.weight * 2 : 1)
        .attr('stroke-opacity', edgeOpacity);
    }

    // Draw axes if enabled
    if (showAxes) {
      g.append('g')
        .attr('transform', `translate(0,${plotHeight})`)
        .call(d3.axisBottom(xScale).ticks(5))
        .attr('class', 'text-slate-400 text-xs');

      g.append('g')
        .call(d3.axisLeft(yScale).ticks(5))
        .attr('class', 'text-slate-400 text-xs');
    }

    // Create point group
    const pointsGroup = g.append('g').attr('class', 'points');

    // Draw points
    const points = pointsGroup.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d[0]))
      .attr('cy', d => yScale(d[1]))
      .attr('r', (d, i) => {
        if (selectedPoint === i) return pointRadius * 1.5;
        if (highlightedPoints.includes(i)) return pointRadius * 1.2;
        return pointRadius;
      })
      .attr('fill', (d, i) => {
        const label = labels ? labels[i] : 0;
        return colors[label % colors.length];
      })
      .attr('fill-opacity', (d, i) => {
        if (selectedPoint !== null && selectedPoint !== i && !highlightedPoints.includes(i)) {
          return 0.3;
        }
        return 0.8;
      })
      .attr('stroke', (d, i) => {
        if (selectedPoint === i) return '#fff';
        if (highlightedPoints.includes(i)) return '#fff';
        return 'none';
      })
      .attr('stroke-width', (d, i) => {
        if (selectedPoint === i) return 2;
        if (highlightedPoints.includes(i)) return 1;
        return 0;
      })
      .style('cursor', onPointClick ? 'pointer' : 'default');

    // Add interactions
    if (onPointClick || onPointHover) {
      points
        .on('click', (event, d) => {
          if (onPointClick) {
            const index = data.indexOf(d);
            onPointClick(index, d);
          }
        })
        .on('mouseenter', (event, d) => {
          if (onPointHover) {
            const index = data.indexOf(d);
            onPointHover(index, d);
          }
        })
        .on('mouseleave', () => {
          if (onPointHover) {
            onPointHover(null, null);
          }
        });
    }

    // Animation for initial render
    if (animate) {
      points
        .attr('r', 0)
        .transition()
        .duration(500)
        .delay((d, i) => i * 2)
        .attr('r', (d, i) => {
          if (selectedPoint === i) return pointRadius * 1.5;
          if (highlightedPoints.includes(i)) return pointRadius * 1.2;
          return pointRadius;
        });
    }

  }, [data, labels, xScale, yScale, selectedPoint, highlightedPoints, edges, edgeOpacity,
      pointRadius, showAxes, colors, onPointClick, onPointHover, animate, margin, plotHeight]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className={`bg-slate-900/50 rounded-lg ${className}`}
    />
  );
}

export default ScatterPlot;
