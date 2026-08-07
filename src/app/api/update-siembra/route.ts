import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

const ADMIN_PIN = '130680';
const HTML_PATH = path.join(process.cwd(), 'public', 'siembra-labagric.html');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const pin = formData.get('pin') as string;
    const siembraFile = formData.get('siembraFile') as File | null;
    const aplicFile = formData.get('aplicFile') as File | null;

    if (!pin || pin !== ADMIN_PIN) {
      return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 });
    }

    if (!siembraFile && !aplicFile) {
      return NextResponse.json({ error: 'Debe subir al menos un archivo' }, { status: 400 });
    }

    // Read current HTML
    if (!fs.existsSync(HTML_PATH)) {
      return NextResponse.json({ error: 'Archivo HTML no encontrado en el servidor' }, { status: 500 });
    }
    let html = fs.readFileSync(HTML_PATH, 'utf-8');

    // Extract current RAW_DATA using string search (more reliable for large JSON)
    const marker = 'const RAW_DATA = ';
    const startIdx = html.indexOf(marker);
    if (startIdx === -1) {
      return NextResponse.json({ error: 'No se encontró RAW_DATA en el HTML' }, { status: 500 });
    }
    const jsonStart = startIdx + marker.length;
    // Find the matching closing brace + semicolon
    let braceCount = 0;
    let jsonEnd = jsonStart;
    for (let i = jsonStart; i < html.length; i++) {
      if (html[i] === '{') braceCount++;
      else if (html[i] === '}') { braceCount--; if (braceCount === 0) { jsonEnd = i + 1; break; } }
    }
    const rawJsonStr = html.substring(jsonStart, jsonEnd);
    let rawData: any;
    try {
      rawData = JSON.parse(rawJsonStr);
    } catch {
      return NextResponse.json({ error: 'Error al parsear RAW_DATA existente' }, { status: 500 });
    }

    const results: any = { success: true };

    // ═══ PROCESS SIEMBRA FILE ═══
    if (siembraFile) {
      const buf = await siembraFile.arrayBuffer();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(new Uint8Array(buf) as any);
      const sheet = wb.worksheets[0];
      if (!sheet) {
        return NextResponse.json({ error: 'El archivo de siembra no tiene hojas' }, { status: 400 });
      }

      // Find header row (look in first 5 rows for "Semana" or "Lote")
      let headerRow = 1;
      for (let r = 1; r <= 5; r++) {
        const row = sheet.getRow(r);
        for (let c = 1; c <= 20; c++) {
          const v = String(row.getCell(c).value || '').toLowerCase();
          if (v.includes('semana') || v.includes('lote')) { headerRow = r; break; }
        }
        if (headerRow === r && r > 1) break;
      }

      // Map columns by header names
      const hRow = sheet.getRow(headerRow);
      const colMap: Record<string, number> = {};
      for (let c = 1; c <= 20; c++) {
        const h = String(hRow.getCell(c).value || '').toLowerCase().trim();
        if (h.includes('semana')) colMap.sem = c;
        else if (h.includes('fecha') || h.includes('fech')) colMap.fecha = c;
        else if (h.includes('finca')) colMap.finca = c;
        else if (h === 'lote' || h.includes('lote')) colMap.lote = c;
        else if (h.includes('bloque')) colMap.bloque = c;
        else if (h.includes('terraza')) colMap.terraza = c;
        else if (h === 'area' || h === 'área') colMap.area = c;
        else if (h.includes('planta')) colMap.plantas = c;
        else if (h.includes('precio')) colMap.precio = c;
        else if (h.includes('densidad')) colMap.densidad = c;
        else if (h.includes('material')) colMap.material = c;
        else if (h.includes('variedad')) colMap.variedad = c;
        else if (h.includes('tipo')) colMap.tipo = c;
        else if (h.includes('proced')) colMap.proced = c;
      }

      const siembraData: any[] = [];
      for (let r = headerRow + 1; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r);
        const loteVal = row.getCell(colMap.lote || 4).value;
        if (!loteVal) continue;

        const getCellVal = (col: number | undefined): any => {
          if (!col) return null;
          let v: any = row.getCell(col).value;
          if (v && typeof v === 'object' && (v as any).result !== undefined) v = (v as any).result;
          return v;
        };

        const parseNum = (v: any): number => {
          if (v === null || v === undefined) return 0;
          const s = String(v).replace(/[$₡,\s]/g, '');
          return parseFloat(s) || 0;
        };

        const parseDateStr = (v: any): string => {
          if (!v) return '';
          if (v instanceof Date) {
            const d = v.getDate().toString().padStart(2, '0');
            const m = (v.getMonth() + 1).toString().padStart(2, '0');
            return `${d}/${m}/${v.getFullYear()}`;
          }
          return String(v);
        };

        siembraData.push({
          tipo: String(getCellVal(colMap.tipo) || 'Convencional'),
          variedad: String(getCellVal(colMap.variedad) || 'MD2'),
          densidad: parseNum(getCellVal(colMap.densidad)),
          bloque: String(getCellVal(colMap.bloque) || ''),
          fecha: parseDateStr(getCellVal(colMap.fecha)),
          finca: String(getCellVal(colMap.finca) || ''),
          sem: parseNum(getCellVal(colMap.sem)),
          proced: String(getCellVal(colMap.proced) || ''),
          material: String(getCellVal(colMap.material) || ''),
          area: parseNum(getCellVal(colMap.area)),
          lote: String(loteVal).replace(/[^0-9]/g, '') || String(loteVal),
          precio: parseNum(getCellVal(colMap.precio)),
          plantas: parseNum(getCellVal(colMap.plantas)),
          terraza: String(getCellVal(colMap.terraza) || ''),
        });
      }

      if (siembraData.length === 0) {
        return NextResponse.json({ error: 'El archivo de siembra no contiene datos válidos' }, { status: 400 });
      }

      rawData.siembra = siembraData;
      results.siembra = { registros: siembraData.length, fileName: siembraFile.name };
    }

    // ═══ PROCESS APLICACIONES FILE ═══
    if (aplicFile) {
      const buf = await aplicFile.arrayBuffer();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(new Uint8Array(buf) as any);
      const sheet = wb.worksheets[0];
      if (!sheet) {
        return NextResponse.json({ error: 'El archivo de aplicaciones no tiene hojas' }, { status: 400 });
      }

      // Find header row
      let headerRow = 1;
      for (let r = 1; r <= 5; r++) {
        const row = sheet.getRow(r);
        for (let c = 1; c <= 20; c++) {
          const v = String(row.getCell(c).value || '').toLowerCase();
          if (v.includes('labor') || v.includes('producto')) { headerRow = r; break; }
        }
        if (headerRow === r && r > 1) break;
      }

      // Map columns
      const hRow = sheet.getRow(headerRow);
      const colMap: Record<string, number> = {};
      for (let c = 1; c <= 20; c++) {
        const h = String(hRow.getCell(c).value || '').toLowerCase().trim();
        if (h.includes('finca')) colMap.finca = c;
        else if (h.includes('nombre')) colMap.nombre = c;
        else if (h === 'lote' || h.includes('lote')) colMap.lote = c;
        else if (h.includes('grupo')) colMap.grupo = c;
        else if (h.includes('fecha aplic')) colMap.fechaAplic = c;
        else if (h.includes('fecha prog')) colMap.fechaProg = c;
        else if (h.includes('etapa')) colMap.etapa = c;
        else if (h.includes('labor')) colMap.labor = c;
        else if (h.includes('producto') && !h.includes('cod') && !h.includes('cód')) colMap.producto = c;
        else if (h.includes('unidad')) colMap.unidad = c;
        else if (h.includes('cantidad')) colMap.cantidad = c;
        else if (h.includes('prec') && h.includes('unit')) colMap.precioUnit = c;
        else if (h.includes('costo')) colMap.costoTotal = c;
      }

      const aplicData: any[] = [];
      for (let r = headerRow + 1; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r);
        const loteVal = row.getCell(colMap.lote || 3).value;
        if (!loteVal) continue;

        const getCellVal = (col: number | undefined): any => {
          if (!col) return null;
          let v: any = row.getCell(col).value;
          if (v && typeof v === 'object' && (v as any).result !== undefined) v = (v as any).result;
          return v;
        };

        const parseNum = (v: any): number => {
          if (v === null || v === undefined) return 0;
          const s = String(v).replace(/[$₡,\s]/g, '');
          return parseFloat(s) || 0;
        };

        const parseDateStr = (v: any): string => {
          if (!v) return '';
          if (v instanceof Date) {
            const d = v.getDate().toString().padStart(2, '0');
            const m = (v.getMonth() + 1).toString().padStart(2, '0');
            return `${d}/${m}/${v.getFullYear()}`;
          }
          return String(v);
        };

        aplicData.push({
          finca: String(getCellVal(colMap.finca) || ''),
          nombre: String(getCellVal(colMap.nombre) || ''),
          lote: String(loteVal).replace(/[^0-9]/g, '') || String(loteVal),
          grupo: String(getCellVal(colMap.grupo) || ''),
          fechaAplic: parseDateStr(getCellVal(colMap.fechaAplic)),
          etapa: String(getCellVal(colMap.etapa) || ''),
          labor: String(getCellVal(colMap.labor) || ''),
          producto: String(getCellVal(colMap.producto) || ''),
          unidad: String(getCellVal(colMap.unidad) || ''),
          cantidad: parseNum(getCellVal(colMap.cantidad)),
          precioUnit: parseNum(getCellVal(colMap.precioUnit)),
          costoTotal: parseNum(getCellVal(colMap.costoTotal)),
        });
      }

      if (aplicData.length === 0) {
        return NextResponse.json({ error: 'El archivo de aplicaciones no contiene datos válidos' }, { status: 400 });
      }

      rawData.aplicaciones = aplicData;
      results.aplicaciones = { registros: aplicData.length, fileName: aplicFile.name };
    }

    // ═══ REGENERATE HTML ═══
    const newRawDataStr = `const RAW_DATA = ${JSON.stringify(rawData)};`;
    // Replace old RAW_DATA with new one using the indices we found earlier
    html = html.substring(0, startIdx) + newRawDataStr + html.substring(jsonEnd + 1);
    fs.writeFileSync(HTML_PATH, html, 'utf-8');

    const fileSizeKB = (fs.statSync(HTML_PATH).size / 1024).toFixed(1);
    results.htmlSizeKB = fileSizeKB;

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Update siembra error:', error);
    return NextResponse.json({ error: `Error al procesar: ${error.message}` }, { status: 500 });
  }
}
