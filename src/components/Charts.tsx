'use client';

import { useEffect, useState, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
  CartesianGrid, ScatterChart, Scatter, ZAxis,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Treemap, Legend, ComposedChart
} from 'recharts';

export const COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#f97316','#14b8a6','#a855f7','#64748b','#e11d48'];

export const fmtFull = (n: number) => new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 0 }).format(n);
const fmtShort = (v: number) => v >= 1_000_000 ? `₡${(v/1_000_000).toFixed(1)}M` : v >= 1_000 ? `₡${(v/1_000).toFixed(0)}K` : `₡${v}`;

// ============================================================
//  CUSTOM TOOLTIP
// ============================================================
function CustomTooltip({ active, payload, label, totalGlobal }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-title">{label}</div>
      {payload.map((p: any, i: number) => {
        const pct = totalGlobal && totalGlobal > 0 ? ((p.value / totalGlobal) * 100).toFixed(1) : null;
        return (
          <div key={i} className="tooltip-row">
            <span className="tooltip-label">
              <span className="tooltip-dot" style={{ background: p.color || p.fill }} />
              {p.name || p.dataKey}
            </span>
            <span className="tooltip-value">
              {typeof p.value === 'number' && p.value > 1000 ? fmtFull(p.value) : p.value?.toLocaleString('es-CR')}
              {pct && <span className="tooltip-pct">({pct}%)</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
//  AREA CHART — Tendencia Semanal
// ============================================================
export function TendenciaSemanalChart({ data, onBarClick }: { data: any[]; onBarClick?: (sem: string) => void }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} style={{ cursor: 'pointer' }}>
        <defs>
          <linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="semana" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtShort} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="total" stroke="#22c55e" fill="url(#gGreen)" strokeWidth={2.5} name="Facturado"
          activeDot={(props: any) => {
            const { cx, cy, payload } = props;
            return <circle cx={cx} cy={cy} r={6} fill="#22c55e" stroke="#fff" strokeWidth={2} cursor="pointer" onClick={() => onBarClick?.(String(payload.semana))} />;
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ============================================================
//  COMPOSED CHART — Tendencia Mensual (Area + Bars)
// ============================================================
const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export function TendenciaMensualChart({ data, onBarClick }: { data: any[]; onBarClick?: (mesFull: string) => void }) {
  const formattedData = data.map(d => {
    const [year, month] = d.mesFull.split('-');
    return {
      ...d,
      label: `${MONTH_NAMES[parseInt(month) - 1]} ${year}`,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={formattedData} style={{ cursor: 'pointer' }}>
        <defs>
          <linearGradient id="gGreenMonthly" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis yAxisId="left" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtShort} />
        <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} hide />
        <Tooltip content={<CustomTooltip />} />
        <Bar yAxisId="right" dataKey="registros" fill="#d4a76a" opacity={0.45} radius={[4, 4, 0, 0]} name="Actividad"
          onClick={(d: any) => onBarClick?.(d.payload?.mesFull)} cursor="pointer" />
        <Area yAxisId="left" type="monotone" dataKey="total" stroke="#22c55e" fill="url(#gGreenMonthly)" strokeWidth={2.5} name="Monto"
          activeDot={(props: any) => {
            const { cx, cy, payload } = props;
            return <circle cx={cx} cy={cy} r={6} fill="#22c55e" stroke="#fff" strokeWidth={2} cursor="pointer" onClick={() => onBarClick?.(payload.mesFull)} />;
          }}
          dot={(props: any) => {
            const { cx, cy, payload, index } = props;
            return <circle key={index} cx={cx} cy={cy} r={4} fill="#fff" stroke="#22c55e" strokeWidth={2} />;
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ============================================================
//  BAR CHART — Top Labores
// ============================================================
export function TopLaboresChart({ data, onBarClick, selectedLabor, totalGlobal }: { data: any[]; onBarClick?: (labor: string) => void; selectedLabor?: string; totalGlobal?: number }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtShort} />
        <YAxis type="category" dataKey="displayLabor" stroke="#64748b" fontSize={9} width={130} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip totalGlobal={totalGlobal} />} />
        <Bar dataKey="total" radius={[0, 6, 6, 0]} name="Total" onClick={(d: any) => onBarClick?.(d.payload?.labor)} cursor="pointer">
          {data.map((entry, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={selectedLabor && entry.labor !== selectedLabor ? 0.25 : 1} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================================
//  BAR CHART — Costo por Hectárea
// ============================================================
export function CostoPorHaChart({ data, onBarClick, selectedLote, totalGlobal }: { data: any[]; onBarClick?: (lote: string) => void; selectedLote?: string; totalGlobal?: number }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="lote" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtShort} />
        <Tooltip content={<CustomTooltip totalGlobal={totalGlobal} />} />
        <Bar dataKey="costoHa" radius={[6, 6, 0, 0]} name="Costo / Ha" onClick={(d: any) => onBarClick?.(d.payload?.lote)} cursor="pointer">
          {data.map((entry, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={selectedLote && entry.lote !== selectedLote ? 0.25 : 1} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================================
//  PIE CHART — Por Unidad
// ============================================================
export function UnidadPieChart({ data, onSliceClick, selectedUnidad }: { data: any[]; onSliceClick?: (name: string) => void; selectedUnidad?: string }) {
  return (
    <>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value"
            onClick={(e: any) => onSliceClick?.(e.name)} style={{ cursor: 'pointer' }}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} opacity={selectedUnidad && d.name !== selectedUnidad ? 0.25 : 1}
                stroke={selectedUnidad === d.name ? '#fff' : 'none'} strokeWidth={selectedUnidad === d.name ? 2 : 0} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.map(u => (
          <div key={u.name} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', opacity: selectedUnidad && u.name !== selectedUnidad ? 0.3 : 1, transition: 'opacity 0.2s' }} onClick={() => onSliceClick?.(u.name)}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: u.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 12, color: '#94a3b8' }}>{u.name}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', fontFamily: 'monospace' }}>{u.value}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ============================================================
//  LINE CHART — Registros por Mes
// ============================================================
export function RegistrosMesChart({ data, onPointClick, selectedMes }: { data: any[]; onPointClick?: (mesFull: string) => void; selectedMes?: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="mes" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="registros" stroke="#ec4899" strokeWidth={2} name="Registros"
          activeDot={(props: any) => {
            const { cx, cy, payload } = props;
            return <circle cx={cx} cy={cy} r={6} fill={selectedMes === payload.mesFull ? '#fff' : '#ec4899'} stroke="#ec4899" strokeWidth={2} cursor="pointer" onClick={() => onPointClick?.(payload.mesFull)} />;
          }}
          dot={(props: any) => {
            const { cx, cy, payload } = props;
            return <circle key={payload.mesFull} cx={cx} cy={cy} r={selectedMes === payload.mesFull ? 6 : 4} fill="#ec4899" opacity={selectedMes && selectedMes !== payload.mesFull ? 0.3 : 1} />;
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ============================================================
//  AREA CHART — Costo por Mes (Full Width)
// ============================================================
export function CostoMensualChart({ data, onPointClick }: { data: any[]; onPointClick?: (mesFull: string) => void }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} style={{ cursor: 'pointer' }}>
        <defs>
          <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="mes" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={fmtShort} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="url(#gBlue)" strokeWidth={3} name="Costo Total"
          activeDot={(props: any) => {
            const { cx, cy, payload } = props;
            return <circle cx={cx} cy={cy} r={6} fill="#3b82f6" stroke="#fff" strokeWidth={2} cursor="pointer" onClick={() => onPointClick?.(payload.mesFull)} />;
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ============================================================
//  TREEMAP — Distribución de Labores por Costo
// ============================================================
const TreemapContent = ({ x, y, width, height, name, value, index }: any) => {
  const fill = COLORS[index % COLORS.length];

  // Decide what to show based on cell size
  const canShowLabel = width > 55 && height > 28;
  const canShowValue = width > 70 && height > 52;

  // Adaptive font size: larger cells get bigger text, minimum 10px
  const labelFontSize = Math.max(10, Math.min(14, width / 11));
  const valueFontSize = Math.max(9, Math.min(12, width / 13));

  // Adaptive label truncation: more chars for wider cells
  const maxChars = Math.max(8, Math.floor(width / (labelFontSize * 0.55)));
  const label = name ? (name.length > maxChars ? name.substring(0, maxChars) + '…' : name) : '';

  // Center positions
  const cx = x + width / 2;
  const cy = canShowValue ? y + height / 2 - 8 : y + height / 2;

  // Pill dimensions for dark background behind label
  const charWidth = labelFontSize * 0.58;
  const pillW = Math.min(label.length * charWidth + 14, width - 6);
  const pillH = labelFontSize + 8;
  const pillX = cx - pillW / 2;
  const pillY = cy - pillH / 2;

  // Value pill
  const valText = fmtShort(value);
  const valPillW = Math.min(valText.length * valueFontSize * 0.58 + 12, width - 6);
  const valPillH = valueFontSize + 8;
  const valPillX = cx - valPillW / 2;
  const valCy = cy + pillH / 2 + 4 + valPillH / 2;

  return (
    <g>
      {/* Cell background */}
      <rect
        x={x + 1} y={y + 1}
        width={width - 2} height={height - 2}
        rx={6} ry={6}
        fill={fill}
        fillOpacity={0.88}
        stroke="#06090f"
        strokeWidth={2}
      />

      {/* Dark pill background for label */}
      {canShowLabel && (
        <rect
          x={pillX} y={pillY}
          width={pillW} height={pillH}
          rx={5} ry={5}
          fill="rgba(0,0,0,0.55)"
        />
      )}

      {/* Label text — with SVG stroke outline for maximum contrast */}
      {canShowLabel && (
        <text
          x={cx} y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={labelFontSize}
          fontWeight={700}
          fontFamily="Inter, sans-serif"
          fill="#ffffff"
          stroke="rgba(0,0,0,0.7)"
          strokeWidth={2.5}
          paintOrder="stroke fill"
          style={{ pointerEvents: 'none', letterSpacing: '0.01em' }}
        >
          {label}
        </text>
      )}

      {/* Dark pill background for value */}
      {canShowValue && (
        <rect
          x={valPillX} y={valCy - valPillH / 2}
          width={valPillW} height={valPillH}
          rx={4} ry={4}
          fill="rgba(0,0,0,0.45)"
        />
      )}

      {/* Value text */}
      {canShowValue && (
        <text
          x={cx} y={valCy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={valueFontSize}
          fontWeight={600}
          fontFamily="Inter, monospace"
          fill="rgba(255,255,255,0.95)"
          stroke="rgba(0,0,0,0.5)"
          strokeWidth={2}
          paintOrder="stroke fill"
          style={{ pointerEvents: 'none' }}
        >
          {valText}
        </text>
      )}
    </g>
  );
};

export function TreemapLaboresChart({ data, onLaborClick }: { data: any[]; onLaborClick?: (labor: string) => void }) {
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <Treemap
        data={data}
        dataKey="total"
        aspectRatio={16 / 7}
        stroke="#06090f"
        content={<TreemapContent />}
        onClick={(d: any) => onLaborClick?.(d.labor)}
        style={{ cursor: 'pointer' }}
      />
    </ResponsiveContainer>
  );
}


// ============================================================
//  SCATTER CHART — Área vs Costo por Lote
// ============================================================
export function ScatterLoteChart({ data }: { data: any[] }) {
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="area"
          name="Área (Ha)"
          stroke="#64748b"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          label={{ value: 'Área (Ha)', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 10 }}
          height={40}
        />
        <YAxis
          dataKey="costo"
          name="Costo Total"
          stroke="#64748b"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tickFormatter={fmtShort}
        />
        <ZAxis dataKey="registros" range={[60, 500]} name="Registros" />
        <Tooltip
          cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }}
          content={({ active, payload }: any) => {
            if (!active || !payload?.length) return null;
            const d = payload[0]?.payload;
            return (
              <div className="custom-tooltip">
                <div className="tooltip-title" style={{ color: '#22c55e' }}>Lote {d?.lote}</div>
                <div className="tooltip-row"><span className="tooltip-label">Área Total</span><span className="tooltip-value">{d?.area?.toFixed(1)} Ha</span></div>
                <div className="tooltip-row"><span className="tooltip-label">Costo Total</span><span className="tooltip-value">{fmtFull(d?.costo)}</span></div>
                <div className="tooltip-row"><span className="tooltip-label">Registros</span><span className="tooltip-value">{d?.registros}</span></div>
                <div className="tooltip-row"><span className="tooltip-label">Costo/Ha</span><span className="tooltip-value">{fmtFull(d?.costoHa)}</span></div>
              </div>
            );
          }}
        />
        <Scatter data={data} name="Lotes">
          {data.map((entry, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

// ============================================================
//  STACKED BAR — Costo por Grupo por Mes
// ============================================================
export function StackedGrupoMesChart({ data, grupos, onBarClick }: { data: any[]; grupos: string[]; onBarClick?: (mes: string, grupo: string) => void }) {
  if (!data?.length || !grupos?.length) return null;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="mes" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtShort} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }}
          formatter={(value) => `Grupo ${value}`}
        />
        {grupos.map((g, i) => (
          <Bar key={g} dataKey={g} name={g} stackId="stack" fill={COLORS[i % COLORS.length]}
            radius={i === grupos.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            cursor={onBarClick ? "pointer" : undefined}
 onClick={(d: any) => onBarClick?.(d?.payload?.mes, g)} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================================
//  RADAR CHART — Comparativo Lotes
// ============================================================
export function RadarLoteChart({ data, lotes }: { data: any[]; lotes: string[] }) {
  if (!data?.length || !lotes?.length) return null;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius={95}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={10} tick={{ fill: '#94a3b8', fontSize: 10 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.05)" tick={{ fill: '#475569', fontSize: 8 }} />
        <Tooltip content={<CustomTooltip />} />
        {lotes.slice(0, 5).map((lote, i) => (
          <Radar
            key={lote}
            name={`Lote ${lote}`}
            dataKey={lote}
            stroke={COLORS[i % COLORS.length]}
            fill={COLORS[i % COLORS.length]}
            fillOpacity={0.12}
            strokeWidth={2}
          />
        ))}
        <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} formatter={(v) => `Lote ${v}`} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ============================================================
//  ANIMATED COUNTER
// ============================================================
export function AnimatedCounter({ value, prefix = '', suffix = '', color = '#f1f5f9', delay = 0 }: { value: number; prefix?: string; suffix?: string; color?: string; delay?: number }) {
  const [count, setCount] = useState(0);
  const animated = useRef(false);

  useEffect(() => {
    if (animated.current) return;
    const timer = setTimeout(() => {
      animated.current = true;
      const duration = 1000;
      const steps = 35;
      const inc = value / steps;
      let curr = 0;
      const interval = setInterval(() => {
        curr += inc;
        if (curr >= value) { setCount(value); clearInterval(interval); }
        else setCount(Math.floor(curr));
      }, duration / steps);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <span className="kpi-value" style={{ color, opacity: 0, animation: `countUp 0.4s ease ${delay}ms forwards`, fontSize: String(count).length > 8 ? 22 : 28 }}>
      {prefix}{count.toLocaleString('es-CR')}{suffix}
    </span>
  );
}

// ============================================================
//  MINI SPARKLINE (SVG-based)
// ============================================================
export function MiniSparkline({ data, color = '#22c55e', height = 24 }: { data: number[]; color?: string; height?: number }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const h = height;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} className="kpi-sparkline" viewBox={`0 0 ${w} ${h}`}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ============================================================
//  PARETO CHART — 80/20 Cost Concentration
// ============================================================
export function ParetoChart({ data, onLaborClick }: { data: { labor: string; total: number; acumulado: number }[]; onLaborClick?: (labor: string) => void }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} style={{ cursor: 'pointer' }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="labor" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} angle={-35} textAnchor="end" height={60} interval={0} />
        <YAxis yAxisId="left" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtShort} />
        <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} domain={[0, 100]} />
        <Tooltip content={<ParetoTooltip />} />
        <Bar yAxisId="left" dataKey="total" radius={[4, 4, 0, 0]} name="Costo"
          onClick={(d: any) => onLaborClick?.(d.fullLabor)}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.acumulado <= 80 ? '#22c55e' : entry.acumulado <= 95 ? '#f59e0b' : '#64748b'} opacity={entry.acumulado <= 80 ? 1 : 0.5} />
          ))}
        </Bar>
        <Line yAxisId="right" type="monotone" dataKey="acumulado" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3, fill: '#ef4444' }} name="% Acumulado" />
        {/* 80% reference line */}
        <Line yAxisId="right" type="monotone" dataKey={() => 80} stroke="#ef4444" strokeWidth={1} strokeDasharray="6 4" dot={false} name="" legendType="none" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function ParetoTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-title">{d?.fullLabor || d?.labor}</div>
      <div className="tooltip-row">
        <span className="tooltip-label"><span className="tooltip-dot" style={{ background: '#22c55e' }} />Costo</span>
        <span className="tooltip-value">{fmtFull(d?.total || 0)}</span>
      </div>
      <div className="tooltip-row">
        <span className="tooltip-label"><span className="tooltip-dot" style={{ background: '#ef4444' }} />Acumulado</span>
        <span className="tooltip-value">{d?.acumulado?.toFixed(1)}%</span>
      </div>
      {d?.acumulado <= 80 && <div style={{ fontSize: 10, color: '#22c55e', marginTop: 4, fontWeight: 600 }}>⚡ Driver crítico (zona 80%)</div>}
    </div>
  );
}

// ============================================================
//  WATERFALL CHART — Monthly Cost Variance
// ============================================================
export function WaterfallChart({ data }: { data: { mes: string; total: number; delta: number; pctChange: number }[] }) {
  // Build waterfall segments
  const waterfallData = data.map((d, i) => {
    const prev = i === 0 ? 0 : data[i - 1].total;
    return {
      mes: d.mes,
      total: d.total,
      delta: d.delta,
      pctChange: d.pctChange,
      base: Math.min(prev, d.total),
      increase: d.delta > 0 ? d.delta : 0,
      decrease: d.delta < 0 ? Math.abs(d.delta) : 0,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={waterfallData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="mes" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtShort} />
        <Tooltip content={<WaterfallTooltip />} />
        {/* Invisible base */}
        <Bar dataKey="base" stackId="stack" fill="transparent" />
        {/* Increase (red = cost went up) */}
        <Bar dataKey="increase" stackId="stack" radius={[4, 4, 0, 0]} name="Incremento">
          {waterfallData.map((_, i) => <Cell key={i} fill="#ef4444" opacity={0.85} />)}
        </Bar>
        {/* Decrease (green = cost went down) */}
        <Bar dataKey="decrease" stackId="stack" radius={[4, 4, 0, 0]} name="Reducción">
          {waterfallData.map((_, i) => <Cell key={i} fill="#22c55e" opacity={0.85} />)}
        </Bar>
        {/* Total line */}
        <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 2, stroke: '#1e293b' }} name="Total" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function WaterfallTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const isUp = d?.delta > 0;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-title">{d?.mes}</div>
      <div className="tooltip-row">
        <span className="tooltip-label"><span className="tooltip-dot" style={{ background: '#3b82f6' }} />Total</span>
        <span className="tooltip-value">{fmtFull(d?.total || 0)}</span>
      </div>
      {d?.delta !== 0 && (
        <div className="tooltip-row">
          <span className="tooltip-label"><span className="tooltip-dot" style={{ background: isUp ? '#ef4444' : '#22c55e' }} />{isUp ? 'Incremento' : 'Reducción'}</span>
          <span className="tooltip-value" style={{ color: isUp ? '#ef4444' : '#22c55e' }}>
            {isUp ? '+' : ''}{fmtFull(d?.delta || 0)} ({isUp ? '+' : ''}{d?.pctChange?.toFixed(1)}%)
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================
//  HEATMAP — Lote × Labor Cost/Ha Matrix
// ============================================================
export function HeatmapLoteLaborChart({ data, lotes, labores }: {
  data: { lote: string; labor: string; costoHa: number }[];
  lotes: string[];
  labores: string[];
}) {
  const maxCostoHa = Math.max(...data.map(d => d.costoHa), 1);

  const getColor = (costoHa: number) => {
    const ratio = costoHa / maxCostoHa;
    if (ratio === 0) return 'rgba(255,255,255,0.02)';
    if (ratio < 0.25) return 'rgba(34,197,94,0.35)';
    if (ratio < 0.5) return 'rgba(34,197,94,0.6)';
    if (ratio < 0.7) return 'rgba(245,158,11,0.5)';
    if (ratio < 0.85) return 'rgba(239,68,68,0.45)';
    return 'rgba(239,68,68,0.75)';
  };

  const getCellData = (lote: string, labor: string) => data.find(d => d.lote === lote && d.labor === labor);

  return (
    <div style={{ overflowX: 'auto', padding: '4px 0' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: labores.length * 80 + 120 }}>
        <thead>
          <tr>
            <th style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', padding: '4px 8px', textAlign: 'left', position: 'sticky', left: 0, background: 'var(--card-bg)', zIndex: 1 }}>LOTE</th>
            {labores.map(l => (
              <th key={l} style={{ fontSize: 8, fontWeight: 600, color: 'var(--text-muted)', padding: '4px 6px', textAlign: 'center', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {l.length > 12 ? l.substring(0, 12) + '…' : l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lotes.map(lote => (
            <tr key={lote}>
              <td style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', padding: '3px 8px', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: 'var(--card-bg)', zIndex: 1 }}>{lote}</td>
              {labores.map(labor => {
                const cell = getCellData(lote, labor);
                const val = cell?.costoHa || 0;
                return (
                  <td key={`${lote}-${labor}`} style={{
                    padding: '3px 4px', textAlign: 'center',
                    background: getColor(val),
                    borderRadius: 3, border: '1px solid rgba(255,255,255,0.03)',
                    transition: 'all 0.2s',
                  }}>
                    {val > 0 ? (
                      <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                        {val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val.toFixed(0)}
                      </span>
                    ) : (
                      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.1)' }}>—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginTop: 8, padding: '4px 0' }}>
        <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>₡/Ha:</span>
        {[
          { label: 'Bajo', color: 'rgba(34,197,94,0.35)' },
          { label: 'Medio', color: 'rgba(34,197,94,0.6)' },
          { label: 'Alto', color: 'rgba(245,158,11,0.5)' },
          { label: 'Crítico', color: 'rgba(239,68,68,0.45)' },
          { label: 'Máximo', color: 'rgba(239,68,68,0.75)' },
        ].map(l => (
          <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--text-muted)' }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: l.color, display: 'inline-block' }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================
//  STACKED 100% AREA — Cost Composition by Week
// ============================================================
export function StackedCompositionChart({ data, labores }: { data: any[]; labores: string[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="semana" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} domain={[0, 100]} />
        <Tooltip content={<CompositionTooltip />} />
        {labores.map((labor, i) => (
          <Area key={labor} type="monotone" dataKey={labor} stackId="1" stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]}
            fillOpacity={0.7} strokeWidth={1} name={labor} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

function CompositionTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const sorted = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0));
  return (
    <div className="custom-tooltip" style={{ maxHeight: 250, overflowY: 'auto' }}>
      <div className="tooltip-title">Semana {label}</div>
      {sorted.filter((p: any) => p.value > 0).map((p: any, i: number) => (
        <div key={i} className="tooltip-row">
          <span className="tooltip-label"><span className="tooltip-dot" style={{ background: p.fill || p.color }} />{p.name}</span>
          <span className="tooltip-value">{p.value?.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
//  GAUGE — Labor Efficiency Index (LEI)
// ============================================================
export function GaugeLEI({ value, label }: { value: number; label: string }) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const angle = (clampedValue / 100) * 180;
  const color = clampedValue < 40 ? '#ef4444' : clampedValue < 70 ? '#f59e0b' : '#22c55e';
  const zone = clampedValue < 40 ? 'CRÍTICO' : clampedValue < 70 ? 'ACEPTABLE' : 'ÓPTIMO';

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const cx = 120, cy = 110, r = 85;

  // Arc path
  const startX = cx - r;
  const startY = cy;
  const endAngle = 180 - angle;
  const endX = cx + r * Math.cos(toRad(endAngle));
  const endY = cy - r * Math.sin(toRad(endAngle));
  const largeArc = angle > 90 ? 1 : 0;

  // Needle
  const needleAngle = 180 - angle;
  const needleX = cx + (r - 10) * Math.cos(toRad(needleAngle));
  const needleY = cy - (r - 10) * Math.sin(toRad(needleAngle));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0' }}>
      <svg width={240} height={140} viewBox="0 0 240 140">
        {/* Background arc */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={18} strokeLinecap="round" />
        {/* Red zone (0-40) */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(toRad(180 - 72))} ${cy - r * Math.sin(toRad(180 - 72))}`}
          fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth={18} strokeLinecap="round" />
        {/* Yellow zone (40-70) */}
        <path d={`M ${cx + r * Math.cos(toRad(180 - 72))} ${cy - r * Math.sin(toRad(180 - 72))} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(toRad(180 - 126))} ${cy - r * Math.sin(toRad(180 - 126))}`}
          fill="none" stroke="rgba(245,158,11,0.15)" strokeWidth={18} strokeLinecap="round" />
        {/* Green zone (70-100) */}
        <path d={`M ${cx + r * Math.cos(toRad(180 - 126))} ${cy - r * Math.sin(toRad(180 - 126))} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="rgba(34,197,94,0.15)" strokeWidth={18} strokeLinecap="round" />
        {/* Value arc */}
        {clampedValue > 0 && (
          <path d={`M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`}
            fill="none" stroke={color} strokeWidth={18} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color}60)` }} />
        )}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={5} fill={color} />
        {/* Labels */}
        <text x={cx - r - 4} y={cy + 16} textAnchor="middle" fontSize={9} fill="#64748b">0</text>
        <text x={cx + r + 4} y={cy + 16} textAnchor="middle" fontSize={9} fill="#64748b">100</text>
        <text x={cx} y={cy - 20} textAnchor="middle" fontSize={28} fontWeight={900} fill={color} fontFamily="monospace">{clampedValue.toFixed(0)}</text>
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize={10} fontWeight={700} fill={color} letterSpacing="1">{zone}</text>
      </svg>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -8 }}>{label}</span>
    </div>
  );
}
