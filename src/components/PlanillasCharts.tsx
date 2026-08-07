'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Treemap
} from 'recharts';

// ─── Interfaces ───────────────────────────────────────────
export interface Empleado {
  codigo: number;
  nombre: string;
  ocupacion: string;
  fechaIngreso: string;
}

export interface Nomina {
  codigo: number;
  nombre: string;
  fecha1: string;
  fecha2: string;
  semana: number;
  salTotal: number;
  descuento: number;
  seguro: number;
  salNeto: number;
}

export interface DetalleLaboral {
  codigo: number;
  nombre: string;
  fecha: string;
  lote: string;
  codLabor: string;
  labor: string;
  hOrd: number;
  hExt: number;
  hDob: number;
  total: number;
}

export interface PlanillasData {
  empleados: Empleado[];
  nomina: Nomina[];
  detalle: DetalleLaboral[];
}

// ─── Colors ───────────────────────────────────────────────
const COLORS = [
  '#818cf8', '#34d399', '#f472b6', '#fbbf24', '#60a5fa',
  '#a78bfa', '#fb923c', '#4ade80', '#f87171', '#22d3ee',
  '#c084fc', '#facc15', '#38bdf8', '#e879f9', '#2dd4bf',
  '#fb7185', '#a3e635', '#fdba74'
];

const fmt = (n: number) => { if (n == null || isNaN(n)) return '₡0'; return n >= 1_000_000 ? `₡${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `₡${(n/1_000).toFixed(0)}K` : `₡${n.toFixed(0)}`; };
const fmtFull = (n: number) => { if (n == null || isNaN(n)) return '₡0'; return `₡${n.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; };
const fmtNum = (n: number) => { if (n == null || isNaN(n)) return '0'; return n.toLocaleString('es-CR'); };

// ─── Custom Tooltip ───────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(129,140,248,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      <div style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('costo') ? fmtFull(p.value) : fmtNum(p.value)}
        </div>
      ))}
    </div>
  );
};

// ─── KPI Card ─────────────────────────────────────────────
export function PlanillaKPI({ icon, title, value, subtitle, color }: {
  icon: string; title: string; value: string; subtitle: string; color: string;
}) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))',
      border: `1px solid ${color}33`,
      borderRadius: 16,
      padding: '20px 18px',
      position: 'relative',
      overflow: 'hidden',
      minWidth: 200,
    }}>
      <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 64, opacity: 0.07 }}>{icon}</div>
      <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, marginBottom: 4, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b' }}>{subtitle}</div>
    </div>
  );
}

// ─── Dashboard 2: Top Labores Chart ──────────────────────
export function LaborCostChart({ detalle }: { detalle: DetalleLaboral[] }) {
  const data = useMemo(() => {
    const map = new Map<string, { costo: number; horas: number }>();
    detalle.forEach(d => {
      const e = map.get(d.labor) || { costo: 0, horas: 0 };
      e.costo += d.total;
      e.horas += d.hOrd + d.hExt + d.hDob;
      map.set(d.labor, e);
    });
    return [...map.entries()]
      .map(([labor, v]) => ({
        labor: labor.length > 30 ? labor.substring(0, 28) + '…' : labor,
        laborFull: labor,
        costo: Math.round(v.costo),
        horas: v.horas,
        costoHora: v.horas > 0 ? Math.round(v.costo / v.horas) : 0
      }))
      .sort((a, b) => b.costo - a.costo)
      .slice(0, 15);
  }, [detalle]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} layout="vertical" margin={{ left: 180, right: 30, top: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
        <XAxis type="number" tickFormatter={fmt} stroke="#64748b" fontSize={11} />
        <YAxis type="category" dataKey="labor" stroke="#94a3b8" fontSize={11} width={175} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="costo" name="Costo Total" fill="#818cf8" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Dashboard 2b: Labor Pie Chart ───────────────────────
export function LaborPieChart({ detalle }: { detalle: DetalleLaboral[] }) {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    detalle.forEach(d => map.set(d.labor, (map.get(d.labor) || 0) + d.total));
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
    const top8 = sorted.slice(0, 8).map(([name, value]) => ({
      name: name.length > 25 ? name.substring(0, 23) + '…' : name,
      value: Math.round(value)
    }));
    const rest = sorted.slice(8).reduce((s, [, v]) => s + v, 0);
    if (rest > 0) top8.push({ name: 'Otras labores', value: Math.round(rest) });
    return top8;
  }, [detalle]);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={70} outerRadius={130} dataKey="value"
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={{ stroke: '#64748b' }}
          fontSize={10}
        >
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v) => fmtFull(Number(v ?? 0))} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Dashboard 3: Costo por Lote ─────────────────────────
export function LoteCostChart({ detalle }: { detalle: DetalleLaboral[] }) {
  const data = useMemo(() => {
    const map = new Map<string, { costo: number; horas: number; registros: number }>();
    detalle.forEach(d => {
      const e = map.get(d.lote) || { costo: 0, horas: 0, registros: 0 };
      e.costo += d.total;
      e.horas += d.hOrd + d.hExt + d.hDob;
      e.registros++;
      map.set(d.lote, e);
    });
    return [...map.entries()]
      .map(([lote, v]) => ({ lote, ...v, costo: Math.round(v.costo) }))
      .sort((a, b) => b.costo - a.costo);
  }, [detalle]);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
        <XAxis dataKey="lote" stroke="#94a3b8" fontSize={11} />
        <YAxis tickFormatter={fmt} stroke="#64748b" fontSize={11} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="costo" name="Costo Total" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Dashboard 4: Tendencia Semanal ──────────────────────
export function TendenciaSemanalPlanillaChart({ nomina }: { nomina: Nomina[] }) {
  const data = useMemo(() => {
    const map = new Map<number, { bruto: number; ccss: number; neto: number; empleados: Set<number> }>();
    nomina.forEach(n => {
      const e = map.get(n.semana) || { bruto: 0, ccss: 0, neto: 0, empleados: new Set<number>() };
      e.bruto += n.salTotal;
      e.ccss += n.seguro;
      e.neto += n.salNeto;
      e.empleados.add(n.codigo);
      map.set(n.semana, e);
    });
    return [...map.entries()]
      .filter(([sem]) => sem >= 1 && sem <= 52)
      .sort((a, b) => a[0] - b[0])
      .map(([semana, v]) => ({
        semana: `S${semana}`,
        semNum: semana,
        bruto: Math.round(v.bruto),
        ccss: Math.round(v.ccss),
        neto: Math.round(v.neto),
        empleados: v.empleados.size
      }));
  }, [nomina]);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
        <defs>
          <linearGradient id="gradBruto" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradCCSS" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f472b6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
        <XAxis dataKey="semana" stroke="#94a3b8" fontSize={10} />
        <YAxis tickFormatter={fmt} stroke="#64748b" fontSize={11} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Area type="monotone" dataKey="bruto" name="Costo Bruto" stroke="#818cf8" fill="url(#gradBruto)" strokeWidth={2} />
        <Area type="monotone" dataKey="ccss" name="CCSS" stroke="#f472b6" fill="url(#gradCCSS)" strokeWidth={2} />
        <Line type="monotone" dataKey="neto" name="Costo Neto" stroke="#34d399" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Dashboard 5: Horas Extras por Empleado ──────────────
export function HorasExtrasChart({ detalle }: { detalle: DetalleLaboral[] }) {
  const data = useMemo(() => {
    const map = new Map<string, { hOrd: number; hExt: number; hDob: number }>();
    detalle.forEach(d => {
      const e = map.get(d.nombre) || { hOrd: 0, hExt: 0, hDob: 0 };
      e.hOrd += d.hOrd;
      e.hExt += d.hExt;
      e.hDob += d.hDob;
      map.set(d.nombre, e);
    });
    return [...map.entries()]
      .map(([nombre, v]) => ({
        nombre: nombre.split(' ').slice(0, 2).join(' '),
        nombreFull: nombre,
        ...v,
        total: v.hOrd + v.hExt + v.hDob,
        pctExtras: v.hOrd + v.hExt + v.hDob > 0 ? ((v.hExt + v.hDob) / (v.hOrd + v.hExt + v.hDob) * 100) : 0
      }))
      .filter(d => d.hExt > 0 || d.hDob > 0)
      .sort((a, b) => (b.hExt + b.hDob) - (a.hExt + a.hDob));
  }, [detalle]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} layout="vertical" margin={{ left: 130, right: 30, top: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
        <XAxis type="number" stroke="#64748b" fontSize={11} />
        <YAxis type="category" dataKey="nombre" stroke="#94a3b8" fontSize={11} width={125} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="hOrd" name="Horas Ordinarias" stackId="h" fill="#818cf8" />
        <Bar dataKey="hExt" name="Horas Extra" stackId="h" fill="#fbbf24" />
        <Bar dataKey="hDob" name="Horas Dobles" stackId="h" fill="#f472b6" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Dashboard 6: Radar por Ocupación ────────────────────
export function OcupacionRadarChart({ empleados, detalle }: { empleados: Empleado[]; detalle: DetalleLaboral[] }) {
  const data = useMemo(() => {
    const empOcupacion = new Map<number, string>();
    empleados.forEach(e => empOcupacion.set(e.codigo, e.ocupacion));

    const byOcup = new Map<string, { costo: number; hOrd: number; hExt: number; registros: number }>();
    detalle.forEach(d => {
      const ocup = empOcupacion.get(d.codigo) || 'Sin Clasificar';
      const e = byOcup.get(ocup) || { costo: 0, hOrd: 0, hExt: 0, registros: 0 };
      e.costo += d.total;
      e.hOrd += d.hOrd;
      e.hExt += d.hExt;
      e.registros++;
      byOcup.set(ocup, e);
    });

    const maxCosto = Math.max(...[...byOcup.values()].map(v => v.costo), 1);
    const maxHOrd = Math.max(...[...byOcup.values()].map(v => v.hOrd), 1);
    const maxHExt = Math.max(...[...byOcup.values()].map(v => v.hExt), 1);
    const maxReg = Math.max(...[...byOcup.values()].map(v => v.registros), 1);

    return ['Costo', 'Horas Ord.', 'Horas Ext.', 'Registros'].map(subject => {
      const row: any = { subject };
      byOcup.forEach((v, ocup) => {
        const shortOcup = ocup === 'OPERADOR DE MAQUINARIA' ? 'Op. Maquinaria' : ocup === 'PEON AGRICOLA' ? 'Peón Agrícola' : ocup;
        if (subject === 'Costo') row[shortOcup] = Math.round(v.costo / maxCosto * 100);
        else if (subject === 'Horas Ord.') row[shortOcup] = Math.round(v.hOrd / maxHOrd * 100);
        else if (subject === 'Horas Ext.') row[shortOcup] = Math.round(v.hExt / maxHExt * 100);
        else row[shortOcup] = Math.round(v.registros / maxReg * 100);
      });
      return row;
    });
  }, [empleados, detalle]);

  const ocupaciones = useMemo(() => {
    const names = new Set<string>();
    empleados.forEach(e => {
      const short = e.ocupacion === 'OPERADOR DE MAQUINARIA' ? 'Op. Maquinaria' : e.ocupacion === 'PEON AGRICOLA' ? 'Peón Agrícola' : e.ocupacion;
      names.add(short);
    });
    return [...names];
  }, [empleados]);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="rgba(148,163,184,0.2)" />
        <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
        <PolarRadiusAxis stroke="#475569" fontSize={10} />
        {ocupaciones.map((ocup, i) => (
          <Radar key={ocup} name={ocup} dataKey={ocup} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
        ))}
        <Legend />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── Dashboard 3b: Lote-Labor Heatmap ────────────────────
export function LoteLaborHeatmap({ detalle }: { detalle: DetalleLaboral[] }) {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    detalle.forEach(d => {
      const key = `${d.lote}|||${d.labor}`;
      map.set(key, (map.get(key) || 0) + d.total);
    });
    return [...map.entries()]
      .map(([key, value]) => {
        const [lote, labor] = key.split('|||');
        return {
          name: `${lote}: ${labor.length > 20 ? labor.substring(0, 18) + '…' : labor}`,
          size: Math.round(value),
          lote,
          labor
        };
      })
      .sort((a, b) => b.size - a.size)
      .slice(0, 25);
  }, [detalle]);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <Treemap
        data={data}
        dataKey="size"
        aspectRatio={4/3}
        stroke="rgba(15,23,42,0.8)"
        content={({ x, y, width, height, name, size, index }: any) => {
          if (!width || !height || width < 30 || height < 20) return <g />;
          const safeSize = size ?? 0;
          const safeIndex = index ?? 0;
          return (
            <g>
              <rect x={x} y={y} width={width} height={height} fill={COLORS[safeIndex % COLORS.length]} fillOpacity={0.7} rx={4} />
              {width > 60 && height > 30 && (
                <>
                  <text x={x + 6} y={y + 16} fill="#fff" fontSize={10} fontWeight={600}>{name?.substring(0, Math.floor(width / 6))}</text>
                  <text x={x + 6} y={y + 30} fill="rgba(255,255,255,0.7)" fontSize={9}>{fmt(safeSize)}</text>
                </>
              )}
            </g>
          );
        }}
      />
    </ResponsiveContainer>
  );
}
