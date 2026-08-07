import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

const ADMIN_PIN = '130680';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const pin = formData.get('pin') as string;
    const file = formData.get('file') as File;

    if (!pin || pin !== ADMIN_PIN) {
      return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();

    // Parse Excel with ExcelJS (same logic as analyze.js)
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(new Uint8Array(arrayBuffer) as any);
    const sheet = wb.worksheets[0];

    if (!sheet) {
      return NextResponse.json({ error: 'El archivo Excel no tiene hojas de cálculo' }, { status: 400 });
    }

    const headerNames = ['empresa','fecha','semana','lote','grupo','labor','personas','horas','pase','unidad','cantidad','area','precioUnit','total','iva','totalConIva','factura'];
    const cols = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];

    const data: Record<string, any>[] = [];
    for (let r = 5; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r);
      const first = row.getCell(1).value;
      if (!first) continue;

      const rec: Record<string, any> = {};
      cols.forEach((c, i) => {
        let v: any = row.getCell(c).value;
        if (v && typeof v === 'object' && (v as any).result !== undefined) v = (v as any).result;
        if (v instanceof Date) v = v.toISOString().split('T')[0];
        if (v === 'NA' || v === null || v === undefined) v = null;
        rec[headerNames[i]] = v;
      });

      // Parse numeric fields
      ['personas','horas','pase','cantidad','area','precioUnit','total','iva','totalConIva','factura','semana'].forEach(f => {
        if (rec[f] !== null) rec[f] = Number(rec[f]) || null;
      });

      if (rec.lote) rec.lote = String(rec.lote);
      if (rec.grupo) rec.grupo = String(rec.grupo);

      data.push(rec);
    }

    if (data.length === 0) {
      return NextResponse.json({ error: 'El archivo no contiene datos válidos (se esperan datos desde la fila 5)' }, { status: 400 });
    }

    // Write to public/data.json
    const dataJsonPath = path.join(process.cwd(), 'public', 'data.json');
    fs.writeFileSync(dataJsonPath, JSON.stringify(data, null, 0));

    const fileSizeKB = (fs.statSync(dataJsonPath).size / 1024).toFixed(1);
    const labores = new Set(data.map(d => d.labor).filter(Boolean)).size;
    const lotes = new Set(data.map(d => d.lote).filter(Boolean)).size;
    const totalFacturado = data.reduce((s, d) => s + (d.totalConIva || 0), 0);

    return NextResponse.json({
      success: true,
      registros: data.length,
      labores,
      lotes,
      totalFacturado,
      fileSizeKB,
      fileName: file.name,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: `Error al procesar: ${error.message}` }, { status: 500 });
  }
}
