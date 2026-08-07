'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  DollarSign, Calendar, MapPin, ClipboardList, TrendingUp,
  BarChart3, Filter, X, ChevronDown, Activity, Package, Clock,
  FileText, Hash, Layers, Sun, Moon, MousePointerClick, RefreshCw,
  Printer, LayoutDashboard, PieChart as PieIcon, Zap, Table2, CheckCircle,
  Upload, Shield, Lock, AlertTriangle, Users, Wallet
} from 'lucide-react';
import {
  PlanillasData, PlanillaKPI, LaborCostChart, LaborPieChart,
  LoteCostChart, TendenciaSemanalPlanillaChart, HorasExtrasChart,
  OcupacionRadarChart, LoteLaborHeatmap
} from '@/components/PlanillasCharts';
import {
  TendenciaSemanalChart, TendenciaMensualChart, TopLaboresChart, CostoPorHaChart,
  UnidadPieChart, RegistrosMesChart, CostoMensualChart,
  AnimatedCounter, MiniSparkline,
  TreemapLaboresChart, ScatterLoteChart, StackedGrupoMesChart, RadarLoteChart,
  ParetoChart, WaterfallChart,
  HeatmapLoteLaborChart, StackedCompositionChart, GaugeLEI,
  COLORS, fmtFull
} from '@/components/Charts';
import { DrillBreadcrumb, DataTable } from '@/components/DataTable';
import DetailDrawer from '@/components/DetailDrawer';

interface LaborRecord {
  empresa: string; fecha: string; semana: number; lote: string;
  grupo: string | null; labor: string; personas: number | null;
  horas: number | null; pase: number | null; unidad: string;
  cantidad: number | null; area: number | null; precioUnit: number | null;
  total: number | null; iva: number | null; totalConIva: number | null;
  factura: number | null;
}

type Tab = 'resumen' | 'analisis' | 'eficiencia' | 'registros' | 'siembra' | 'planillas' | 'admin';

const fmt = (n: number) => n >= 1_000_000 ? `₡${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `₡${(n/1_000).toFixed(0)}K` : `₡${n.toFixed(0)}`;

export default function DashboardGerencial() {
  const [allData, setAllData] = useState<LaborRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('resumen');
  const [trendView, setTrendView] = useState<'mes' | 'semana'>('mes');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Admin
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminPinError, setAdminPinError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Planillas
  const [planillasData, setPlanillasData] = useState<PlanillasData | null>(null);
  const [planillasLoading, setPlanillasLoading] = useState(false);
  const [planillasSemana, setPlanillasSemana] = useState<string>('all');

  // Filters
  const [selLotes, setSelLotes] = useState<string[]>([]);
  const [selLabores, setSelLabores] = useState<string[]>([]);
  const [selGrupos, setSelGrupos] = useState<string[]>([]);
  const [selSemanas, setSelSemanas] = useState<string[]>([]);
  const [selUnidades, setSelUnidades] = useState<string[]>([]);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerData, setDrawerData] = useState<LaborRecord[]>([]);

  useEffect(() => {
    if (isDark) document.body.classList.remove('light');
    else document.body.classList.add('light');
  }, [isDark]);

  const loadData = useCallback(() => {
    fetch('/data.json')
      .then(r => r.json())
      .then(d => { setAllData(d); setLoading(false); setLastUpdated(new Date()); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      refreshTimer.current = setInterval(() => {
        loadData();
        setRefreshTick(t => t + 1);
      }, 30000);
    } else {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    }
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [autoRefresh, loadData]);

  // PDF export
  const exportPDF = () => window.print();

  // Unique filter values
  const options = useMemo(() => ({
    lotes: [...new Set(allData.map(d => d.lote).filter(Boolean))].sort(),
    labores: [...new Map(allData.filter(d => d.labor).map(d => [d.labor.trim().toLowerCase(), d.labor.trim()])).values()].sort(),
    grupos: [...new Set(allData.map(d => d.grupo).filter((v): v is string => v !== null && v !== undefined))].sort(),
    semanas: [...new Set(allData.map(d => String(d.semana)).filter(Boolean))].sort(),
    unidades: [...new Set(allData.map(d => d.unidad).filter(Boolean))].sort(),
  }), [allData]);

  // Filtered data
  const data = useMemo(() => {
    return allData.filter(d => {
      if (selLotes.length && !selLotes.includes(d.lote)) return false;
      if (selLabores.length && !selLabores.some(s => s.toLowerCase() === d.labor?.trim().toLowerCase())) return false;
      if (selGrupos.length && !(d.grupo && selGrupos.includes(d.grupo))) return false;
      if (selSemanas.length && !selSemanas.includes(String(d.semana))) return false;
      if (selUnidades.length && !selUnidades.includes(d.unidad)) return false;
      if (fechaDesde && d.fecha < fechaDesde) return false;
      if (fechaHasta && d.fecha > fechaHasta) return false;
      return true;
    });
  }, [allData, selLotes, selLabores, selGrupos, selSemanas, selUnidades, fechaDesde, fechaHasta]);

  const hasFilters = selLotes.length || selLabores.length || selGrupos.length || selSemanas.length || selUnidades.length || fechaDesde || fechaHasta;

  const clearFilters = useCallback(() => {
    setSelLotes([]); setSelLabores([]); setSelGrupos([]);
    setSelSemanas([]); setSelUnidades([]);
    setFechaDesde(''); setFechaHasta('');
  }, []);

  const breadcrumbFilters = useMemo(() => {
    const filters: { type: string; label: string; value: string; icon: string }[] = [];
    selLotes.forEach(v => filters.push({ type: 'lote', label: 'Lote', value: v, icon: '📍' }));
    selLabores.forEach(v => filters.push({ type: 'labor', label: 'Labor', value: v.length > 20 ? v.substring(0, 20) + '…' : v, icon: '🔧' }));
    selGrupos.forEach(v => filters.push({ type: 'grupo', label: 'Grupo', value: v, icon: '👥' }));
    selSemanas.forEach(v => filters.push({ type: 'semana', label: 'Sem', value: v, icon: '📅' }));
    selUnidades.forEach(v => filters.push({ type: 'unidad', label: 'Unidad', value: v, icon: '📦' }));
    if (fechaDesde) filters.push({ type: 'fechaDesde', label: 'Desde', value: fechaDesde, icon: '📅' });
    if (fechaHasta) filters.push({ type: 'fechaHasta', label: 'Hasta', value: fechaHasta, icon: '📅' });
    return filters;
  }, [selLotes, selLabores, selGrupos, selSemanas, selUnidades, fechaDesde, fechaHasta]);

  const removeBreadcrumb = useCallback((type: string, value: string) => {
    if (type === 'lote') setSelLotes(p => p.filter(v => v !== value));
    else if (type === 'labor') setSelLabores(p => p.filter(v => !v.startsWith(value.replace('…', ''))));
    else if (type === 'grupo') setSelGrupos(p => p.filter(v => v !== value));
    else if (type === 'semana') setSelSemanas(p => p.filter(v => v !== value));
    else if (type === 'unidad') setSelUnidades(p => p.filter(v => v !== value));
    else if (type === 'fechaDesde') setFechaDesde('');
    else if (type === 'fechaHasta') setFechaHasta('');
  }, []);

  const toggleFilter = useCallback((type: string, value: string) => {
    if (!value) return;
    if (type === 'lote') setSelLotes(p => p.includes(value) ? p.filter(v => v !== value) : [...p, value]);
    if (type === 'labor') setSelLabores(p => p.includes(value) ? p.filter(v => v !== value) : [...p, value]);
    if (type === 'unidad') setSelUnidades(p => p.includes(value) ? p.filter(v => v !== value) : [...p, value]);
    if (type === 'semana') setSelSemanas(p => p.includes(value) ? p.filter(v => v !== value) : [...p, value]);
    if (type === 'mes') {
      if (fechaDesde === `${value}-01`) {
        setFechaDesde(''); setFechaHasta('');
      } else {
        setFechaDesde(`${value}-01`); setFechaHasta(`${value}-31`);
      }
    }
  }, [fechaDesde]);

  const openDrillDown = useCallback((title: string, filteredRecords: LaborRecord[]) => {
    setDrawerTitle(title); setDrawerData(filteredRecords); setDrawerOpen(true);
  }, []);

  // Click handlers
  const handleLaborClick = useCallback((labor: string) => {
    if (!labor) return;
    const records = data.filter(d => d.labor === labor);
    openDrillDown(`Labor: ${labor}`, records);
  }, [data, openDrillDown]);

  const handleLoteClick = useCallback((lote: string) => {
    if (!lote) return;
    toggleFilter('lote', lote);
    const records = data.filter(d => d.lote === lote);
    openDrillDown(`Lote: ${lote}`, records);
  }, [data, toggleFilter, openDrillDown]);

  const handleUnidadClick = useCallback((name: string) => {
    if (!name) return;
    toggleFilter('unidad', name);
    const records = data.filter(d => d.unidad === name);
    openDrillDown(`Unidad: ${name}`, records);
  }, [data, toggleFilter, openDrillDown]);

  const handleMesClick = useCallback((mesFull: string) => {
    if (!mesFull) return;
    toggleFilter('mes', mesFull);
    const records = data.filter(d => d.fecha?.startsWith(mesFull));
    openDrillDown(`Mes: ${mesFull}`, records);
  }, [data, toggleFilter, openDrillDown]);

  const handleSemanaClick = useCallback((sem: string) => {
    if (!sem) return;
    toggleFilter('semana', sem);
    const records = data.filter(d => String(d.semana) === sem);
    openDrillDown(`Semana: ${sem}`, records);
  }, [data, toggleFilter, openDrillDown]);

  const handleGrupoMesClick = useCallback((mes: string, grupo: string) => {
    if (!mes || !grupo) return;
    const monthNames: Record<string, string> = { '01':'Enero','02':'Febrero','03':'Marzo','04':'Abril','05':'Mayo','06':'Junio','07':'Julio','08':'Agosto','09':'Septiembre','10':'Octubre','11':'Noviembre','12':'Diciembre' };
    const records = data.filter(d => d.fecha?.substring(5, 7) === mes && d.grupo === grupo);
    const mesName = monthNames[mes] || mes;
    openDrillDown(`Grupo ${grupo} — ${mesName}`, records);
  }, [data, openDrillDown]);

  // File upload handler for admin
  const handleFileUpload = useCallback(async (file: File) => {
    setUploading(true); setUploadError(''); setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pin', '130680');
      const res = await fetch('/api/upload-data', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) { setUploadError(json.error || 'Error desconocido'); }
      else { setUploadResult(json); loadData(); }
    } catch (err: any) { setUploadError(err.message || 'Error de conexión'); }
    finally { setUploading(false); }
  }, [loadData]);

  // ========== KPIs ==========
  const kpis = useMemo(() => {
    const totalFacturado = data.reduce((s, d) => s + (d.totalConIva || 0), 0);
    const totalBase = data.reduce((s, d) => s + (d.total || 0), 0);
    const totalIva = data.reduce((s, d) => s + (d.iva || 0), 0);
    const registros = data.length;
    const laboresUnicas = new Set(data.map(d => d.labor?.trim().toLowerCase())).size;
    const lotesUnicos = new Set(data.map(d => d.lote)).size;
    const totalHoras = data.reduce((s, d) => s + (d.horas || 0), 0);
    const facturasUnicas = new Set(data.map(d => d.factura).filter(Boolean)).size;
    const areaTotal = data.reduce((s, d) => s + (d.area || 0), 0);
    const gruposUnicos = new Set(data.map(d => d.grupo).filter(Boolean)).size;
    const totalPersonas = data.reduce((s, d) => s + (d.personas || 0), 0);
    const costoPorHa = areaTotal > 0 ? totalFacturado / areaTotal : 0;
    const costoPorHora = totalHoras > 0 ? totalFacturado / totalHoras : 0;
    const eficienciaLaboral = totalHoras > 0 ? areaTotal / totalHoras : 0;
    return { totalFacturado, totalBase, totalIva, registros, laboresUnicas, lotesUnicos, totalHoras, facturasUnicas, areaTotal, costoPorHa, costoPorHora, eficienciaLaboral, gruposUnicos, totalPersonas };
  }, [data]);

  const allDataTotal = useMemo(() => allData.reduce((s, d) => s + (d.totalConIva || 0), 0), [allData]);

  const monthlySparkData = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(d => {
      if (d.fecha) { const m = d.fecha.substring(0, 7); map.set(m, (map.get(m) || 0) + (d.totalConIva || 0)); }
    });
    return [...map.entries()].sort().map(([_, v]) => v);
  }, [data]);

  // ========== Charts Data ==========
  const costosPorLabor = useMemo(() => {
    const map = new Map<string, { total: number; displayName: string }>();
    data.forEach(d => {
      if (d.labor && d.totalConIva) {
        const key = d.labor.trim().toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.total += d.totalConIva;
        } else {
          map.set(key, { total: d.totalConIva, displayName: d.labor.trim() });
        }
      }
    });
    return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 10)
      .map(({ displayName, total }) => ({ labor: displayName, displayLabor: displayName.length > 22 ? displayName.substring(0, 22) + '…' : displayName, total: Math.round(total) }));
  }, [data]);

  const costosPorHaLote = useMemo(() => {
    const map = new Map<string, { total: number; area: number }>();
    data.forEach(d => {
      if (d.lote && d.totalConIva && d.area) {
        const e = map.get(d.lote) || { total: 0, area: 0 };
        e.total += d.totalConIva; e.area += d.area; map.set(d.lote, e);
      }
    });
    return [...map.entries()].filter(([_, v]) => v.area > 0)
      .map(([lote, v]) => ({ lote, costoHa: Math.round(v.total / v.area) }))
      .sort((a, b) => b.costoHa - a.costoHa).slice(0, 10);
  }, [data]);

  const tendenciaSemanal = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(d => { if (d.semana && d.totalConIva) map.set(String(d.semana), (map.get(String(d.semana)) || 0) + d.totalConIva); });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
      .map(([sem, total]) => ({ semana: sem.slice(-2), total: Math.round(total), fullSem: sem }));
  }, [data]);

  const distribucionUnidad = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(d => { if (d.unidad) map.set(d.unidad, (map.get(d.unidad) || 0) + 1); });
    return [...map.entries()].map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
  }, [data]);

  const registrosPorMes = useMemo(() => {
    const map = new Map<string, { registros: number; total: number }>();
    data.forEach(d => {
      if (d.fecha) {
        const mes = d.fecha.substring(0, 7);
        const e = map.get(mes) || { registros: 0, total: 0 };
        e.registros++; e.total += d.totalConIva || 0; map.set(mes, e);
      }
    });
    return [...map.entries()].sort().map(([mes, v]) => ({ mesFull: mes, mes: mes.slice(5), registros: v.registros, total: Math.round(v.total) }));
  }, [data]);

  const topFacturas = useMemo(() => {
    const map = new Map<number, { total: number; registros: number; fecha: string; semana: string; lote: string; labor: string; unidad: string; cantidad: number; horas: number; area: number }>();
    data.forEach(d => {
      if (d.factura && d.totalConIva) {
        const e = map.get(d.factura) || { total: 0, registros: 0, fecha: d.fecha || '', semana: '', lote: '', labor: '', unidad: '', cantidad: 0, horas: 0, area: 0 };
        e.total += d.totalConIva; e.registros++;
        if (d.fecha && (!e.fecha || d.fecha > e.fecha)) e.fecha = d.fecha;
        if (d.semana) e.semana = String(d.semana);
        if (d.lote) e.lote = d.lote;
        if (d.labor) e.labor = d.labor;
        if (d.unidad) e.unidad = d.unidad;
        e.cantidad += d.cantidad || 0;
        e.horas += d.horas || 0;
        e.area += d.area || 0;
        map.set(d.factura, e);
      }
    });
    return [...map.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 20)
      .map(([factura, v]) => ({ factura, total: Math.round(v.total), registros: v.registros, fecha: v.fecha, semana: v.semana, lote: v.lote, labor: v.labor, unidad: v.unidad, cantidad: Math.round(v.cantidad), horas: Math.round(v.horas * 10) / 10, area: Math.round(v.area * 100) / 100 }));
  }, [data]);

  // ========== NEW: Treemap data ==========
  const treemapData = useMemo(() => {
    const map = new Map<string, { total: number; displayName: string }>();
    data.forEach(d => {
      if (d.labor && d.totalConIva) {
        const key = d.labor.trim().toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.total += d.totalConIva;
        } else {
          map.set(key, { total: d.totalConIva, displayName: d.labor.trim() });
        }
      }
    });
    return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 20)
      .map(({ displayName, total }, i) => ({ name: displayName.length > 22 ? displayName.substring(0, 22) + '…' : displayName, labor: displayName, total: Math.round(total), index: i }));
  }, [data]);

  // ========== NEW: Scatter data (lote: área vs costo) ==========
  const scatterData = useMemo(() => {
    const map = new Map<string, { costo: number; area: number; registros: number }>();
    data.forEach(d => {
      if (d.lote && d.totalConIva) {
        const e = map.get(d.lote) || { costo: 0, area: 0, registros: 0 };
        e.costo += d.totalConIva; e.area += d.area || 0; e.registros++;
        map.set(d.lote, e);
      }
    });
    return [...map.entries()].filter(([_, v]) => v.area > 0)
      .map(([lote, v]) => ({ lote, costo: Math.round(v.costo), area: parseFloat(v.area.toFixed(2)), registros: v.registros, costoHa: Math.round(v.costo / v.area) }));
  }, [data]);

  // ========== NEW: Stacked grupo/mes ==========
  const { stackedData, gruposUnicos: gruposList } = useMemo(() => {
    const grupos = [...new Set(data.map(d => d.grupo).filter((v): v is string => !!v))].sort();
    const mesMap = new Map<string, { [key: string]: number }>();
    data.forEach(d => {
      if (d.fecha && d.grupo && d.totalConIva) {
        const mes = d.fecha.substring(5, 7);
        const e = mesMap.get(mes) || {};
        e[d.grupo] = (e[d.grupo] || 0) + d.totalConIva;
        mesMap.set(mes, e);
      }
    });
    const stacked = [...mesMap.entries()].sort().map(([mes, vals]) => ({ mes, ...vals }));
    return { stackedData: stacked, gruposUnicos: grupos };
  }, [data]);

  // ========== NEW: Radar lote comparativo ==========
  const { radarData, radarLotes } = useMemo(() => {
    const loteMap = new Map<string, { costo: number; registros: number; horas: number; area: number; personas: number }>();
    data.forEach(d => {
      if (d.lote) {
        const e = loteMap.get(d.lote) || { costo: 0, registros: 0, horas: 0, area: 0, personas: 0 };
        e.costo += d.totalConIva || 0; e.registros++; e.horas += d.horas || 0;
        e.area += d.area || 0; e.personas += d.personas || 0;
        loteMap.set(d.lote, e);
      }
    });
    const lotes = [...loteMap.keys()].slice(0, 5);
    const maxCosto = Math.max(...[...loteMap.values()].map(v => v.costo), 1);
    const maxReg = Math.max(...[...loteMap.values()].map(v => v.registros), 1);
    const maxHoras = Math.max(...[...loteMap.values()].map(v => v.horas), 1);
    const maxArea = Math.max(...[...loteMap.values()].map(v => v.area), 1);
    const maxPersonas = Math.max(...[...loteMap.values()].map(v => v.personas), 1);

    const subjects = ['Costo', 'Registros', 'Horas', 'Área', 'Personas'];
    const radarRows = subjects.map(subject => {
      const row: any = { subject };
      lotes.forEach(lote => {
        const v = loteMap.get(lote)!;
        if (subject === 'Costo') row[lote] = Math.round((v.costo / maxCosto) * 100);
        else if (subject === 'Registros') row[lote] = Math.round((v.registros / maxReg) * 100);
        else if (subject === 'Horas') row[lote] = Math.round((v.horas / maxHoras) * 100);
        else if (subject === 'Área') row[lote] = Math.round((v.area / maxArea) * 100);
        else if (subject === 'Personas') row[lote] = Math.round((v.personas / maxPersonas) * 100);
      });
      return row;
    });
    return { radarData: radarRows, radarLotes: lotes };
  }, [data]);

  // ========== NEW: Personas por Labor ==========
  const personasPorLabor = useMemo(() => {
    const map = new Map<string, { personas: number; horas: number; costo: number }>();
    data.forEach(d => {
      if (d.labor) {
        const e = map.get(d.labor) || { personas: 0, horas: 0, costo: 0 };
        e.personas += d.personas || 0; e.horas += d.horas || 0; e.costo += d.totalConIva || 0;
        map.set(d.labor, e);
      }
    });
    return [...map.entries()].sort((a, b) => b[1].personas - a[1].personas).slice(0, 10)
      .map(([labor, v]) => ({ labor: labor.length > 22 ? labor.substring(0, 22) + '…' : labor, fullLabor: labor, ...v }));
  }, [data]);

  // ========== Pareto 80/20 Data ==========
  const paretoData = useMemo(() => {
    const laborMap = new Map<string, number>();
    data.forEach(d => { if (d.labor) laborMap.set(d.labor, (laborMap.get(d.labor) || 0) + (d.totalConIva || 0)); });
    const sorted = [...laborMap.entries()].sort((a, b) => b[1] - a[1]);
    const grandTotal = sorted.reduce((s, [, v]) => s + v, 0);
    let acum = 0;
    return sorted.map(([labor, total]) => {
      acum += total;
      return {
        labor: labor.length > 14 ? labor.substring(0, 14) + '…' : labor,
        fullLabor: labor,
        total,
        acumulado: grandTotal > 0 ? (acum / grandTotal) * 100 : 0,
      };
    });
  }, [data]);

  const paretoInsight = useMemo(() => {
    const critical = paretoData.filter(d => d.acumulado <= 80);
    const lastCritical = critical[critical.length - 1];
    return { count: critical.length, total: paretoData.length, pct: lastCritical?.acumulado?.toFixed(1) || '0' };
  }, [paretoData]);

  // ========== Waterfall Mensual Data ==========
  const waterfallData = useMemo(() => {
    const mesMap = new Map<string, number>();
    data.forEach(d => {
      if (d.fecha) {
        const mes = d.fecha.substring(0, 7);
        mesMap.set(mes, (mesMap.get(mes) || 0) + (d.totalConIva || 0));
      }
    });
    const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const sorted = [...mesMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return sorted.map(([mesFull, total], i) => {
      const prev = i === 0 ? total : sorted[i - 1][1];
      const delta = i === 0 ? 0 : total - prev;
      const pctChange = prev > 0 ? (delta / prev) * 100 : 0;
      const [y, m] = mesFull.split('-');
      return { mes: `${MONTH_NAMES[parseInt(m) - 1]} ${y}`, total, delta, pctChange };
    });
  }, [data]);

  // ========== Anomalías de Costo ==========
  const anomalias = useMemo(() => {
    const laborStats = new Map<string, { sum: number; sumSq: number; count: number; records: LaborRecord[] }>();
    data.forEach(d => {
      if (d.labor && d.area && d.area > 0) {
        const costoHa = (d.totalConIva || 0) / d.area;
        const e = laborStats.get(d.labor) || { sum: 0, sumSq: 0, count: 0, records: [] };
        e.sum += costoHa; e.sumSq += costoHa * costoHa; e.count++; e.records.push({ ...d, _costoHa: costoHa } as any);
        laborStats.set(d.labor, e);
      }
    });
    const results: { labor: string; factura: string; costoHa: number; promedio: number; desviacion: number; factor: number; fecha: string; lote: string; total: number }[] = [];
    laborStats.forEach((stats, labor) => {
      if (stats.count < 3) return;
      const mean = stats.sum / stats.count;
      const variance = (stats.sumSq / stats.count) - (mean * mean);
      const std = Math.sqrt(Math.max(0, variance));
      if (std === 0) return;
      stats.records.forEach((r: any) => {
        const factor = (r._costoHa - mean) / std;
        if (factor > 1.8) {
          results.push({ labor, factura: r.factura || '?', costoHa: r._costoHa, promedio: mean, desviacion: std, factor, fecha: r.fecha || '', lote: r.lote || '', total: r.totalConIva || 0 });
        }
      });
    });
    return results.sort((a, b) => b.factor - a.factor).slice(0, 5);
  }, [data]);

  // ========== Heatmap Lote × Labor ==========
  const heatmapData = useMemo(() => {
    const cellMap = new Map<string, { costo: number; area: number }>();
    const loteSet = new Set<string>();
    const laborSet = new Set<string>();
    data.forEach(d => {
      if (d.lote && d.labor && d.area && d.area > 0) {
        const key = `${d.lote}|||${d.labor}`;
        const e = cellMap.get(key) || { costo: 0, area: 0 };
        e.costo += d.totalConIva || 0; e.area += d.area;
        cellMap.set(key, e);
        loteSet.add(d.lote); laborSet.add(d.labor);
      }
    });
    const cells = [...cellMap.entries()].map(([key, v]) => {
      const [lote, labor] = key.split('|||');
      return { lote, labor, costoHa: v.area > 0 ? v.costo / v.area : 0 };
    });
    // Top lotes and labores by frequency
    const lotes = [...loteSet].slice(0, 15);
    const labores = [...laborSet].filter(l => cells.some(c => c.labor === l && c.costoHa > 0)).slice(0, 10);
    return { cells: cells.filter(c => lotes.includes(c.lote) && labores.includes(c.labor)), lotes, labores };
  }, [data]);

  // ========== Stacked 100% Composition by Week ==========
  const compositionData = useMemo(() => {
    const weekLabor = new Map<string, Map<string, number>>();
    const laborTotals = new Map<string, number>();
    data.forEach(d => {
      if (d.semana && d.labor) {
        const sem = String(d.semana);
        if (!weekLabor.has(sem)) weekLabor.set(sem, new Map());
        const wm = weekLabor.get(sem)!;
        wm.set(d.labor, (wm.get(d.labor) || 0) + (d.totalConIva || 0));
        laborTotals.set(d.labor, (laborTotals.get(d.labor) || 0) + (d.totalConIva || 0));
      }
    });
    // Top 8 labores by total cost
    const topLabores = [...laborTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([l]) => l);
    const weeks = [...weekLabor.keys()].sort();
    const rows = weeks.map(sem => {
      const wm = weekLabor.get(sem)!;
      const weekTotal = [...wm.values()].reduce((s, v) => s + v, 0);
      const row: any = { semana: sem };
      topLabores.forEach(l => {
        row[l] = weekTotal > 0 ? ((wm.get(l) || 0) / weekTotal) * 100 : 0;
      });
      return row;
    });
    return { rows, labores: topLabores };
  }, [data]);

  // ========== LEI — Labor Efficiency Index ==========
  const leiValue = useMemo(() => {
    const totalHa = data.reduce((s, d) => s + (d.area || 0), 0);
    const totalHoras = data.reduce((s, d) => s + (d.horas || 0), 0);
    const totalCosto = data.reduce((s, d) => s + (d.totalConIva || 0), 0);
    if (totalHoras === 0 || totalCosto === 0 || totalHa === 0) return 0;
    const haPerHora = totalHa / totalHoras;
    const costoPerHa = totalCosto / totalHa;
    // Normalize: higher Ha/Hora is better, lower costoPerHa is better
    // Use a combined score scaled 0-100
    const efficiencyRaw = (haPerHora / (costoPerHa / 100000)) * 100;
    return Math.min(100, Math.max(0, efficiencyRaw));
  }, [data]);

  // Time
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleString('es-CR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  // KPI Cards
  const kpiCards = useMemo(() => [
    { label: 'Total Facturado', value: kpis.totalFacturado, formatted: fmtFull(kpis.totalFacturado), color: '#22c55e', icon: <DollarSign size={18} />, onClick: () => openDrillDown('Todo — Detalle Completo', data) },
    { label: 'Base Gravable', value: kpis.totalBase, formatted: fmtFull(kpis.totalBase), color: '#3b82f6', icon: <TrendingUp size={18} />, onClick: () => openDrillDown('Base Gravable', data) },
    { label: 'IVA (1%)', value: kpis.totalIva, formatted: fmtFull(kpis.totalIva), color: '#f59e0b', icon: <FileText size={18} />, onClick: () => openDrillDown('Detalle IVA', data) },
    { label: 'Registros', value: kpis.registros, formatted: kpis.registros.toLocaleString(), color: '#8b5cf6', icon: <Hash size={18} />, onClick: () => openDrillDown('Todos los Registros', data) },
    { label: 'Total Horas', value: kpis.totalHoras, formatted: kpis.totalHoras.toLocaleString(), color: '#14b8a6', icon: <Clock size={18} />, onClick: () => openDrillDown('Detalle Horas', data.filter(d => d.horas && d.horas > 0)) },
    { label: 'Labores Distintas', value: kpis.laboresUnicas, formatted: String(kpis.laboresUnicas), color: '#06b6d4', icon: <ClipboardList size={18} />, onClick: () => openDrillDown('Labores Distintas', data) },
    { label: 'Lotes', value: kpis.lotesUnicos, formatted: String(kpis.lotesUnicos), color: '#ec4899', icon: <MapPin size={18} />, onClick: () => openDrillDown('Por Lote', data) },
    { label: 'Facturas', value: kpis.facturasUnicas, formatted: String(kpis.facturasUnicas), color: '#f97316', icon: <FileText size={18} />, onClick: () => openDrillDown('Detalle Facturas', data.filter(d => d.factura)) },
    { label: 'Área Total (Ha)', value: kpis.areaTotal, formatted: kpis.areaTotal.toFixed(1) + ' Ha', color: '#10b981', icon: <MapPin size={18} />, onClick: () => openDrillDown('Registros con Área', data.filter(d => d.area && d.area > 0)) },
    { label: 'Costo / Hectárea', value: kpis.costoPorHa, formatted: fmtFull(kpis.costoPorHa), color: '#f43f5e', icon: <Activity size={18} />, onClick: () => openDrillDown('Registros con Área', data.filter(d => d.area && d.area > 0)) },
    { label: 'Costo / Hora', value: kpis.costoPorHora, formatted: fmtFull(kpis.costoPorHora), color: '#eab308', icon: <DollarSign size={18} />, onClick: () => openDrillDown('Registros con Horas', data.filter(d => d.horas && d.horas > 0)) },
    { label: 'Rendimiento Ha/Hr', value: kpis.eficienciaLaboral, formatted: kpis.eficienciaLaboral.toFixed(2), color: '#6366f1', icon: <TrendingUp size={18} />, onClick: () => openDrillDown('Eficiencia', data.filter(d => d.horas && d.area)) },
  ], [kpis, data, openDrillDown]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="loading-spinner" />
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 16 }}>Cargando datos...</p>
      </div>
    </div>
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'resumen', label: 'Resumen', icon: <LayoutDashboard size={17} /> },
    { id: 'analisis', label: 'Análisis de Costos', icon: <BarChart3 size={17} /> },
    { id: 'eficiencia', label: 'Eficiencia', icon: <Zap size={17} /> },
    { id: 'registros', label: 'Registro Detallado', icon: <Table2 size={17} /> },
    { id: 'siembra', label: 'Siembra y Costos', icon: <Package size={17} /> },
    { id: 'planillas', label: 'Planillas', icon: <Wallet size={17} /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* SIDEBAR FILTERS - hidden for admin, siembra, and planillas tabs */}
      {activeTab !== 'admin' && activeTab !== 'siembra' && activeTab !== 'planillas' && (
      <aside className={`filter-panel ${filtersOpen ? 'open' : 'closed'}`}>
        <div className="filter-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} color="#22c55e" />
            <span style={{ fontWeight: 700, fontSize: 13 }}>Filtros</span>
          </div>
          <button className="filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)}>
            <X size={16} />
          </button>
        </div>

        {hasFilters && (
          <button className="clear-filters" onClick={clearFilters}>
            <X size={12} /> Limpiar filtros ({data.length}/{allData.length})
          </button>
        )}

        <FilterSection title="Rango de Fechas" icon={<Calendar size={14} />}>
          <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="filter-date" />
          <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="filter-date" />
        </FilterSection>

        <FilterSection title={`Lote (${options.lotes.length})`} icon={<MapPin size={14} />}>
          {options.lotes.map(v => (
            <label key={v} className="filter-check">
              <input type="checkbox" checked={selLotes.includes(v)} onChange={e => setSelLotes(e.target.checked ? [...selLotes, v] : selLotes.filter(x => x !== v))} />
              <span>{v}</span>
            </label>
          ))}
        </FilterSection>

        <FilterSection title={`Labor (${options.labores.length})`} icon={<ClipboardList size={14} />}>
          {options.labores.map(v => (
            <label key={v} className="filter-check">
              <input type="checkbox" checked={selLabores.includes(v)} onChange={e => setSelLabores(e.target.checked ? [...selLabores, v] : selLabores.filter(x => x !== v))} />
              <span>{v.length > 26 ? v.substring(0, 26) + '…' : v}</span>
            </label>
          ))}
        </FilterSection>

        <FilterSection title={`Grupo (${options.grupos.length})`} icon={<Layers size={14} />}>
          {options.grupos.map(v => (
            <label key={v} className="filter-check">
              <input type="checkbox" checked={selGrupos.includes(v)} onChange={e => setSelGrupos(e.target.checked ? [...selGrupos, v] : selGrupos.filter(x => x !== v))} />
              <span>Grupo {v}</span>
            </label>
          ))}
        </FilterSection>

        <FilterSection title={`Unidad (${options.unidades.length})`} icon={<Package size={14} />}>
          {options.unidades.map(v => (
            <label key={v} className="filter-check">
              <input type="checkbox" checked={selUnidades.includes(v)} onChange={e => setSelUnidades(e.target.checked ? [...selUnidades, v] : selUnidades.filter(x => x !== v))} />
              <span>{v}</span>
            </label>
          ))}
        </FilterSection>
      </aside>
      )}

      {/* MAIN CONTENT */}
      <main className="dashboard" style={{ flex: 1 }}>
        {!filtersOpen && (
          <button className="filter-open-btn" onClick={() => setFiltersOpen(true)}>
            <Filter size={16} /> Filtros
          </button>
        )}

        {/* ===== HEADER ===== */}
        <header className="header">
          <div className="header-left">
            <div className="header-logo">🌿</div>
            <div>
              <h1 className="header-title">Dashboard Gerencial de Labores</h1>
              <p className="header-subtitle">Corporación Piñales de Pital — Reporte 2025-2026</p>
            </div>
          </div>
          <div className="header-right">
            <div className="header-badge">
              <span className="dot" /> {data.length} registros
            </div>
            {lastUpdated && (
              <span style={{ fontSize: 11, color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums' }}>
                ↻ {lastUpdated.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <span className="header-time">{time}</span>

            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? 'Pausar auto-refresh (30s)' : 'Activar auto-refresh (30s)'}
              style={{
                background: autoRefresh ? 'rgba(34,197,94,0.12)' : 'transparent',
                border: `1px solid ${autoRefresh ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                borderRadius: '50%', width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: autoRefresh ? '#22c55e' : 'var(--text-secondary)', cursor: 'pointer', transition: '0.2s',
              }}
            >
              <RefreshCw size={15} style={{ animation: autoRefresh ? 'spin 2s linear infinite' : 'none' }} />
            </button>

            {/* PDF Export */}
            <button
              onClick={exportPDF}
              title="Exportar a PDF"
              style={{
                background: 'transparent', border: '1px solid var(--border)', borderRadius: '50%',
                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', cursor: 'pointer', transition: '0.2s'
              }}
            >
              <Printer size={15} />
            </button>

            {/* Dark/Light toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              style={{
                background: 'transparent', border: '1px solid var(--border)', borderRadius: '50%',
                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', cursor: 'pointer', transition: '0.2s'
              }}
              title={isDark ? "Modo Claro" : "Modo Oscuro"}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* ===== BREADCRUMB ===== */}
        <DrillBreadcrumb
          filters={breadcrumbFilters}
          onRemove={removeBreadcrumb}
          onClearAll={clearFilters}
          filteredCount={data.length}
          totalCount={allData.length}
        />

        {/* ===== TAB NAVIGATION ===== */}
        <div className="tab-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 0 }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.id === 'registros' && (
                  <span className="tab-badge">{data.length}</span>
                )}
              </button>
            ))}
          </div>
          <button
            className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
            style={{ marginLeft: 'auto', gap: 6, opacity: activeTab === 'admin' ? 1 : 0.6 }}
          >
            <Shield size={14} />
            <span>Admin Access</span>
          </button>
        </div>

        {/* ===== KPI GRID (visible en todas las tabs excepto admin, siembra y planillas) ===== */}
        {activeTab !== 'admin' && activeTab !== 'siembra' && activeTab !== 'planillas' && (
        <div className="kpi-grid stagger">
          {kpiCards.map((kpi) => (
            <div
              key={kpi.label}
              className="kpi-card"
              style={{ '--kpi-color': kpi.color } as React.CSSProperties}
              onClick={kpi.onClick}
              title={`Clic para ver detalle de ${kpi.label}`}
            >
              <div className="kpi-header">
                <span className="kpi-label">{kpi.label}</span>
                <div className="kpi-icon" style={{ background: `${kpi.color}15`, border: `1px solid ${kpi.color}25`, color: kpi.color }}>
                  {kpi.icon}
                </div>
              </div>
              <span className="kpi-value" style={{ color: kpi.color, fontSize: kpi.formatted.length > 12 ? 18 : 26 }}>{kpi.formatted}</span>
              <div className="kpi-footer">
                <MiniSparkline data={monthlySparkData} color={kpi.color} />
                <MousePointerClick size={12} color="var(--text-dim)" />
              </div>
            </div>
          ))}
        </div>
        )}

        {/* ===================================================
            TAB: RESUMEN
        =================================================== */}
        {activeTab === 'resumen' && (
          <div className="tab-content">
            {/* Row 1: Tendencia + Top Labores */}
            <div className="charts-grid">
              <div className="chart-card" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease 0.1s forwards' }}>
                <div className="chart-header">
                  <div>
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#22c55e', display: 'block', marginBottom: 2 }}>TENDENCIA</span>
                    <span className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Activity size={16} color="#22c55e" /> Monto {trendView === 'mes' ? 'mensual' : 'semanal'} y actividad
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', borderRadius: 8, padding: 2, border: '1px solid var(--border-light)' }}>
                    <button
                      onClick={() => setTrendView('mes')}
                      style={{
                        padding: '5px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                        border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                        background: trendView === 'mes' ? '#22c55e' : 'transparent',
                        color: trendView === 'mes' ? '#fff' : 'var(--text-muted)',
                        boxShadow: trendView === 'mes' ? '0 2px 8px rgba(34,197,94,0.3)' : 'none',
                      }}
                    >Mes</button>
                    <button
                      onClick={() => setTrendView('semana')}
                      style={{
                        padding: '5px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                        border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                        background: trendView === 'semana' ? '#22c55e' : 'transparent',
                        color: trendView === 'semana' ? '#fff' : 'var(--text-muted)',
                        boxShadow: trendView === 'semana' ? '0 2px 8px rgba(34,197,94,0.3)' : 'none',
                      }}
                    >Semana</button>
                  </div>
                </div>
                <div className="chart-body">
                  {trendView === 'semana'
                    ? <TendenciaSemanalChart data={tendenciaSemanal} onBarClick={handleSemanaClick} />
                    : <TendenciaMensualChart data={registrosPorMes} onBarClick={handleMesClick} />
                  }
                </div>
              </div>

              <div className="chart-card" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease 0.2s forwards' }}>
                <div className="chart-header">
                  <span className="chart-title"><BarChart3 size={16} color="#8b5cf6" /> Top 10 Labores por Costo</span>
                  <span className="chart-clickable-hint"><MousePointerClick size={12} /> Clic en barra</span>
                </div>
                <div className="chart-body">
                  <TopLaboresChart data={costosPorLabor} onBarClick={handleLaborClick}
                    selectedLabor={selLabores.length === 1 ? selLabores[0] : undefined} totalGlobal={kpis.totalFacturado} />
                </div>
              </div>
            </div>

            {/* Row 2: Costo/Ha + Pie + Registros/Mes */}
            <div className="charts-grid" style={{ gridTemplateColumns: '1fr 300px 1fr' }}>
              <div className="chart-card" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease 0.3s forwards' }}>
                <div className="chart-header">
                  <span className="chart-title"><MapPin size={16} color="#06b6d4" /> Costo Real / Ha (Top 10)</span>
                  <span className="chart-clickable-hint"><MousePointerClick size={12} /> Filtrar</span>
                </div>
                <div className="chart-body">
                  <CostoPorHaChart data={costosPorHaLote} onBarClick={handleLoteClick}
                    selectedLote={selLotes.length === 1 ? selLotes[0] : undefined} totalGlobal={kpis.totalFacturado} />
                </div>
              </div>

              <div className="chart-card" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease 0.4s forwards' }}>
                <div className="chart-header">
                  <span className="chart-title"><Package size={16} color="#f59e0b" /> Por Unidad</span>
                </div>
                <div className="chart-body" style={{ padding: '8px 22px' }}>
                  <UnidadPieChart data={distribucionUnidad} onSliceClick={handleUnidadClick}
                    selectedUnidad={selUnidades.length === 1 ? selUnidades[0] : undefined} />
                </div>
              </div>

              <div className="chart-card" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease 0.5s forwards' }}>
                <div className="chart-header">
                  <span className="chart-title"><Calendar size={16} color="#ec4899" /> Registros por Mes</span>
                  <span className="chart-clickable-hint"><MousePointerClick size={12} /> Filtrar</span>
                </div>
                <div className="chart-body">
                  <RegistrosMesChart data={registrosPorMes} onPointClick={handleMesClick}
                    selectedMes={fechaDesde ? fechaDesde.substring(0, 7) : undefined} />
                </div>
              </div>
            </div>

            {/* Row 3: Costo Mensual full width */}
            <div className="charts-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="chart-card" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease 0.6s forwards' }}>
                <div className="chart-header">
                  <span className="chart-title"><Activity size={16} color="#3b82f6" /> Costo por Mes</span>
                  <span className="chart-clickable-hint"><MousePointerClick size={12} /> Clic en punto para detalle</span>
                </div>
                <div className="chart-body">
                  <CostoMensualChart data={registrosPorMes} onPointClick={handleMesClick} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================
            TAB: ANÁLISIS DE COSTOS
        =================================================== */}
        {activeTab === 'analisis' && (
          <div className="tab-content">
            {/* Row 1: Treemap (60%) + Scatter (40%) */}
            <div className="charts-grid" style={{ gridTemplateColumns: '3fr 2fr' }}>
              <div className="chart-card" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease 0.1s forwards' }}>
                <div className="chart-header">
                  <span className="chart-title"><PieIcon size={16} color="#22c55e" /> Distribución de Costos por Labor</span>
                  <span className="chart-clickable-hint"><MousePointerClick size={12} /> Clic para detalle</span>
                </div>
                <div className="chart-body" style={{ padding: '8px 12px' }}>
                  <TreemapLaboresChart data={treemapData} onLaborClick={handleLaborClick} />
                </div>
              </div>

              <div className="chart-card" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease 0.2s forwards' }}>
                <div className="chart-header">
                  <span className="chart-title"><Activity size={16} color="#3b82f6" /> Área vs Costo por Lote</span>
                  <span className="chart-clickable-hint">Tamaño = Registros</span>
                </div>
                <div className="chart-body">
                  <ScatterLoteChart data={scatterData} />
                </div>
              </div>
            </div>

            {/* Row 2: Stacked Grupo/Mes full width */}
            <div className="charts-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="chart-card" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease 0.3s forwards' }}>
                <div className="chart-header">
                  <span className="chart-title"><BarChart3 size={16} color="#f59e0b" /> Costo por Grupo por Mes</span>
                  <span className="badge badge-amber">{gruposList.length} grupos</span>
                </div>
                <div className="chart-body">
                  <StackedGrupoMesChart data={stackedData} grupos={gruposList} onBarClick={handleGrupoMesClick} />
                </div>
              </div>
            </div>

            {/* Row 3: Pareto 80/20 + Waterfall */}
            <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="chart-card" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease 0.4s forwards' }}>
                <div className="chart-header">
                  <span className="chart-title"><BarChart3 size={16} color="#ef4444" /> Pareto 80/20 — Concentración de Costos</span>
                  <span className="badge badge-red" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {paretoInsight.count} de {paretoInsight.total} labores = {paretoInsight.pct}%
                  </span>
                </div>
                <div className="chart-body">
                  <ParetoChart data={paretoData} onLaborClick={handleLaborClick} />
                </div>
                <div style={{ padding: '8px 16px 12px', borderTop: '1px solid var(--border-light)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    ⚡ <strong style={{ color: '#22c55e' }}>Solo {paretoInsight.count} labores</strong> de {paretoInsight.total} concentran el <strong style={{ color: '#ef4444' }}>{paretoInsight.pct}%</strong> del gasto total. Focalize optimización aquí.
                  </p>
                </div>
              </div>

              <div className="chart-card" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease 0.5s forwards' }}>
                <div className="chart-header">
                  <span className="chart-title"><TrendingUp size={16} color="#3b82f6" /> Waterfall — Variación Mensual</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 10, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>● Incremento</span>
                    <span style={{ fontSize: 10, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>● Reducción</span>
                  </div>
                </div>
                <div className="chart-body">
                  <WaterfallChart data={waterfallData} />
                </div>
              </div>
            </div>

            {/* Row 4: Anomalías de Costo */}
            {anomalias.length > 0 && (
            <div className="charts-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="chart-card" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease 0.6s forwards' }}>
                <div className="chart-header">
                  <span className="chart-title"><AlertTriangle size={16} color="#f59e0b" /> Anomalías de Costo Detectadas</span>
                  <span className="badge badge-amber">{anomalias.length} alertas</span>
                </div>
                <div className="chart-body" style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {anomalias.map((a, i) => {
                      const severity = a.factor > 3 ? '#ef4444' : a.factor > 2.5 ? '#f59e0b' : '#eab308';
                      return (
                        <div key={i}
                          onClick={() => openDrillDown(`Factura #${a.factura}`, data.filter(d => String(d.factura) === String(a.factura)))}
                          style={{
                            display: 'grid', gridTemplateColumns: '36px 1fr auto',
                            gap: 14, padding: '12px 16px', borderRadius: 10,
                            background: `${severity}08`, border: `1px solid ${severity}20`,
                            cursor: 'pointer', transition: 'all 0.2s', alignItems: 'center',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = `${severity}15`)}
                          onMouseLeave={e => (e.currentTarget.style.background = `${severity}08`)}
                        >
                          <div style={{
                            width: 36, height: 36, borderRadius: 8,
                            background: `${severity}15`, border: `1px solid ${severity}30`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 900, color: severity, fontFamily: 'monospace',
                          }}>
                            {a.factor.toFixed(1)}σ
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
                              <span style={{ color: severity }}>#{a.factura}</span> — {a.labor}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              Lote {a.lote} · {a.fecha} · Costo/Ha: <strong style={{ color: severity }}>{fmtFull(a.costoHa)}</strong> vs promedio <strong>{fmtFull(a.promedio)}</strong>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 15, fontWeight: 900, color: severity, fontFamily: 'monospace' }}>{fmtFull(a.total)}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{((a.costoHa / a.promedio - 1) * 100).toFixed(0)}% sobre promedio</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)', fontSize: 11, color: '#f59e0b' }}>
                    💡 Registros con costo/hectárea superior a 1.8 desviaciones estándar del promedio de su labor. Haga clic para ver detalle.
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Top Facturas */}
            <div className="charts-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="chart-card" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease 0.7s forwards' }}>
                <div className="chart-header">
                  <span className="chart-title"><FileText size={16} color="#22c55e" /> Top Facturas por Monto</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Total: <strong style={{ color: '#22c55e' }}>{fmtFull(topFacturas.reduce((s, f) => s + f.total, 0))}</strong>
                    </span>
                    <span className="badge badge-green">{topFacturas.length} facturas</span>
                  </div>
                </div>
                <div className="chart-body" style={{ padding: 0, overflowX: 'auto' }}>
                  <table className="data-table" style={{ minWidth: 1100 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 44 }}>#</th>
                        <th>FACTURA</th>
                        <th>SEMANA</th>
                        <th>LOTE</th>
                        <th>LABOR</th>
                        <th>UNIDAD</th>
                        <th style={{ textAlign: 'right' }}>CANTIDAD</th>
                        <th style={{ textAlign: 'right' }}>HORAS</th>
                        <th style={{ textAlign: 'right' }}>ÁREA</th>
                        <th>FECHA</th>
                        <th style={{ textAlign: 'right' }}>TOTAL</th>
                        <th style={{ textAlign: 'right' }}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topFacturas.map((f, i) => {
                        const color = COLORS[i % COLORS.length];
                        const pctOfTotal = (f.total / (topFacturas.reduce((s, x) => s + x.total, 0) || 1) * 100);
                        const rankLabel = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1);
                        const isTop3 = i < 3;
                        return (
                          <tr key={f.factura}
                            onClick={() => openDrillDown(`Factura #${f.factura}`, data.filter(d => d.factura === f.factura))}
                            style={{ cursor: 'pointer', borderLeft: `3px solid ${color}`, background: isTop3 ? `${color}06` : 'transparent' }}
                          >
                            <td style={{ fontSize: isTop3 ? 16 : 11, textAlign: 'center' }}>{rankLabel}</td>
                            <td><span style={{ fontWeight: 800, fontFamily: 'monospace', color, fontSize: 13 }}>#{f.factura}</span></td>
                            <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: 12 }}>{f.semana || '—'}</td>
                            <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f.lote || '—'}</td>
                            <td style={{ fontSize: 11, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.labor || '—'}</td>
                            <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.unidad || '—'}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12 }}>{f.cantidad.toLocaleString()}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: '#3b82f6' }}>{f.horas}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: '#f59e0b' }}>{f.area}</td>
                            <td style={{ fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{f.fecha}</td>
                            <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#22c55e', fontSize: 13 }}>{fmtFull(f.total)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color, fontSize: 12 }}>{pctOfTotal.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: '2px solid rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.04)' }}>
                        <td></td>
                        <td style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>TOTAL {topFacturas.length}</td>
                        <td></td><td></td><td></td><td></td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{topFacturas.reduce((s, f) => s + f.cantidad, 0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#3b82f6' }}>{topFacturas.reduce((s, f) => s + f.horas, 0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#f59e0b' }}>{topFacturas.reduce((s, f) => s + f.area, 0).toFixed(1)}</td>
                        <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{topFacturas.reduce((s, f) => s + f.registros, 0)} ítems</td>
                        <td style={{ textAlign: 'right', fontWeight: 900, fontFamily: 'monospace', color: '#22c55e', fontSize: 14 }}>{fmtFull(topFacturas.reduce((s, f) => s + f.total, 0))}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#22c55e' }}>100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Row 5: Heatmap Lote × Labor + Gauge LEI */}
            <div className="charts-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
              <div className="chart-card" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease 0.8s forwards' }}>
                <div className="chart-header">
                  <span className="chart-title"><Activity size={16} color="#f59e0b" /> Heatmap — Costo/Ha por Lote × Labor</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className="badge badge-amber">{heatmapData.lotes.length} lotes</span>
                    <span className="badge badge-green">{heatmapData.labores.length} labores</span>
                  </div>
                </div>
                <div className="chart-body" style={{ padding: '8px 12px' }}>
                  <HeatmapLoteLaborChart data={heatmapData.cells} lotes={heatmapData.lotes} labores={heatmapData.labores} />
                </div>
              </div>

              <div className="chart-card" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease 0.9s forwards' }}>
                <div className="chart-header">
                  <span className="chart-title"><TrendingUp size={16} color="#8b5cf6" /> Índice de Eficiencia Laboral</span>
                  <span className="badge" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' }}>LEI</span>
                </div>
                <div className="chart-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <GaugeLEI value={leiValue} label="Ha procesadas / Hora / Costo unitario" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, width: '100%', padding: '0 12px', marginTop: 8 }}>
                    {[
                      { label: '0-40', zone: 'Crítico', color: '#ef4444' },
                      { label: '40-70', zone: 'Aceptable', color: '#f59e0b' },
                      { label: '70-100', zone: 'Óptimo', color: '#22c55e' },
                    ].map(z => (
                      <div key={z.label} style={{ textAlign: 'center', padding: '6px 4px', borderRadius: 6, background: `${z.color}08`, border: `1px solid ${z.color}15` }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: z.color }}>{z.label}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{z.zone}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 6: Stacked 100% Composition by Week */}
            <div className="charts-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="chart-card" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease 1s forwards' }}>
                <div className="chart-header">
                  <span className="chart-title"><BarChart3 size={16} color="#06b6d4" /> Composición de Costos por Semana (100%)</span>
                  <span className="badge" style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.2)' }}>{compositionData.labores.length} labores</span>
                </div>
                <div className="chart-body">
                  <StackedCompositionChart data={compositionData.rows} labores={compositionData.labores} />
                </div>
                <div style={{ padding: '6px 16px 10px', borderTop: '1px solid var(--border-light)', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {compositionData.labores.map((l, i) => (
                    <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-muted)' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length], display: 'inline-block' }} />
                      {l.length > 18 ? l.substring(0, 18) + '…' : l}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}


        {/* ===================================================
            TAB: EFICIENCIA
        =================================================== */}
        {activeTab === 'eficiencia' && (
          <div className="tab-content">
            {/* Eficiencia KPIs */}
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
              {[
                { label: 'Costo / Ha', value: fmtFull(kpis.costoPorHa), color: '#22c55e', icon: '🌿', sub: 'Promedio ponderado' },
                { label: 'Costo / Hora', value: fmtFull(kpis.costoPorHora), color: '#3b82f6', icon: '⏱️', sub: 'Rendimiento horario' },
                { label: 'Ha / Hora', value: kpis.eficienciaLaboral.toFixed(2), color: '#f59e0b', icon: '⚡', sub: 'Eficiencia operativa' },
                { label: 'Total Personas', value: kpis.totalPersonas.toLocaleString(), color: '#8b5cf6', icon: '👷', sub: 'Jornadas acumuladas' },
              ].map(k => (
                <div key={k.label} className="chart-card" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 6 }}>{k.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: k.color, letterSpacing: '-1px', lineHeight: 1 }}>{k.icon} {k.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 6 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Radar + Top Labores por Personas */}
            <div className="charts-grid">
              <div className="chart-card" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease 0.1s forwards' }}>
                <div className="chart-header">
                  <span className="chart-title"><Activity size={16} color="#22c55e" /> Comparativo de Lotes (Radar)</span>
                  <span className="badge badge-green">{radarLotes.length} lotes</span>
                </div>
                <div className="chart-body">
                  <RadarLoteChart data={radarData} lotes={radarLotes} />
                </div>
              </div>

              <div className="chart-card" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease 0.2s forwards' }}>
                <div className="chart-header">
                  <span className="chart-title"><BarChart3 size={16} color="#8b5cf6" /> Top Labores por Personas</span>
                  <span className="chart-clickable-hint"><MousePointerClick size={12} /> Ver detalle</span>
                </div>
                <div className="chart-body" style={{ padding: 0 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Labor</th>
                        <th style={{ textAlign: 'right' }}>Personas</th>
                        <th style={{ textAlign: 'right' }}>Horas</th>
                        <th style={{ textAlign: 'right' }}>Costo Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {personasPorLabor.map((l, i) => (
                        <tr key={l.fullLabor} onClick={() => openDrillDown(`Labor: ${l.fullLabor}`, data.filter(d => d.labor === l.fullLabor))} style={{ cursor: 'pointer' }}>
                          <td style={{ maxWidth: 200 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0, display: 'inline-block' }} />
                              {l.labor}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{l.personas.toLocaleString()}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#94a3b8' }}>{l.horas.toLocaleString()}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#22c55e' }}>{fmtFull(l.costo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Costo mensual */}
            <div className="charts-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="chart-card" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease 0.3s forwards' }}>
                <div className="chart-header">
                  <span className="chart-title"><Activity size={16} color="#3b82f6" /> Evolución Mensual del Costo</span>
                </div>
                <div className="chart-body">
                  <CostoMensualChart data={registrosPorMes} onPointClick={handleMesClick} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================
            TAB: REGISTROS
        =================================================== */}
        {activeTab === 'registros' && (
          <div className="tab-content">
            <DataTable data={data} />
          </div>
        )}

        {/* ===================================================
            TAB: SIEMBRA Y COSTOS LABAGRIC
        =================================================== */}
        {activeTab === 'siembra' && (
          <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 160px)', marginTop: 8 }}>
            <iframe
              src="/siembra-labagric.html"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
              title="Siembra y Costos Labagric"
            />
          </div>
        )}

        {/* ===================================================
            TAB: PLANILLAS (Nómina y Labores)
        =================================================== */}
        {activeTab === 'planillas' && (
          <PlanillasTab
            planillasData={planillasData}
            planillasLoading={planillasLoading}
            setPlanillasData={setPlanillasData}
            setPlanillasLoading={setPlanillasLoading}
            planillasSemana={planillasSemana}
            setPlanillasSemana={setPlanillasSemana}
          />
        )}

        {/* ===================================================
            TAB: ADMIN ACCESS
        =================================================== */}
        {activeTab === 'admin' && (
          <div className="tab-content">
            {!adminAuthenticated ? (
              /* ---- PIN SCREEN ---- */
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
                <div style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: 16, padding: '48px 40px', maxWidth: 380, width: '100%',
                  textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
                    background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Lock size={28} color="#22c55e" />
                  </div>
                  <h3 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Admin Access</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Ingrese el PIN de administrador para continuar</p>
                  <input
                    type="password"
                    value={adminPin}
                    onChange={e => { setAdminPin(e.target.value); setAdminPinError(''); }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        if (adminPin === '130680') { setAdminAuthenticated(true); setAdminPinError(''); }
                        else { setAdminPinError('PIN incorrecto'); setAdminPin(''); }
                      }
                    }}
                    placeholder="••••••"
                    maxLength={6}
                    style={{
                      width: '100%', padding: '14px 16px', fontSize: 24, fontFamily: 'monospace',
                      textAlign: 'center', letterSpacing: 12, background: 'var(--bg-tertiary)',
                      border: adminPinError ? '2px solid #ef4444' : '2px solid var(--border)',
                      borderRadius: 10, color: 'var(--text-primary)', outline: 'none',
                      transition: 'border-color 0.2s', boxSizing: 'border-box'
                    }}
                    autoFocus
                  />
                  {adminPinError && (
                    <p style={{ color: '#ef4444', fontSize: 12, marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <AlertTriangle size={14} /> {adminPinError}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      if (adminPin === '130680') { setAdminAuthenticated(true); setAdminPinError(''); }
                      else { setAdminPinError('PIN incorrecto'); setAdminPin(''); }
                    }}
                    style={{
                      width: '100%', padding: '12px', marginTop: 16, borderRadius: 10,
                      background: '#22c55e', color: '#fff', border: 'none', fontSize: 14,
                      fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >Acceder</button>
                </div>
              </div>
            ) : (
              /* ---- UPLOAD SCREEN ---- */
              <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div>
                    <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                      <Shield size={20} color="#22c55e" style={{ marginRight: 8, verticalAlign: 'middle' }} />
                      Actualizar Base de Datos
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Suba un nuevo archivo Excel para reemplazar todos los datos del dashboard</p>
                  </div>
                  <button
                    onClick={() => { setAdminAuthenticated(false); setAdminPin(''); setUploadResult(null); setUploadError(''); }}
                    style={{
                      padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)',
                      background: 'transparent', color: 'var(--text-muted)', fontSize: 12,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                    }}
                  ><Lock size={12} /> Cerrar sesión</button>
                </div>

                {/* Upload Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => {
                    e.preventDefault(); setDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
                      handleFileUpload(file);
                    } else { setUploadError('Solo se aceptan archivos .xlsx o .xls'); }
                  }}
                  style={{
                    border: `2px dashed ${dragOver ? '#22c55e' : uploadError ? '#ef4444' : 'var(--border)'}`,
                    borderRadius: 16, padding: '48px 24px', textAlign: 'center',
                    cursor: uploading ? 'wait' : 'pointer',
                    background: dragOver ? 'rgba(34,197,94,0.05)' : 'var(--bg-secondary)',
                    transition: 'all 0.3s', opacity: uploading ? 0.6 : 1,
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                      e.target.value = '';
                    }}
                  />
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
                    background: dragOver ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.08)',
                    border: `2px solid ${dragOver ? 'rgba(34,197,94,0.4)' : 'rgba(34,197,94,0.15)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s'
                  }}>
                    <Upload size={32} color="#22c55e" />
                  </div>
                  {uploading ? (
                    <>
                      <div className="loading-spinner" style={{ margin: '0 auto 12px', width: 28, height: 28 }} />
                      <p style={{ color: '#22c55e', fontSize: 15, fontWeight: 600 }}>Procesando archivo...</p>
                      <p style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 6 }}>Convirtiendo Excel y actualizando base de datos</p>
                    </>
                  ) : (
                    <>
                      <p style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
                        {dragOver ? 'Suelte el archivo aquí' : 'Clic aquí o arrastre un archivo Excel'}
                      </p>
                      <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>Archivos .xlsx o .xls — Formato igual al archivo original de labores</p>
                    </>
                  )}
                </div>

                {/* Upload Error */}
                {uploadError && (
                  <div style={{
                    marginTop: 16, padding: '12px 16px', borderRadius: 10,
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                    display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444', fontSize: 13
                  }}>
                    <AlertTriangle size={16} /> {uploadError}
                  </div>
                )}

                {/* Upload Success */}
                {uploadResult && (
                  <div style={{
                    marginTop: 16, padding: '20px', borderRadius: 14,
                    background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <CheckCircle size={22} color="#22c55e" />
                      <span style={{ color: '#22c55e', fontSize: 15, fontWeight: 700 }}>Base de datos actualizada exitosamente</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[
                        { label: 'Archivo', value: uploadResult.fileName },
                        { label: 'Registros', value: uploadResult.registros?.toLocaleString() },
                        { label: 'Labores', value: uploadResult.labores },
                        { label: 'Lotes', value: uploadResult.lotes },
                        { label: 'Total Facturado', value: fmtFull(uploadResult.totalFacturado || 0) },
                        { label: 'Tamaño', value: `${uploadResult.fileSizeKB} KB` },
                      ].map(item => (
                        <div key={item.label} style={{ padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                          <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>{item.label}</span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => { loadData(); setActiveTab('resumen'); setUploadResult(null); }}
                      style={{
                        width: '100%', padding: '12px', marginTop: 16, borderRadius: 10,
                        background: '#22c55e', color: '#fff', border: 'none', fontSize: 14,
                        fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >Ver Dashboard Actualizado</button>
                  </div>
                )}

                {/* Current Data Info */}
                <div style={{
                  marginTop: 24, padding: '16px 20px', borderRadius: 12,
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-light)',
                }}>
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Base de datos actual</h4>
                  <div style={{ display: 'flex', gap: 24 }}>
                    <div><span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Registros:</span> <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{allData.length}</strong></div>
                    <div><span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Labores:</span> <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{new Set(allData.map(d => d.labor).filter(Boolean)).size}</strong></div>
                    <div><span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Lotes:</span> <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{new Set(allData.map(d => d.lote).filter(Boolean)).size}</strong></div>
                    <div><span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Total:</span> <strong style={{ color: '#22c55e', fontFamily: 'monospace' }}>{fmtFull(allData.reduce((s, d) => s + (d.totalConIva || 0), 0))}</strong></div>
                  </div>
                </div>

                {/* Warning */}
                <div style={{
                  marginTop: 16, padding: '12px 16px', borderRadius: 10,
                  background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
                  display: 'flex', alignItems: 'flex-start', gap: 10, color: '#f59e0b', fontSize: 12
                }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>Al subir un nuevo archivo, <strong>se reemplazarán todos los datos actuales</strong>. Asegúrese de que el archivo Excel tenga el formato correcto (datos desde la fila 5, 17 columnas).</span>
                </div>
              </div>
            )}
          </div>
        )}

        <footer style={{ textAlign: 'center', padding: '32px 0 16px', borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 8 }}>
          <p style={{ fontSize: 11, color: '#475569', marginBottom: 8 }}>
            Dashboard Gerencial de Labores v4.0 — Corporación Piñales de Pital © {new Date().getFullYear()}
          </p>
          <p style={{
            fontSize: 13, fontWeight: 600, letterSpacing: '1.5px',
            background: 'linear-gradient(90deg, #22c55e, #3b82f6, #a855f7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            ⚡ Powered by Datacenter IA
          </p>
        </footer>
      </main>

      {/* DETAIL DRAWER */}
      <DetailDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={drawerTitle} data={drawerData} allDataTotal={allDataTotal} />
    </div>
  );
}

// ============================================================
// FilterSection sub-component
// ============================================================
function FilterSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="filter-section">
      <button className="filter-section-title" onClick={() => setOpen(!open)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8' }}>{icon} {title}</div>
        <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s', color: '#64748b' }} />
      </button>
      {open && <div className="filter-section-body">{children}</div>}
    </div>
  );
}

// ============================================================
// PlanillasTab sub-component
// ============================================================
function PlanillasTab({
  planillasData, planillasLoading, setPlanillasData, setPlanillasLoading,
  planillasSemana, setPlanillasSemana
}: {
  planillasData: PlanillasData | null;
  planillasLoading: boolean;
  setPlanillasData: (d: PlanillasData) => void;
  setPlanillasLoading: (b: boolean) => void;
  planillasSemana: string;
  setPlanillasSemana: (s: string) => void;
}) {
  const [planSection, setPlanSection] = useState<'kpis' | 'labores' | 'lotes' | 'tendencia' | 'extras' | 'ocupacion' | 'detalle'>('kpis');

  useEffect(() => {
    if (!planillasData && !planillasLoading) {
      setPlanillasLoading(true);
      fetch('/planillas-data.json')
        .then(r => r.json())
        .then(d => { setPlanillasData(d); setPlanillasLoading(false); })
        .catch(() => setPlanillasLoading(false));
    }
  }, [planillasData, planillasLoading, setPlanillasData, setPlanillasLoading]);

  const semanas = useMemo(() => {
    if (!planillasData) return [];
    return [...new Set(planillasData.nomina.map(n => n.semana))].sort((a, b) => a - b);
  }, [planillasData]);

  const filteredDetalle = useMemo(() => {
    if (!planillasData) return [];
    if (planillasSemana === 'all') return planillasData.detalle;
    const sem = parseInt(planillasSemana);
    const nominaSem = planillasData.nomina.filter(n => n.semana === sem);
    const f1 = nominaSem[0]?.fecha1;
    const f2 = nominaSem[0]?.fecha2;
    if (!f1 || !f2) return planillasData.detalle;
    return planillasData.detalle.filter(d => d.fecha >= f1 && d.fecha <= f2);
  }, [planillasData, planillasSemana]);

  const filteredNomina = useMemo(() => {
    if (!planillasData) return [];
    if (planillasSemana === 'all') return planillasData.nomina;
    return planillasData.nomina.filter(n => n.semana === parseInt(planillasSemana));
  }, [planillasData, planillasSemana]);

  // KPI calculations
  const kpis = useMemo(() => {
    const nom = filteredNomina;
    const det = filteredDetalle;
    const totalBruto = nom.reduce((s, n) => s + n.salTotal, 0);
    const totalCCSS = nom.reduce((s, n) => s + n.seguro, 0);
    const totalNeto = nom.reduce((s, n) => s + n.salNeto, 0);
    const totalDescuento = nom.reduce((s, n) => s + n.descuento, 0);
    const empleadosActivos = new Set(nom.map(n => n.codigo)).size;
    const totalHOrd = det.reduce((s, d) => s + d.hOrd, 0);
    const totalHExt = det.reduce((s, d) => s + d.hExt, 0);
    const totalHDob = det.reduce((s, d) => s + d.hDob, 0);
    const totalHoras = totalHOrd + totalHExt + totalHDob;
    const costoPromEmpleado = empleadosActivos > 0 ? totalBruto / empleadosActivos : 0;
    const laboresUnicas = new Set(det.map(d => d.labor)).size;
    const lotesActivos = new Set(det.filter(d => d.lote !== 'ADMIN').map(d => d.lote)).size;
    return {
      totalBruto, totalCCSS, totalNeto, totalDescuento,
      empleadosActivos, totalHOrd, totalHExt, totalHDob, totalHoras,
      costoPromEmpleado, laboresUnicas, lotesActivos, registros: det.length
    };
  }, [filteredNomina, filteredDetalle]);

  const fmtC = (n: number) => `₡${n.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const fmtN = (n: number) => n.toLocaleString('es-CR');

  if (planillasLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={32} color="#818cf8" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#94a3b8', marginTop: 12 }}>Cargando datos de planillas...</p>
        </div>
      </div>
    );
  }

  if (!planillasData) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#f87171' }}>
        <AlertTriangle size={32} />
        <p style={{ marginTop: 12 }}>No se pudieron cargar los datos de planillas.</p>
      </div>
    );
  }

  const sections = [
    { id: 'kpis' as const, label: 'KPIs', icon: '📊' },
    { id: 'labores' as const, label: 'Labores', icon: '🔧' },
    { id: 'lotes' as const, label: 'Lotes', icon: '🗺️' },
    { id: 'tendencia' as const, label: 'Tendencia', icon: '📈' },
    { id: 'extras' as const, label: 'Horas Extra', icon: '⏰' },
    { id: 'ocupacion' as const, label: 'Ocupación', icon: '👷' },
    { id: 'detalle' as const, label: 'Detalle', icon: '📋' },
  ];

  return (
    <div className="tab-content" style={{ marginTop: 8 }}>
      {/* Header with semana filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wallet size={22} color="#818cf8" /> Dashboard de Planillas
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontSize: 12, color: '#94a3b8' }}>Semana:</label>
          <select
            value={planillasSemana}
            onChange={e => setPlanillasSemana(e.target.value)}
            style={{
              background: 'var(--bg-secondary)', color: '#e2e8f0', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer'
            }}
          >
            <option value="all">Todas las semanas</option>
            {semanas.map(s => <option key={s} value={s}>Semana {s}</option>)}
          </select>
        </div>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setPlanSection(s.id)}
            style={{
              padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, transition: '0.2s',
              background: planSection === s.id ? 'rgba(129,140,248,0.2)' : 'transparent',
              color: planSection === s.id ? '#818cf8' : '#94a3b8',
              borderBottom: planSection === s.id ? '2px solid #818cf8' : '2px solid transparent',
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* ── SECTION: KPIs ── */}
      {planSection === 'kpis' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <PlanillaKPI icon="💰" title="Nómina Bruta" value={fmtC(kpis.totalBruto)} subtitle={`${fmtN(kpis.empleadosActivos)} empleados`} color="#818cf8" />
          <PlanillaKPI icon="🏥" title="CCSS (Cargas Sociales)" value={fmtC(kpis.totalCCSS)} subtitle={`${(kpis.totalBruto > 0 ? kpis.totalCCSS / kpis.totalBruto * 100 : 0).toFixed(1)}% del bruto`} color="#f472b6" />
          <PlanillaKPI icon="💵" title="Salario Neto" value={fmtC(kpis.totalNeto)} subtitle="Depósito total" color="#34d399" />
          <PlanillaKPI icon="⏱️" title="Horas Totales" value={fmtN(kpis.totalHoras)} subtitle={`${fmtN(kpis.totalHOrd)} ord + ${fmtN(kpis.totalHExt)} ext + ${fmtN(kpis.totalHDob)} dob`} color="#fbbf24" />
          <PlanillaKPI icon="👷" title="Empleados Activos" value={fmtN(kpis.empleadosActivos)} subtitle={`${fmtN(kpis.laboresUnicas)} labores distintas`} color="#60a5fa" />
          <PlanillaKPI icon="🗺️" title="Lotes Activos" value={fmtN(kpis.lotesActivos)} subtitle={`${fmtN(kpis.registros)} registros detalle`} color="#a78bfa" />
          <PlanillaKPI icon="💼" title="Costo Prom/Empleado" value={fmtC(kpis.costoPromEmpleado)} subtitle={planillasSemana === 'all' ? 'Acumulado' : `Semana ${planillasSemana}`} color="#fb923c" />
          <PlanillaKPI icon="📉" title="Descuentos" value={fmtC(kpis.totalDescuento)} subtitle="Deducciones aplicadas" color="#f87171" />
        </div>
      )}

      {/* ── SECTION: Labores ── */}
      {planSection === 'labores' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>🔧 Top 15 Labores por Costo</h3>
            <LaborCostChart detalle={filteredDetalle} />
          </div>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>🥧 Distribución de Costos por Labor</h3>
            <LaborPieChart detalle={filteredDetalle} />
          </div>
          {/* Labor detail table */}
          <div style={{ gridColumn: '1 / -1', background: 'var(--bg-secondary)', borderRadius: 16, padding: 20, border: '1px solid var(--border)', overflowX: 'auto' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>📋 Resumen por Labor</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8' }}>Labor</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8' }}>Registros</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8' }}>Horas</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8' }}>Costo Total</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8' }}>₡/Hora</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const map = new Map<string, { reg: number; horas: number; costo: number }>();
                  filteredDetalle.forEach(d => {
                    const e = map.get(d.labor) || { reg: 0, horas: 0, costo: 0 };
                    e.reg++;
                    e.horas += d.hOrd + d.hExt + d.hDob;
                    e.costo += d.total;
                    map.set(d.labor, e);
                  });
                  return [...map.entries()]
                    .sort((a, b) => b[1].costo - a[1].costo)
                    .map(([labor, v]) => (
                      <tr key={labor} style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                        <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>{labor}</td>
                        <td style={{ padding: '8px 12px', color: '#94a3b8', textAlign: 'right' }}>{fmtN(v.reg)}</td>
                        <td style={{ padding: '8px 12px', color: '#60a5fa', textAlign: 'right' }}>{fmtN(v.horas)}</td>
                        <td style={{ padding: '8px 12px', color: '#34d399', textAlign: 'right', fontWeight: 600 }}>{fmtC(v.costo)}</td>
                        <td style={{ padding: '8px 12px', color: '#fbbf24', textAlign: 'right' }}>{v.horas > 0 ? fmtC(Math.round(v.costo / v.horas)) : '—'}</td>
                      </tr>
                    ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SECTION: Lotes ── */}
      {planSection === 'lotes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>🗺️ Costo por Lote</h3>
            <LoteCostChart detalle={filteredDetalle} />
          </div>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>🧩 Treemap Lote × Labor</h3>
            <LoteLaborHeatmap detalle={filteredDetalle} />
          </div>
        </div>
      )}

      {/* ── SECTION: Tendencia ── */}
      {planSection === 'tendencia' && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>📈 Tendencia Semanal de Nómina</h3>
          <TendenciaSemanalPlanillaChart nomina={planillasData.nomina} />
        </div>
      )}

      {/* ── SECTION: Horas Extra ── */}
      {planSection === 'extras' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>⏰ Horas por Empleado (Ordinarias vs Extra vs Dobles)</h3>
            <HorasExtrasChart detalle={filteredDetalle} />
          </div>
          {/* Summary pie for hours distribution */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20, border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>Horas Ordinarias</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#818cf8' }}>{fmtN(kpis.totalHOrd)}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{kpis.totalHoras > 0 ? (kpis.totalHOrd / kpis.totalHoras * 100).toFixed(1) : 0}%</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20, border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>Horas Extra</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#fbbf24' }}>{fmtN(kpis.totalHExt)}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{kpis.totalHoras > 0 ? (kpis.totalHExt / kpis.totalHoras * 100).toFixed(1) : 0}%</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20, border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>Horas Dobles</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#f472b6' }}>{fmtN(kpis.totalHDob)}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{kpis.totalHoras > 0 ? (kpis.totalHDob / kpis.totalHoras * 100).toFixed(1) : 0}%</div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION: Ocupación ── */}
      {planSection === 'ocupacion' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>👷 Radar Comparativo por Ocupación</h3>
            <OcupacionRadarChart empleados={planillasData.empleados} detalle={filteredDetalle} />
          </div>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>📋 Detalle por Ocupación</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8' }}>Ocupación</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8' }}>Empleados</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8' }}>Costo Total</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8' }}>Horas</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const empOcup = new Map<number, string>();
                  planillasData.empleados.forEach(e => empOcup.set(e.codigo, e.ocupacion));
                  const byOcup = new Map<string, { emps: Set<number>; costo: number; horas: number }>();
                  filteredDetalle.forEach(d => {
                    const ocup = empOcup.get(d.codigo) || 'Sin Clasificar';
                    const e = byOcup.get(ocup) || { emps: new Set<number>(), costo: 0, horas: 0 };
                    e.emps.add(d.codigo);
                    e.costo += d.total;
                    e.horas += d.hOrd + d.hExt + d.hDob;
                    byOcup.set(ocup, e);
                  });
                  return [...byOcup.entries()]
                    .sort((a, b) => b[1].costo - a[1].costo)
                    .map(([ocup, v]) => (
                      <tr key={ocup} style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                        <td style={{ padding: '8px 12px', color: '#e2e8f0', fontWeight: 600 }}>{ocup}</td>
                        <td style={{ padding: '8px 12px', color: '#60a5fa', textAlign: 'right' }}>{v.emps.size}</td>
                        <td style={{ padding: '8px 12px', color: '#34d399', textAlign: 'right', fontWeight: 600 }}>{fmtC(v.costo)}</td>
                        <td style={{ padding: '8px 12px', color: '#fbbf24', textAlign: 'right' }}>{fmtN(v.horas)}</td>
                      </tr>
                    ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SECTION: Detalle ── */}
      {planSection === 'detalle' && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20, border: '1px solid var(--border)', overflowX: 'auto' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>
            📋 Registros de Detalle Laboral ({fmtN(filteredDetalle.length)} registros)
          </h3>
          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 8px', color: '#94a3b8' }}>Código</th>
                  <th style={{ textAlign: 'left', padding: '8px 8px', color: '#94a3b8' }}>Nombre</th>
                  <th style={{ textAlign: 'left', padding: '8px 8px', color: '#94a3b8' }}>Fecha</th>
                  <th style={{ textAlign: 'left', padding: '8px 8px', color: '#94a3b8' }}>Lote</th>
                  <th style={{ textAlign: 'left', padding: '8px 8px', color: '#94a3b8' }}>Labor</th>
                  <th style={{ textAlign: 'right', padding: '8px 8px', color: '#94a3b8' }}>hOrd</th>
                  <th style={{ textAlign: 'right', padding: '8px 8px', color: '#94a3b8' }}>hExt</th>
                  <th style={{ textAlign: 'right', padding: '8px 8px', color: '#94a3b8' }}>hDob</th>
                  <th style={{ textAlign: 'right', padding: '8px 8px', color: '#94a3b8' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredDetalle.slice(0, 200).map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                    <td style={{ padding: '6px 8px', color: '#94a3b8' }}>{d.codigo}</td>
                    <td style={{ padding: '6px 8px', color: '#e2e8f0', whiteSpace: 'nowrap' }}>{d.nombre.split(' ').slice(0, 2).join(' ')}</td>
                    <td style={{ padding: '6px 8px', color: '#94a3b8' }}>{d.fecha}</td>
                    <td style={{ padding: '6px 8px', color: '#60a5fa' }}>{d.lote}</td>
                    <td style={{ padding: '6px 8px', color: '#e2e8f0', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.labor}</td>
                    <td style={{ padding: '6px 8px', color: '#818cf8', textAlign: 'right' }}>{d.hOrd}</td>
                    <td style={{ padding: '6px 8px', color: d.hExt > 0 ? '#fbbf24' : '#475569', textAlign: 'right', fontWeight: d.hExt > 0 ? 600 : 400 }}>{d.hExt}</td>
                    <td style={{ padding: '6px 8px', color: d.hDob > 0 ? '#f472b6' : '#475569', textAlign: 'right', fontWeight: d.hDob > 0 ? 600 : 400 }}>{d.hDob}</td>
                    <td style={{ padding: '6px 8px', color: '#34d399', textAlign: 'right', fontWeight: 600 }}>{fmtC(d.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredDetalle.length > 200 && (
              <p style={{ textAlign: 'center', color: '#64748b', fontSize: 11, padding: 12 }}>
                Mostrando 200 de {fmtN(filteredDetalle.length)} registros
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
