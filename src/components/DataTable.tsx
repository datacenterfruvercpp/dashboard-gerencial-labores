'use client';

import { Home, X, Search, Download, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { useState, useMemo } from 'react';

interface Record {
  empresa: string; fecha: string; semana: number; lote: string;
  grupo: string | null; labor: string; personas: number | null;
  horas: number | null; pase: number | null; unidad: string;
  cantidad: number | null; area: number | null; precioUnit: number | null;
  total: number | null; iva: number | null; totalConIva: number | null;
  factura: number | null;
}

const fmtFull = (n: number) => new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 0 }).format(n);

const formatFecha = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts.map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
};

// === BREADCRUMB BAR ===
interface BreadcrumbFilter {
  type: string;
  label: string;
  value: string;
  icon?: string;
}

interface DrillBreadcrumbProps {
  filters: BreadcrumbFilter[];
  onRemove: (type: string, value: string) => void;
  onClearAll: () => void;
  filteredCount: number;
  totalCount: number;
}

export function DrillBreadcrumb({ filters, onRemove, onClearAll, filteredCount, totalCount }: DrillBreadcrumbProps) {
  if (filters.length === 0) return null;

  return (
    <div className="breadcrumb-bar">
      <button className="breadcrumb-home" onClick={onClearAll}>
        🏠 Todo
      </button>

      {filters.map((f, i) => (
        <span key={`${f.type}-${f.value}-${i}`} style={{ display: 'contents' }}>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-chip">
            <span className="chip-label">{f.icon} {f.label}:</span>
            {f.value}
            <button className="chip-remove" onClick={() => onRemove(f.type, f.value)}>✕</button>
          </span>
        </span>
      ))}

      <span className="breadcrumb-count">
        <strong>{filteredCount.toLocaleString()}</strong> de {totalCount.toLocaleString()} registros
      </span>

      {filters.length > 1 && (
        <button className="breadcrumb-clear" onClick={onClearAll}>
          <X size={10} /> Limpiar todo
        </button>
      )}
    </div>
  );
}


// === FULL DATA TABLE ===
interface DataTableProps {
  data: Record[];
  onRowClick?: (record: Record) => void;
}

export function DataTable({ data, onRowClick }: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortKey, setSortKey] = useState<string>('fecha');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Search filter
  const searchedData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(d =>
      d.lote?.toLowerCase().includes(q) ||
      d.labor?.toLowerCase().includes(q) ||
      d.unidad?.toLowerCase().includes(q) ||
      d.grupo?.toLowerCase().includes(q) ||
      d.fecha?.includes(q) ||
      String(d.factura).includes(q)
    );
  }, [data, searchQuery]);

  // Sort
  const sortedData = useMemo(() => {
    return [...searchedData].sort((a, b) => {
      const av = (a as any)[sortKey];
      const bv = (b as any)[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return sortAsc ? av - bv : bv - av;
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [searchedData, sortKey, sortAsc]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const pageData = sortedData.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
    setPage(0);
  };

  // Summary
  const summary = useMemo(() => {
    const total = searchedData.reduce((s, d) => s + (d.totalConIva || 0), 0);
    const base = searchedData.reduce((s, d) => s + (d.total || 0), 0);
    const iva = searchedData.reduce((s, d) => s + (d.iva || 0), 0);
    const horas = searchedData.reduce((s, d) => s + (d.horas || 0), 0);
    const facturas = new Set(searchedData.map(d => d.factura).filter(Boolean)).size;
    return { total, base, iva, horas, facturas, registros: searchedData.length };
  }, [searchedData]);

  const exportCSV = () => {
    const headers = ['Fecha', 'Semana', 'Lote', 'Grupo', 'Labor', 'Personas', 'Horas', 'Pase', 'Unidad', 'Cantidad', 'Área', 'PrecioUnit', 'Total', 'IVA', 'TotalConIVA', 'Factura'];
    const rows = sortedData.map(d => [
      d.fecha, d.semana, d.lote, d.grupo || '', d.labor, d.personas ?? '', d.horas ?? '',
      d.pase ?? '', d.unidad, d.cantidad ?? '', d.area ?? '', d.precioUnit ?? '', d.total ?? '',
      d.iva ?? '', d.totalConIva ?? '', d.factura ?? ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-labores-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ col }: { col: string }) => (
    <span className="sort-icon" style={{ color: sortKey === col ? '#22c55e' : undefined }}>
      {sortKey === col ? (sortAsc ? '↑' : '↓') : '↕'}
    </span>
  );

  return (
    <div className="data-table-wrapper" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease 1s forwards' }}>
      {/* Toolbar */}
      <div className="data-table-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="chart-title" style={{ fontSize: 14 }}>📊 Registro Detallado de Labores</span>
          <span className="badge badge-green">{summary.registros} registros</span>
        </div>
        <div className="data-table-actions">
          <div className="data-table-search">
            <Search size={14} style={{ color: '#64748b', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Buscar lote, labor, factura..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}>
                <X size={12} />
              </button>
            )}
          </div>
          <button className="data-table-btn" onClick={exportCSV}>
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('fecha')} className={sortKey === 'fecha' ? 'sorted' : ''}>Fecha <SortIcon col="fecha" /></th>
              <th onClick={() => handleSort('semana')} className={sortKey === 'semana' ? 'sorted' : ''}>Sem <SortIcon col="semana" /></th>
              <th onClick={() => handleSort('lote')} className={sortKey === 'lote' ? 'sorted' : ''}>Lote <SortIcon col="lote" /></th>
              <th onClick={() => handleSort('grupo')} className={sortKey === 'grupo' ? 'sorted' : ''}>Grp <SortIcon col="grupo" /></th>
              <th onClick={() => handleSort('labor')} className={sortKey === 'labor' ? 'sorted' : ''}>Labor <SortIcon col="labor" /></th>
              <th onClick={() => handleSort('unidad')} className={sortKey === 'unidad' ? 'sorted' : ''}>Und <SortIcon col="unidad" /></th>
              <th onClick={() => handleSort('cantidad')} className={sortKey === 'cantidad' ? 'sorted' : ''} style={{ textAlign: 'right' }}>Cant <SortIcon col="cantidad" /></th>
              <th onClick={() => handleSort('totalConIva')} className={sortKey === 'totalConIva' ? 'sorted' : ''} style={{ textAlign: 'right' }}>Total <SortIcon col="totalConIva" /></th>
              <th onClick={() => handleSort('factura')} className={sortKey === 'factura' ? 'sorted' : ''} style={{ textAlign: 'right' }}>Fact <SortIcon col="factura" /></th>
              <th style={{ width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((d, i) => {
              const rowIdx = page * pageSize + i;
              const isExpanded = expandedRow === rowIdx;
              return (
                <>
                  <tr
                    key={`row-${rowIdx}`}
                    className={isExpanded ? 'expanded' : ''}
                    onClick={() => setExpandedRow(isExpanded ? null : rowIdx)}
                  >
                    <td style={{ color: '#64748b' }}>{formatFecha(d.fecha)}</td>
                    <td style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{d.semana}</td>
                    <td style={{ fontWeight: 600, color: '#22c55e' }}>{d.lote}</td>
                    <td style={{ color: '#94a3b8' }}>{d.grupo || '–'}</td>
                    <td>{d.labor?.length > 28 ? d.labor.substring(0, 28) + '…' : d.labor}</td>
                    <td style={{ color: '#94a3b8' }}>{d.unidad}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{d.cantidad?.toLocaleString() ?? '–'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>{d.totalConIva ? fmtFull(d.totalConIva) : '–'}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#f59e0b' }}>{d.factura ?? '–'}</td>
                    <td style={{ textAlign: 'center' }}>
                      {isExpanded ? <ChevronUp size={12} color="#94a3b8" /> : <ChevronDown size={12} color="#475569" />}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`detail-${rowIdx}`} className="row-detail">
                      <td colSpan={10}>
                        <div className="row-detail-grid">
                          <div className="row-detail-item"><span className="detail-label">Empresa</span><span className="detail-value">{d.empresa}</span></div>
                          <div className="row-detail-item"><span className="detail-label">Personas</span><span className="detail-value">{d.personas ?? '–'}</span></div>
                          <div className="row-detail-item"><span className="detail-label">Horas</span><span className="detail-value">{d.horas ?? '–'}</span></div>
                          <div className="row-detail-item"><span className="detail-label">Pase</span><span className="detail-value">{d.pase ?? '–'}</span></div>
                          <div className="row-detail-item"><span className="detail-label">Área (Ha)</span><span className="detail-value">{d.area ?? '–'}</span></div>
                          <div className="row-detail-item"><span className="detail-label">Precio Unitario</span><span className="detail-value">{d.precioUnit ? fmtFull(d.precioUnit) : '–'}</span></div>
                          <div className="row-detail-item"><span className="detail-label">Base Gravable</span><span className="detail-value">{d.total ? fmtFull(d.total) : '–'}</span></div>
                          <div className="row-detail-item"><span className="detail-label">IVA</span><span className="detail-value">{d.iva ? fmtFull(d.iva) : '–'}</span></div>
                          <div className="row-detail-item"><span className="detail-label">Total con IVA</span><span className="detail-value" style={{ color: '#22c55e' }}>{d.totalConIva ? fmtFull(d.totalConIva) : '–'}</span></div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="data-table-summary">
        <div className="summary-item"><span className="summary-label">Total Facturado</span><span className="summary-value">{fmtFull(summary.total)}</span></div>
        <div className="summary-item"><span className="summary-label">Base Gravable</span><span className="summary-value" style={{ color: '#3b82f6' }}>{fmtFull(summary.base)}</span></div>
        <div className="summary-item"><span className="summary-label">IVA Total</span><span className="summary-value" style={{ color: '#f59e0b' }}>{fmtFull(summary.iva)}</span></div>
        <div className="summary-item"><span className="summary-label">Total Horas</span><span className="summary-value" style={{ color: '#06b6d4' }}>{summary.horas.toLocaleString()}</span></div>
        <div className="summary-item"><span className="summary-label">Facturas</span><span className="summary-value" style={{ color: '#8b5cf6' }}>{summary.facturas}</span></div>
      </div>

      {/* Pagination */}
      <div className="data-table-pagination">
        <span className="page-info">
          Mostrando {Math.min(page * pageSize + 1, sortedData.length)}–{Math.min((page + 1) * pageSize, sortedData.length)} de {sortedData.length}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select className="page-size-select" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <div className="page-controls">
            <button className="page-btn" disabled={page === 0} onClick={() => setPage(0)}>«</button>
            <button className="page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = page < 3 ? i : page - 2 + i;
              if (p >= totalPages) return null;
              return (
                <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
                  {p + 1}
                </button>
              );
            })}
            <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              <ChevronRight size={14} />
            </button>
            <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»</button>
          </div>
        </div>
      </div>
    </div>
  );
}
