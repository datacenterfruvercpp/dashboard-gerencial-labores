const ExcelJS = require('exceljs');
const fs = require('fs');

async function convert() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('./data.xlsx');
  const sheet = wb.worksheets[0];
  
  const HEADER_ROW = 4;
  const headerNames = ['empresa','fecha','semana','lote','grupo','labor','personas','horas','pase','unidad','cantidad','area','precioUnit','total','iva','totalConIva','factura'];
  const cols = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];
  
  const data = [];
  for (let r = 5; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const first = row.getCell(1).value;
    if (!first) continue;
    
    const rec = {};
    cols.forEach((c, i) => {
      let v = row.getCell(c).value;
      if (v && typeof v === 'object' && v.result !== undefined) v = v.result;
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
  
  fs.writeFileSync('./public/data.json', JSON.stringify(data, null, 0));
  console.log(`Convertido: ${data.length} registros → public/data.json (${(fs.statSync('./public/data.json').size / 1024).toFixed(1)} KB)`);
  
  // Stats
  const labores = new Set(data.map(d => d.labor).filter(Boolean));
  const lotes = new Set(data.map(d => d.lote).filter(Boolean));
  const semanas = new Set(data.map(d => d.semana).filter(Boolean));
  console.log(`Labores: ${labores.size}, Lotes: ${lotes.size}, Semanas: ${semanas.size}`);
  console.log(`Total facturado: ₡${data.reduce((s,d) => s + (d.totalConIva || 0), 0).toLocaleString()}`);
}

convert().catch(console.error);
