'use client';

import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

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

interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: Record[];
  allDataTotal: number;
}

export default function DetailDrawer({ isOpen, onClose, title, data, allDataTotal }: DetailDrawerProps) {
  const [closing, setClosing] = useState(false);
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string>('fecha');
  const [sortAsc, setSortAsc] = useState(false);
  const pageSize = 30;

  // Reset page when data changes
  useEffect(() => { setPage(0); }, [data]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 250);
  };

  // Handle ESC key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  // KPIs
  const kpis = useMemo(() => {
    const totalFacturado = data.reduce((s, d) => s + (d.totalConIva || 0), 0);
    const registros = data.length;
    const promedio = registros > 0 ? totalFacturado / registros : 0;
    const pctDelTotal = allDataTotal > 0 ? ((totalFacturado / allDataTotal) * 100).toFixed(1) : '0';
    const totalHoras = data.reduce((s, d) => s + (d.horas || 0), 0);
    const facturasUnicas = new Set(data.map(d => d.factura).filter(Boolean)).size;
    return { totalFacturado, registros, promedio, pctDelTotal, totalHoras, facturasUnicas };
  }, [data, allDataTotal]);

  // Sort
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const av = (a as any)[sortKey];
      const bv = (b as any)[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return sortAsc ? av - bv : bv - av;
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [data, sortKey, sortAsc]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const pageData = sortedData.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortIcon = ({ col }: { col: string }) => (
    <span className="sort-icon" style={{ color: sortKey === col ? '#22c55e' : undefined }}>
      {sortKey === col ? (sortAsc ? '↑' : '↓') : '↕'}
    </span>
  );

  const exportCSV = () => {
    const headers = ['Fecha', 'Semana', 'Lote', 'Grupo', 'Labor', 'Personas', 'Horas', 'Unidad', 'Cantidad', 'Área', 'PrecioUnit', 'Total', 'IVA', 'TotalConIVA', 'Factura'];
    const rows = sortedData.map(d => [
      d.fecha, d.semana, d.lote, d.grupo || '', d.labor, d.personas ?? '', d.horas ?? '',
      d.unidad, d.cantidad ?? '', d.area ?? '', d.precioUnit ?? '', d.total ?? '',
      d.iva ?? '', d.totalConIva ?? '', d.factura ?? ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `detalle-${title.replace(/[^a-zA-Z0-9]/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={handleClose} />
      <div className={`drawer-panel ${closing ? 'closing' : ''}`}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-title">
            📋 {title}
            <span className="drawer-title-badge">{kpis.registros} registros</span>
          </div>
          <button className="drawer-close" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        {/* Mini KPIs */}
        <div className="drawer-kpis">
          <div className="drawer-kpi">
            <span className="dk-label">Total Facturado</span>
            <span className="dk-value">{fmtFull(kpis.totalFacturado)}</span>
            <span className="dk-pct">{kpis.pctDelTotal}% del total</span>
          </div>
          <div className="drawer-kpi">
            <span className="dk-label">Registros</span>
            <span className="dk-value">{kpis.registros.toLocaleString()}</span>
          </div>
          <div className="drawer-kpi">
            <span className="dk-label">Promedio</span>
            <span className="dk-value">{fmtFull(kpis.promedio)}</span>
          </div>
          <div className="drawer-kpi">
            <span className="dk-label">Facturas</span>
            <span className="dk-value">{kpis.facturasUnicas}</span>
          </div>
        </div>

        {/* Table Body */}
        <div className="drawer-body">
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('fecha')} className={sortKey === 'fecha' ? 'sorted' : ''}>Fecha <SortIcon col="fecha" /></th>
                  <th onClick={() => handleSort('lote')} className={sortKey === 'lote' ? 'sorted' : ''}>Lote <SortIcon col="lote" /></th>
                  <th onClick={() => handleSort('labor')} className={sortKey === 'labor' ? 'sorted' : ''}>Labor <SortIcon col="labor" /></th>
                  <th onClick={() => handleSort('unidad')} className={sortKey === 'unidad' ? 'sorted' : ''}>Und <SortIcon col="unidad" /></th>
                  <th onClick={() => handleSort('cantidad')} className={sortKey === 'cantidad' ? 'sorted' : ''} style={{ textAlign: 'right' }}>Cant <SortIcon col="cantidad" /></th>
                  <th onClick={() => handleSort('totalConIva')} className={sortKey === 'totalConIva' ? 'sorted' : ''} style={{ textAlign: 'right' }}>Total <SortIcon col="totalConIva" /></th>
                  <th onClick={() => handleSort('factura')} className={sortKey === 'factura' ? 'sorted' : ''} style={{ textAlign: 'right' }}>Fact <SortIcon col="factura" /></th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((d, i) => (
                  <tr key={`${d.fecha}-${d.lote}-${d.labor}-${i}`}>
                    <td style={{ color: '#64748b' }}>{formatFecha(d.fecha)}</td>
                    <td style={{ fontWeight: 600, color: '#22c55e' }}>{d.lote}</td>
                    <td>{d.labor?.length > 25 ? d.labor.substring(0, 25) + '…' : d.labor}</td>
                    <td style={{ color: '#94a3b8' }}>{d.unidad}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{d.cantidad?.toLocaleString() ?? '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>{d.totalConIva ? fmtFull(d.totalConIva) : '-'}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#f59e0b' }}>{d.factura ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="drawer-footer">
          <div className="data-table-pagination" style={{ border: 'none', padding: 0, flex: 1 }}>
            <span className="page-info">
              Pág {page + 1} de {totalPages || 1}
            </span>
            <div className="page-controls">
              <button className="page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft size={14} />
              </button>
              <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <button className="data-table-btn" onClick={exportCSV}>
            <Download size={14} /> Exportar CSV
          </button>
        </div>
      </div>
    </>
  );
}
