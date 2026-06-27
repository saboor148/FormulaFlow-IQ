import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { FormulaLearningModule } from '../types';
import { BookOpen, HelpCircle, Activity, Award } from 'lucide-react';

interface ChartProps {
  formulas: FormulaLearningModule[];
  selectedFormulaId: string;
  onSelectFormula: (id: string) => void;
}

interface FormulaChartData {
  id: string;
  name: string;
  category: string;
  complexity: number; // 1 to 10
  frequency: number; // 0 to 100%
  descriptionUrdu: string;
  descriptionEnglish: string;
  template: string;
}

export default function FormulaComplexityChart({
  formulas,
  selectedFormulaId,
  onSelectFormula,
}: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 350 });
  const [hoveredData, setHoveredData] = useState<FormulaChartData | null>(null);

  // Map the formulas from FORMULAS_LEARNING to complexity & frequency metrics
  const chartData: FormulaChartData[] = formulas.map((f) => {
    let complexity = 2;
    let frequency = 95;

    if (f.id === 'sum') {
      complexity = 2;
      frequency = 98;
    } else if (f.id === 'average') {
      complexity = 3;
      frequency = 90;
    } else if (f.id === 'countif') {
      complexity = 5.5;
      frequency = 75;
    } else if (f.id === 'vlookup') {
      complexity = 7.5;
      frequency = 68;
    } else if (f.id === 'pmt') {
      complexity = 9.2;
      frequency = 40;
    }

    return {
      id: f.id,
      name: f.name.split(' ')[0], // Get just the formula name e.g. "SUM"
      category: f.category,
      complexity,
      frequency,
      descriptionUrdu: f.whatItDoesUrdu,
      descriptionEnglish: f.whatItDoesEnglish,
      template: f.formulaTemplate,
    };
  });

  // Handle responsiveness using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      // Maintain aspect ratio, set a minimum width of 280px and height around 350px
      const newWidth = Math.max(280, width);
      const newHeight = window.innerWidth < 640 ? 300 : 360;
      setDimensions({ width: newWidth, height: newHeight });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Render the D3 Chart
  useEffect(() => {
    if (!svgRef.current || chartData.length === 0) return;

    // Clear previous elements
    const svgElement = d3.select(svgRef.current);
    svgElement.selectAll('*').remove();

    const { width, height } = dimensions;
    const margin = { top: 40, right: 120, bottom: 50, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Create the main SVG group
    const g = svgElement
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define X & Y scales
    const xScale = d3.scaleLinear()
      .domain([0, 10]) // Complexity scale 0 to 10
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([20, 100]) // Frequency scale 20% to 100%
      .range([chartHeight, 0]);

    // Color scale for categories
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['Basic', 'Conditional', 'Lookup', 'Finance'])
      .range(['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b']);

    // Background threshold shading (Zones of Advanced vs Basic)
    // 1. Basic zone (Complexity <= 4)
    g.append('rect')
      .attr('x', xScale(0))
      .attr('y', 0)
      .attr('width', xScale(4) - xScale(0))
      .attr('height', chartHeight)
      .attr('fill', '#10b981')
      .attr('fill-opacity', 0.03);

    // 2. Intermediate zone (4 < Complexity <= 7)
    g.append('rect')
      .attr('x', xScale(4))
      .attr('y', 0)
      .attr('width', xScale(7) - xScale(4))
      .attr('height', chartHeight)
      .attr('fill', '#3b82f6')
      .attr('fill-opacity', 0.03);

    // 3. Advanced zone (Complexity > 7)
    g.append('rect')
      .attr('x', xScale(7))
      .attr('y', 0)
      .attr('width', xScale(10) - xScale(7))
      .attr('height', chartHeight)
      .attr('fill', '#f59e0b')
      .attr('fill-opacity', 0.04);

    // Add dashed lines dividing basic / intermediate / advanced
    g.append('line')
      .attr('x1', xScale(4))
      .attr('y1', 0)
      .attr('x2', xScale(4))
      .attr('y2', chartHeight)
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '4,4')
      .attr('stroke-width', 1.5);

    g.append('line')
      .attr('x1', xScale(7))
      .attr('y1', 0)
      .attr('x2', xScale(7))
      .attr('y2', chartHeight)
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '4,4')
      .attr('stroke-width', 1.5);

    // Labels for Complexity Zones
    g.append('text')
      .attr('x', xScale(2))
      .attr('y', -12)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[10px] font-bold fill-emerald-600 tracking-wider uppercase')
      .text('Basic Zone');

    g.append('text')
      .attr('x', xScale(5.5))
      .attr('y', -12)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[10px] font-bold fill-blue-600 tracking-wider uppercase')
      .text('Intermediate');

    g.append('text')
      .attr('x', xScale(8.5))
      .attr('y', -12)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[10px] font-bold fill-amber-600 tracking-wider uppercase')
      .text('Advanced Zone');

    // Grid lines - Horizontal
    g.append('g')
      .attr('class', 'grid-lines stroke-slate-100')
      .call(d3.axisLeft(yScale)
        .tickSize(-chartWidth)
        .tickFormat(() => '')
      );

    // Grid lines - Vertical
    g.append('g')
      .attr('class', 'grid-lines stroke-slate-100')
      .call(d3.axisBottom(xScale)
        .tickSize(chartHeight)
        .tickFormat(() => '')
      );

    // Configure X-axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(10)
      .tickFormat((d) => `${d}`);

    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .attr('class', 'axis text-[10px] text-slate-500 font-mono')
      .call(xAxis);

    // Configure Y-axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(6)
      .tickFormat((d) => `${d}%`);

    g.append('g')
      .attr('class', 'axis text-[10px] text-slate-500 font-mono')
      .call(yAxis);

    // Add X-axis Label
    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + 35)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[11px] font-medium fill-slate-500')
      .text('Formula Complexity Level (Basaan ➜ Mushkil / 1 to 10)');

    // Add Y-axis Label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -chartHeight / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[11px] font-medium fill-slate-500')
      .text('Usage Frequency in Sheets (%)');

    // Add formula bubbles
    const bubbles = g.selectAll('.formula-bubble')
      .data(chartData)
      .enter()
      .append('g')
      .attr('class', 'formula-bubble cursor-pointer')
      .attr('transform', (d) => `translate(${xScale(d.complexity)},${yScale(d.frequency)})`)
      .on('click', (_event, d) => {
        onSelectFormula(d.id);
      })
      .on('mouseover', (_event, d) => {
        setHoveredData(d);
      })
      .on('mouseleave', () => {
        setHoveredData(null);
      });

    // Outer highlighted selection ring
    bubbles.append('circle')
      .attr('r', 24)
      .attr('fill', 'none')
      .attr('stroke', (d) => colorScale(d.category) as string)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '3,3')
      .attr('class', 'transition-all duration-300')
      .attr('opacity', (d) => (d.id === selectedFormulaId ? 0.9 : 0))
      .style('animation', (d) => (d.id === selectedFormulaId ? 'spin 12s linear infinite' : 'none'));

    // Core bubble circle
    bubbles.append('circle')
      .attr('r', (d) => (d.id === selectedFormulaId ? 16 : 14))
      .attr('fill', (d) => colorScale(d.category) as string)
      .attr('fill-opacity', 0.85)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('class', 'transition-all duration-300 hover:scale-125 shadow-sm');

    // Text name in bubble
    bubbles.append('text')
      .attr('dy', '.3em')
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[9px] font-extrabold fill-white tracking-tighter pointer-events-none select-none')
      .text((d) => d.name);

    // Label beside bubble (optional but helpful for immediate scannability)
    bubbles.append('text')
      .attr('dx', 20)
      .attr('dy', '.3em')
      .attr('text-anchor', 'start')
      .attr('class', (d) => `text-[10px] font-semibold select-none transition-colors ${
        d.id === selectedFormulaId ? 'fill-slate-900 font-extrabold' : 'fill-slate-500 hover:fill-slate-800'
      }`)
      .text((d) => d.name);

    // Simple custom CSS style tag for rotation of selection rings
    const styleNode = svgElement.select('#spin-style');
    if (styleNode.empty()) {
      svgElement.append('style')
        .attr('id', 'spin-style')
        .text(`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `);
    }

  }, [dimensions, selectedFormulaId, chartData]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <span>Formula Matrix: Complexity vs. Frequency</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Visual interactive D3 map showing how advanced each formula is (Complexity) vs how often it's used (Frequency). Click any node to select!
          </p>
        </div>

        {/* Categories Legend */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600 font-medium">Basic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-slate-600 font-medium">Conditional</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
            <span className="text-slate-600 font-medium">Lookup</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="text-slate-600 font-medium">Finance</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* SVG Chart Panel */}
        <div ref={containerRef} className="lg:col-span-8 relative bg-slate-50/50 rounded-xl border border-slate-100 p-2 overflow-hidden flex items-center justify-center">
          <svg ref={svgRef} className="max-w-full block select-none"></svg>
        </div>

        {/* Dynamic Detail Panel or Hover Tooltip */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {hoveredData ? 'Currently Hovered' : 'Active Selection Info'}
            </span>
            
            {/* Display formula details */}
            {(() => {
              const activeData = hoveredData || chartData.find((d) => d.id === selectedFormulaId);
              if (!activeData) return <p className="text-xs text-slate-400 mt-2">Hover or select a formula node on the chart map.</p>;

              return (
                <div className="space-y-3.5 mt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
                      <code>={activeData.name}</code>
                    </h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase text-white ${
                      activeData.category === 'Basic' ? 'bg-emerald-500' :
                      activeData.category === 'Conditional' ? 'bg-blue-500' :
                      activeData.category === 'Lookup' ? 'bg-purple-500' : 'bg-amber-500'
                    }`}>
                      {activeData.category}
                    </span>
                  </div>

                  {/* Dual language usage insights */}
                  <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-100 text-xs">
                    <p className="font-urdu leading-relaxed text-teal-950 font-medium">
                      {activeData.descriptionUrdu}
                    </p>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {activeData.descriptionEnglish}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block">Complexity</span>
                      <span className="text-lg font-extrabold text-slate-800">{activeData.complexity}/10</span>
                      <span className="text-[9px] text-slate-500 block">
                        {activeData.complexity <= 4 ? '🟢 Easy / Basic' :
                         activeData.complexity <= 7 ? '🔵 Intermediate' : '🟠 Advanced'}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block">Use Frequency</span>
                      <span className="text-lg font-extrabold text-slate-800">{activeData.frequency}%</span>
                      <span className="text-[9px] text-slate-500 block">
                        {activeData.frequency >= 85 ? '🚀 High Demand' :
                         activeData.frequency >= 65 ? '⚡ Standard' : '📉 Special Case'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg border border-slate-800 text-xs font-mono break-all text-center">
                    {activeData.template}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="p-3 bg-teal-50/40 border border-teal-100 rounded-lg text-xs text-teal-900 flex items-start gap-2">
            <BookOpen className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Did you know?</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                SUM represents the simplest tool (Complexity 2/10) but is used in 98% of sheets. VLOOKUP and PMT are advanced (7.5+ Complexity) but highly valued in professional finance workflows!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
