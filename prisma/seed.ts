import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // === USUARIO ADMIN ===
  await prisma.usuario.upsert({
    where: { codigo: 'ADMIN' },
    update: {},
    create: {
      codigo: 'ADMIN',
      nombre: 'Administrador',
      clave: '1234',
      esSupervisor: true,
      permisos: JSON.stringify({
        mantenimiento: true,
        restringido: true,
        grupos: true,
        bodega: true,
        cedulas: true,
        actividades: true,
        anular: true,
        programaEventos: true,
        herramientas: true,
        reportes: true,
      }),
    },
  });

  await prisma.usuario.upsert({
    where: { codigo: 'GRETEL' },
    update: {},
    create: {
      codigo: 'GRETEL',
      nombre: 'Gretel Quintero Licea',
      clave: '1234',
      esSupervisor: true,
      permisos: JSON.stringify({
        mantenimiento: true,
        restringido: true,
        grupos: true,
        bodega: true,
        cedulas: true,
        actividades: true,
        anular: true,
        programaEventos: true,
        herramientas: true,
        reportes: true,
      }),
    },
  });

  // === EMPRESA ===
  const empresa = await prisma.empresa.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nombre: 'EFRANAVI S.A',
      direccion: '1 km Norte de la Escuela 4 Esquinas, Pital, San Carlos',
    },
  });

  // === CLASIFICACIONES DE ARTÍCULOS ===
  const clasificaciones = [
    'Insecticida', 'Fertilizante', 'Fertilizante al Suelo', 'Fungicida',
    'Herbicida', 'Madurante', 'Regulador', 'Adherente', 'Control Biológico',
  ];

  for (const nombre of clasificaciones) {
    await prisma.clasificacionArticulo.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  // === TIPOS DE MATERIAL ===
  for (const nombre of ['BASAL 1', 'GUIA 1', 'PRIMERA']) {
    await prisma.tipoMaterial.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  // === VARIEDADES ===
  for (const nombre of ['Amarilla']) {
    await prisma.variedad.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  // === FINCAS ===
  const fincasData = [
    { codigo: 'ALM', nombre: 'ALMENDRO' },
    { codigo: 'PTO', nombre: 'PUERTO' },
    { codigo: 'GRE', nombre: 'GRETEL' },
    { codigo: 'MOS', nombre: 'MOSCA' },
    { codigo: 'LAU', nombre: 'LAUREL' },
    { codigo: 'TOR', nombre: 'TORTUGA' },
    { codigo: 'ENC', nombre: 'ENCANTO' },
    { codigo: 'POZ', nombre: 'POZO' },
    { codigo: 'YUC', nombre: 'YUCA' },
    { codigo: 'BOL', nombre: 'BOLIVAR' },
    { codigo: 'CAS', nombre: 'CASANDRA' },
    { codigo: 'COR', nombre: 'CORRAL' },
    { codigo: 'MAR', nombre: 'MARIA' },
  ];

  for (const fincaData of fincasData) {
    await prisma.finca.upsert({
      where: { codigo: fincaData.codigo },
      update: {},
      create: {
        ...fincaData,
        empresaId: empresa.id,
      },
    });
  }

  // === ARTÍCULOS (Productos Agrícolas) ===
  const fertId = (await prisma.clasificacionArticulo.findUnique({ where: { nombre: 'Fertilizante' } }))!.id;
  const insId = (await prisma.clasificacionArticulo.findUnique({ where: { nombre: 'Insecticida' } }))!.id;
  const adhId = (await prisma.clasificacionArticulo.findUnique({ where: { nombre: 'Adherente' } }))!.id;

  const articulosData = [
    { codigo: '00040', descripcion: 'Urea Prilada', ingredienteActivo: 'N 46%', unidadMedida: 'kg', clasificacionId: fertId },
    { codigo: '00034', descripcion: 'Nitrato de Potasio', ingredienteActivo: 'N 13.5%, K 45.5%', unidadMedida: 'kg', clasificacionId: fertId },
    { codigo: '00028', descripcion: 'K Max Extra', ingredienteActivo: 'K2O 33.6%', unidadMedida: 'ltr', clasificacionId: fertId },
    { codigo: '00038', descripcion: 'Sulfato de Magnesio', ingredienteActivo: 'Mg 16.4%, S 13%', unidadMedida: 'kg', clasificacionId: fertId },
    { codigo: '00039', descripcion: 'Truphos', ingredienteActivo: 'P2O5 30%, K2O 20%', unidadMedida: 'ltr', clasificacionId: fertId },
    { codigo: '00041', descripcion: 'Zincazot', ingredienteActivo: 'Nitrato de Zinc 22%', unidadMedida: 'ltr', clasificacionId: fertId },
    { codigo: '00025', descripcion: 'Green plant Fe', ingredienteActivo: 'Hierro 6%', unidadMedida: 'ltr', clasificacionId: fertId },
    { codigo: '00005', descripcion: 'Alexin', ingredienteActivo: 'Bioestimulante', unidadMedida: 'ltr', clasificacionId: fertId },
    { codigo: '00021', descripcion: 'Fertimins Calcio Boro', ingredienteActivo: 'Ca-B', unidadMedida: 'kg', clasificacionId: fertId },
    { codigo: '00033', descripcion: 'Multifoliar Polisacaríos', ingredienteActivo: '6.5%N, 23%K, 2%B', unidadMedida: 'kg', clasificacionId: fertId },
    { codigo: '00017', descripcion: 'Diazol 60 EC', ingredienteActivo: 'Diazinon 60%', unidadMedida: 'ltr', clasificacionId: insId, diasReingreso: 1, diasCosecha: 30 },
    { codigo: '00037', descripcion: 'Rimon 10 EC', ingredienteActivo: 'Novaluron 10%', unidadMedida: 'ltr', clasificacionId: insId, diasReingreso: 1, diasCosecha: 14 },
    { codigo: '00010', descripcion: 'Biogreen', ingredienteActivo: 'Surfactante natural', unidadMedida: 'ltr', clasificacionId: adhId },
    { codigo: '00001', descripcion: 'Acido Cítrico', ingredienteActivo: 'pH regulador', unidadMedida: 'kg', clasificacionId: adhId },
    { codigo: '00023', descripcion: 'Fertibiol', ingredienteActivo: 'Bioestimulante', unidadMedida: 'ltr', clasificacionId: fertId },
  ];

  for (const art of articulosData) {
    await prisma.articulo.upsert({
      where: { codigo: art.codigo },
      update: {},
      create: art,
    });
  }

  // === TRACTORES ===
  const tractoresData = [
    { codigo: 'JD6125', descripcion: 'John Deere 6125W' },
    { codigo: 'JD5090', descripcion: 'John Deere 5090E' },
  ];
  for (const t of tractoresData) {
    await prisma.tractor.upsert({ where: { codigo: t.codigo }, update: {}, create: t });
  }

  // === BOQUILLAS ===
  for (const nombre of ['D5 Nebulizador DC35', 'D3 DC25', 'TJ60 11002']) {
    await prisma.boquilla.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }

  // === BOOMS ===
  const boomsData = [
    { codigo: 'BOOM1', descripcion: 'Boom Principal 24m' },
    { codigo: 'BOOM2', descripcion: 'Boom Secundario 18m' },
  ];
  for (const b of boomsData) {
    await prisma.boom.upsert({ where: { codigo: b.codigo }, update: {}, create: b });
  }

  // === RESPONSABLES ===
  for (const nombre of ['Carlos Mora', 'Luis Rodríguez', 'Ana Campos']) {
    await prisma.responsable.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }

  // === PROVEEDORES ===
  for (const nombre of ['Agroquímicos del Norte', 'DISAGRO', 'Bayer CropScience']) {
    await prisma.proveedor.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }

  // ============================================================
  // PLANILLAS — CATÁLOGOS BASE
  // ============================================================

  console.log('📋 Seeding Planillas module...');

  // === DEPARTAMENTOS ===
  const departamentosData = [
    { codigo: 'CAMPO', nombre: 'Campo' },
    { codigo: 'BODEGA', nombre: 'Bodega' },
    { codigo: 'ADMIN', nombre: 'Administración' },
    { codigo: 'GERENCIA', nombre: 'Gerencia' },
    { codigo: 'EMPAQUE', nombre: 'Planta Empaque' },
    { codigo: 'TRANSPORT', nombre: 'Transporte' },
    { codigo: 'MANTO', nombre: 'Mantenimiento' },
  ];
  for (const d of departamentosData) {
    await prisma.departamento.upsert({ where: { codigo: d.codigo }, update: {}, create: d });
  }

  // === CARGOS ===
  const cargosData = [
    'PEON AGRICOLA', 'BOOM OPERADOR', 'TRACTORISTA', 'BODEGUERO',
    'JEFE DE CAMPO', 'SUPERVISOR', 'ENCARGADO CUADRILLA', 'ADMINISTRATIVO',
    'CONTADOR', 'GERENTE', 'CHOFER', 'MECANICO', 'EMPACADOR',
  ];
  for (const nombre of cargosData) {
    await prisma.cargoOficio.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }

  // === JORNADAS LABORALES ===
  const jornadasData = [
    { codigo: 'DIURNA_CAMPO', descripcion: 'Diurna Campo', horasPorDia: 10 },
    { codigo: 'DIURNA_ADMIN', descripcion: 'Diurna Administrativa', horasPorDia: 8 },
    { codigo: 'NOCTURNA', descripcion: 'Nocturna', horasPorDia: 6 },
    { codigo: 'MIXTA', descripcion: 'Mixta', horasPorDia: 7 },
  ];
  for (const j of jornadasData) {
    await prisma.jornadaLaboral.upsert({ where: { codigo: j.codigo }, update: {}, create: j });
  }

  // === TIPOS DE PLANILLA ===
  const tiposPlanillaData = [
    { codigo: 'CAMPO', nombre: 'Campo', periodicidad: 'SEMANAL' },
    { codigo: 'ADMIN', nombre: 'Administrativa', periodicidad: 'QUINCENAL' },
    { codigo: 'GERENCIAL', nombre: 'Gerencial', periodicidad: 'MENSUAL' },
  ];
  for (const tp of tiposPlanillaData) {
    await prisma.tipoPlanilla.upsert({ where: { codigo: tp.codigo }, update: {}, create: tp });
  }

  // === GRUPOS DE PAGO ===
  const gruposPagoData = [
    { codigo: 'FRUVER', nombre: 'Fruver' },
    { codigo: 'EFRANAVI', nombre: 'EFRANAVI' },
  ];
  for (const gp of gruposPagoData) {
    await prisma.grupoPago.upsert({ where: { codigo: gp.codigo }, update: {}, create: gp });
  }

  // === TIPOS DE CONTRATO ===
  for (const nombre of ['INDEFINIDO', 'TEMPORAL', 'PRUEBA']) {
    await prisma.tipoContrato.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }

  // === CLASES DE TRABAJADOR ===
  for (const nombre of ['OBRERO', 'ADMINISTRATIVO', 'CONFIANZA']) {
    await prisma.claseTrabajador.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }

  // === FORMAS DE PAGO ===
  for (const nombre of ['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE']) {
    await prisma.formaPago.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }

  // === NACIONALIDADES ===
  for (const nombre of ['COSTARRICENSE', 'NICARAGUENSE', 'PANAMEÑA', 'HONDUREÑA', 'GUATEMALTECA', 'COLOMBIANA']) {
    await prisma.nacionalidad.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }

  // === CATEGORÍAS DE EMPLEADO ===
  for (const nombre of ['PLANTA', 'EVENTUAL', 'TEMPORAL']) {
    await prisma.categoriaEmpleado.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }

  // === TIPOS DE INCAPACIDAD ===
  const tiposIncapacidadData = [
    { codigo: 'CCSS', descripcion: 'Incapacidad CCSS' },
    { codigo: 'INS', descripcion: 'Incapacidad INS (Riesgo de Trabajo)' },
    { codigo: 'MATERNIDAD', descripcion: 'Licencia por Maternidad' },
  ];
  for (const ti of tiposIncapacidadData) {
    await prisma.tipoIncapacidad.upsert({ where: { codigo: ti.codigo }, update: {}, create: ti });
  }

  // === CONCEPTOS DE PAGO ===
  const conceptosPagoData = [
    // Ingresos
    { codigo: 'SALARIO_BASE', nombre: 'Salario Base', tipo: 'INGRESO', aplicacion: 'FIJO', valorDefault: 0, afectaSalario: true, afectaVacaciones: true, afectaAguinaldo: true, esAutomatico: true, orden: 1 },
    { codigo: 'HORAS_EXTRA', nombre: 'Horas Extra', tipo: 'INGRESO', aplicacion: 'MANUAL', valorDefault: 0, afectaSalario: true, afectaVacaciones: false, afectaAguinaldo: true, orden: 2 },
    { codigo: 'HORAS_DOBLE', nombre: 'Horas Doble', tipo: 'INGRESO', aplicacion: 'MANUAL', valorDefault: 0, afectaSalario: true, afectaVacaciones: false, afectaAguinaldo: true, orden: 3 },
    { codigo: 'HORAS_EXTRA_DOBLE', nombre: 'Horas Extra Doble', tipo: 'INGRESO', aplicacion: 'MANUAL', valorDefault: 0, afectaSalario: true, afectaVacaciones: false, afectaAguinaldo: true, orden: 4 },
    { codigo: 'VACACIONES', nombre: 'Vacaciones', tipo: 'INGRESO', aplicacion: 'MANUAL', valorDefault: 0, afectaSalario: false, afectaVacaciones: false, afectaAguinaldo: false, orden: 5 },
    { codigo: 'INCAP_CCSS', nombre: 'Incapacidad CCSS', tipo: 'INGRESO', aplicacion: 'MANUAL', valorDefault: 0, afectaSalario: false, afectaVacaciones: false, afectaAguinaldo: false, orden: 6 },
    { codigo: 'INCAP_INS', nombre: 'Incapacidad INS', tipo: 'INGRESO', aplicacion: 'MANUAL', valorDefault: 0, afectaSalario: false, afectaVacaciones: false, afectaAguinaldo: false, orden: 7 },
    // Deducciones automáticas
    { codigo: 'CCSS_SEM', nombre: 'CCSS Obrero SEM', tipo: 'DEDUCCION', aplicacion: 'PORCENTAJE', valorDefault: 5.50, esPorcentual: true, esAutomatico: true, afectaSalario: true, orden: 10 },
    { codigo: 'CCSS_IVM', nombre: 'CCSS Obrero IVM', tipo: 'DEDUCCION', aplicacion: 'PORCENTAJE', valorDefault: 4.17, esPorcentual: true, esAutomatico: true, afectaSalario: true, orden: 11 },
    { codigo: 'BANCO_POPULAR', nombre: 'Banco Popular', tipo: 'DEDUCCION', aplicacion: 'PORCENTAJE', valorDefault: 1.00, esPorcentual: true, esAutomatico: true, afectaSalario: true, orden: 12 },
    { codigo: 'IMP_RENTA', nombre: 'Impuesto de Renta', tipo: 'DEDUCCION', aplicacion: 'FORMULA', valorDefault: 0, esAutomatico: true, afectaSalario: true, orden: 13 },
    // Deducciones manuales
    { codigo: 'EMBARGO', nombre: 'Embargo Judicial', tipo: 'DEDUCCION', aplicacion: 'FIJO', valorDefault: 0, afectaSalario: true, orden: 20 },
    { codigo: 'PRESTAMO', nombre: 'Cuota Préstamo', tipo: 'DEDUCCION', aplicacion: 'FIJO', valorDefault: 0, afectaSalario: true, orden: 21 },
    { codigo: 'ASOCIACION', nombre: 'Cuota Asociación', tipo: 'DEDUCCION', aplicacion: 'FIJO', valorDefault: 0, afectaSalario: true, orden: 22 },
    { codigo: 'ADELANTO', nombre: 'Adelanto de Salario', tipo: 'DEDUCCION', aplicacion: 'MANUAL', valorDefault: 0, afectaSalario: true, orden: 23 },
  ];
  for (const cp of conceptosPagoData) {
    await prisma.conceptoPago.upsert({
      where: { codigo: cp.codigo },
      update: {},
      create: {
        codigo: cp.codigo,
        nombre: cp.nombre,
        tipo: cp.tipo,
        aplicacion: cp.aplicacion,
        valorDefault: cp.valorDefault,
        afectaSalario: cp.afectaSalario,
        afectaVacaciones: cp.afectaVacaciones ?? false,
        afectaAguinaldo: cp.afectaAguinaldo ?? false,
        esPorcentual: cp.esPorcentual ?? false,
        esAutomatico: cp.esAutomatico ?? false,
        orden: cp.orden,
      },
    });
  }

  // === APORTES PATRONO (Costa Rica 2026) ===
  const aportesData = [
    { concepto: 'CCSS_SEM', porcentajePatrono: 9.25, porcentajeTrabajador: 5.50 },
    { concepto: 'CCSS_IVM', porcentajePatrono: 5.08, porcentajeTrabajador: 4.17 },
    { concepto: 'ASIG_FAMILIAR', porcentajePatrono: 5.00, porcentajeTrabajador: 0 },
    { concepto: 'IMAS', porcentajePatrono: 0.50, porcentajeTrabajador: 0 },
    { concepto: 'INA', porcentajePatrono: 1.50, porcentajeTrabajador: 0 },
    { concepto: 'BANCO_POPULAR', porcentajePatrono: 0.25, porcentajeTrabajador: 1.00 },
  ];
  for (const ap of aportesData) {
    await prisma.aportePatrono.upsert({ where: { concepto: ap.concepto }, update: {}, create: ap });
  }

  // === PARÁMETROS DE PLANILLA ===
  const parametrosData = [
    { clave: 'DIAS_PREAVISO_MIN', valor: '26', descripcion: 'Días mínimos para cálculo de preaviso', grupo: 'PREAVISO' },
    { clave: 'DIAS_CESANTIA_CALCULO', valor: '180', descripcion: 'Días para cálculo de cesantía', grupo: 'CESANTIA' },
    { clave: 'ANOS_MAX_CESANTIA', valor: '8', descripcion: 'Años máximos para cálculo de cesantía', grupo: 'CESANTIA' },
    { clave: 'MESES_CALCULO_LIQUIDACION', valor: '12', descripcion: 'Meses para cálculo de liquidación', grupo: 'LIQUIDACION' },
    { clave: 'ANIO_PROCESO', valor: '2026', descripcion: 'Año de proceso actual', grupo: 'GENERAL' },
    { clave: 'MES_PROCESO', valor: '6', descripcion: 'Mes de proceso actual', grupo: 'GENERAL' },
    { clave: 'CONSECUTIVO_EMPLEADO', valor: '1000', descripcion: 'Consecutivo para código de empleado', grupo: 'GENERAL' },
  ];
  for (const p of parametrosData) {
    await prisma.parametroPlanilla.upsert({ where: { clave: p.clave }, update: {}, create: p });
  }

  // === TABLA DE CESANTÍA (Costa Rica) ===
  const cesantiaData = [
    { aniosDesde: 0, aniosHasta: 0, diasPago: 0 },
    { aniosDesde: 1, aniosHasta: 1, diasPago: 19 },
    { aniosDesde: 2, aniosHasta: 2, diasPago: 20 },
    { aniosDesde: 3, aniosHasta: 3, diasPago: 20 },
    { aniosDesde: 4, aniosHasta: 4, diasPago: 21 },
    { aniosDesde: 5, aniosHasta: 5, diasPago: 21 },
    { aniosDesde: 6, aniosHasta: 6, diasPago: 21 },
    { aniosDesde: 7, aniosHasta: 7, diasPago: 22 },
    { aniosDesde: 8, aniosHasta: 99, diasPago: 22 },
  ];
  // Delete existing cesantia entries and recreate
  await prisma.tablaCesantia.deleteMany({});
  for (const c of cesantiaData) {
    await prisma.tablaCesantia.create({ data: c });
  }

  // === DÍAS FESTIVOS 2026 (Costa Rica) ===
  const festivosData = [
    { fecha: new Date('2026-01-01'), descripcion: 'Año Nuevo', anio: 2026 },
    { fecha: new Date('2026-04-02'), descripcion: 'Jueves Santo', anio: 2026 },
    { fecha: new Date('2026-04-03'), descripcion: 'Viernes Santo', anio: 2026 },
    { fecha: new Date('2026-04-11'), descripcion: 'Día de Juan Santamaría', anio: 2026 },
    { fecha: new Date('2026-05-01'), descripcion: 'Día del Trabajo', anio: 2026 },
    { fecha: new Date('2026-07-25'), descripcion: 'Anexión de Guanacaste', anio: 2026 },
    { fecha: new Date('2026-08-02'), descripcion: 'Día de la Virgen de los Ángeles', anio: 2026 },
    { fecha: new Date('2026-08-15'), descripcion: 'Día de la Madre', anio: 2026 },
    { fecha: new Date('2026-09-15'), descripcion: 'Día de la Independencia', anio: 2026 },
    { fecha: new Date('2026-12-01'), descripcion: 'Día de la Abolición del Ejército', anio: 2026 },
    { fecha: new Date('2026-12-25'), descripcion: 'Navidad', anio: 2026 },
  ];
  await prisma.calendarioDiaFestivo.deleteMany({});
  for (const f of festivosData) {
    await prisma.calendarioDiaFestivo.create({ data: f });
  }

  // === CONCEPTOS DE PAGO ===
  const conceptosData = [
    // INGRESOS
    { codigo: 'ING-001', nombre: 'Salario Base', tipo: 'INGRESO', aplicacion: 'FIJO', orden: 1, esAutomatico: true, afectaSalario: true, afectaVacaciones: true, afectaAguinaldo: true },
    { codigo: 'ING-002', nombre: 'Horas Extra', tipo: 'INGRESO', aplicacion: 'FORMULA', orden: 2, esAutomatico: true, afectaSalario: true },
    { codigo: 'ING-003', nombre: 'Horas Dobles', tipo: 'INGRESO', aplicacion: 'FORMULA', orden: 3, esAutomatico: true, afectaSalario: true },
    { codigo: 'ING-004', nombre: 'Bonificación', tipo: 'INGRESO', aplicacion: 'MANUAL', orden: 4 },
    { codigo: 'ING-005', nombre: 'Comisiones', tipo: 'INGRESO', aplicacion: 'MANUAL', orden: 5 },
    { codigo: 'ING-006', nombre: 'Viáticos', tipo: 'INGRESO', aplicacion: 'MANUAL', orden: 6, afectaSalario: false },
    { codigo: 'ING-007', nombre: 'Vacaciones', tipo: 'INGRESO', aplicacion: 'FORMULA', orden: 7, esAutomatico: true },
    { codigo: 'ING-008', nombre: 'Aguinaldo', tipo: 'INGRESO', aplicacion: 'FORMULA', orden: 8, esAutomatico: true },
    // DEDUCCIONES
    { codigo: 'DED-001', nombre: 'CCSS Trabajador (SEM)', tipo: 'DEDUCCION', aplicacion: 'PORCENTAJE', valorDefault: 5.50, esPorcentual: true, orden: 1, esAutomatico: true },
    { codigo: 'DED-002', nombre: 'CCSS Trabajador (IVM)', tipo: 'DEDUCCION', aplicacion: 'PORCENTAJE', valorDefault: 4.17, esPorcentual: true, orden: 2, esAutomatico: true },
    { codigo: 'DED-003', nombre: 'Banco Popular (Trabajador)', tipo: 'DEDUCCION', aplicacion: 'PORCENTAJE', valorDefault: 1.00, esPorcentual: true, orden: 3, esAutomatico: true },
    { codigo: 'DED-004', nombre: 'Impuesto sobre la Renta', tipo: 'DEDUCCION', aplicacion: 'FORMULA', orden: 4, esAutomatico: true },
    { codigo: 'DED-005', nombre: 'Pensión Alimentaria', tipo: 'DEDUCCION', aplicacion: 'MANUAL', orden: 5 },
    { codigo: 'DED-006', nombre: 'Préstamo', tipo: 'DEDUCCION', aplicacion: 'FIJO', orden: 6 },
    { codigo: 'DED-007', nombre: 'Adelanto de Salario', tipo: 'DEDUCCION', aplicacion: 'MANUAL', orden: 7 },
  ];
  for (const c of conceptosData) {
    await prisma.conceptoPago.upsert({
      where: { codigo: c.codigo },
      update: {},
      create: {
        codigo: c.codigo,
        nombre: c.nombre,
        tipo: c.tipo,
        aplicacion: c.aplicacion || 'FIJO',
        valorDefault: c.valorDefault || 0,
        afectaSalario: c.afectaSalario ?? true,
        afectaVacaciones: c.afectaVacaciones ?? false,
        afectaAguinaldo: c.afectaAguinaldo ?? false,
        esPorcentual: c.esPorcentual ?? false,
        esAutomatico: c.esAutomatico ?? false,
        orden: c.orden || 0,
      },
    });
  }

  // === TIPOS DE DEDUCCIÓN ===
  const tiposDeduccionData = ['Obligatorias', 'Voluntarias', 'Judiciales'];
  for (const nombre of tiposDeduccionData) {
    await prisma.tipoDeduccion.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  // === CÓDIGOS DE INGRESO ===
  const codigosIngresoData = [
    { codigo: 'SAL', descripcion: 'Salario ordinario' },
    { codigo: 'HEX', descripcion: 'Horas extra' },
    { codigo: 'HDO', descripcion: 'Horas dobles' },
    { codigo: 'BON', descripcion: 'Bonificaciones' },
    { codigo: 'COM', descripcion: 'Comisiones' },
    { codigo: 'VIA', descripcion: 'Viáticos' },
  ];
  for (const c of codigosIngresoData) {
    await prisma.codigoIngreso.upsert({
      where: { codigo: c.codigo },
      update: {},
      create: c,
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('👤 Usuarios creados:');
  console.log('   ADMIN / 1234 (Supervisor)');
  console.log('   GRETEL / 1234 (Supervisor)');
  console.log('');
  console.log('🏠 13 fincas creadas');
  console.log('📦 15 artículos creados');
  console.log('🚜 2 tractores, 3 boquillas, 2 booms');
  console.log('👥 3 responsables, 3 proveedores');
  console.log('');
  console.log('📋 Módulo Planillas:');
  console.log('   🏢 7 departamentos');
  console.log('   💼 13 cargos');
  console.log('   🕐 4 jornadas laborales');
  console.log('   📄 3 tipos de planilla');
  console.log('   💰 2 grupos de pago');
  console.log('   📝 3 tipos de contrato');
  console.log('   👷 3 clases de trabajador');
  console.log('   💳 3 formas de pago');
  console.log('   🌎 6 nacionalidades');
  console.log('   🏷️ 3 categorías de empleado');
  console.log('   🏥 3 tipos de incapacidad');
  console.log('   💵 15 conceptos de pago');
  console.log('   🏛️ 6 aportes patrono');
  console.log('   ⚙️ 7 parámetros de planilla');
  console.log('   📅 9 registros tabla cesantía');
  console.log('   🎉 11 días festivos 2026');
  // ============================================================
  // CONTABILIDAD — CATÁLOGOS BASE
  // ============================================================

  console.log('📊 Seeding Contabilidad module...');

  // === MONEDAS ===
  await prisma.moneda.upsert({ where: { codigo: 'CRC' }, update: {}, create: { codigo: 'CRC', nombre: 'Colón Costarricense', simbolo: '₡', tipoCambio: 1, esBase: true } });
  await prisma.moneda.upsert({ where: { codigo: 'USD' }, update: {}, create: { codigo: 'USD', nombre: 'Dólar Estadounidense', simbolo: '$', tipoCambio: 530, esBase: false } });
  await prisma.moneda.upsert({ where: { codigo: 'EUR' }, update: {}, create: { codigo: 'EUR', nombre: 'Euro', simbolo: '€', tipoCambio: 580, esBase: false } });

  // === CLASIFICACIONES CONTABLES ===
  const clasificacionesContables = [
    { descripcion: 'ACTIVOS', definicionBase: 'ACTIVO' },
    { descripcion: 'PASIVOS', definicionBase: 'PASIVO' },
    { descripcion: 'EGRESOS', definicionBase: 'EGRESO' },
    { descripcion: 'INGRESOS', definicionBase: 'INGRESO' },
    { descripcion: 'CUENTAS DE CAPITAL', definicionBase: 'CAPITAL' },
  ];
  for (const cc of clasificacionesContables) {
    await prisma.clasificacionContable.upsert({ where: { descripcion: cc.descripcion }, update: {}, create: cc });
  }

  // === CLASES DE CUENTAS ===
  const clasActivos = await prisma.clasificacionContable.findUnique({ where: { descripcion: 'ACTIVOS' } });
  const clasPasivos = await prisma.clasificacionContable.findUnique({ where: { descripcion: 'PASIVOS' } });
  const clasEgresos = await prisma.clasificacionContable.findUnique({ where: { descripcion: 'EGRESOS' } });
  const clasIngresos = await prisma.clasificacionContable.findUnique({ where: { descripcion: 'INGRESOS' } });
  const clasCapital = await prisma.clasificacionContable.findUnique({ where: { descripcion: 'CUENTAS DE CAPITAL' } });

  const clasesData = [
    { descripcion: 'Activo Circulante', clasificacionId: clasActivos!.id, tipoBase: 'ACTIVO', seLiquidaFinPeriodo: false },
    { descripcion: 'Activo Fijo', clasificacionId: clasActivos!.id, tipoBase: 'ACTIVO', seLiquidaFinPeriodo: false },
    { descripcion: 'Otros Activos', clasificacionId: clasActivos!.id, tipoBase: 'ACTIVO', seLiquidaFinPeriodo: false },
    { descripcion: 'Pasivo Circulante', clasificacionId: clasPasivos!.id, tipoBase: 'PASIVO', seLiquidaFinPeriodo: false },
    { descripcion: 'Doc. a Pagar Largo Plazo', clasificacionId: clasPasivos!.id, tipoBase: 'PASIVO', seLiquidaFinPeriodo: false },
    { descripcion: 'Egresos', clasificacionId: clasEgresos!.id, tipoBase: 'GASTO', seLiquidaFinPeriodo: true },
    { descripcion: 'Ingresos', clasificacionId: clasIngresos!.id, tipoBase: 'INGRESO', seLiquidaFinPeriodo: true },
    { descripcion: 'Capital Contable', clasificacionId: clasCapital!.id, tipoBase: 'CAPITAL', seLiquidaFinPeriodo: false },
  ];
  for (const cl of clasesData) {
    const existing = await prisma.claseCuenta.findFirst({ where: { descripcion: cl.descripcion } });
    if (!existing) await prisma.claseCuenta.create({ data: cl });
  }

  // === NIVELES CONTABLES ===
  const nivelesData = [
    { nivel: 1, tamano: 3 },
    { nivel: 2, tamano: 2 },
    { nivel: 3, tamano: 2 },
    { nivel: 4, tamano: 2 },
    { nivel: 5, tamano: 2 },
    { nivel: 6, tamano: 2 },
  ];
  for (const n of nivelesData) {
    await prisma.nivelContable.upsert({ where: { nivel: n.nivel }, update: {}, create: n });
  }

  // === TIPOS DE GASTO ===
  const tiposGastoData = [
    'Mano de Obra', 'Insumos y Materiales', 'Servicios', 'Maquinaria y Equipo',
    'Equipo de Protección Personal', 'Leasing', 'Kilometraje', 'Viajes Exterior',
    'Alimentación', 'Agua', 'Electricidad', 'Teléfonos', 'Combustibles',
    'Llantas y Accesorios', 'Repuestos', 'Lubricantes', 'Cartón',
    'Paletizado', 'Otros Materiales', 'Plásticos',
  ];
  for (const desc of tiposGastoData) {
    await prisma.tipoGasto.upsert({ where: { descripcion: desc }, update: {}, create: { descripcion: desc } });
  }

  // === PARÁMETROS CONTABLES ===
  const paramContables = [
    { clave: 'ANIO_CONTABLE', valor: '2026' },
    { clave: 'MES_CONTABLE', valor: '6' },
    { clave: 'CONSECUTIVO_ASIENTO', valor: '1' },
    { clave: 'MONEDA_BASE', valor: 'CRC' },
    { clave: 'CUENTA_UTILIDAD', valor: '' },
    { clave: 'CUENTA_PERDIDA', valor: '' },
  ];
  for (const p of paramContables) {
    await prisma.parametroContable.upsert({ where: { clave: p.clave }, update: {}, create: p });
  }

  // === PLAN DE CUENTAS BÁSICO ===
  const claseActivoCirc = await prisma.claseCuenta.findFirst({ where: { descripcion: 'Activo Circulante' } });
  const claseActivoFijo = await prisma.claseCuenta.findFirst({ where: { descripcion: 'Activo Fijo' } });
  const clasePasivoCirc = await prisma.claseCuenta.findFirst({ where: { descripcion: 'Pasivo Circulante' } });
  const claseEgresos = await prisma.claseCuenta.findFirst({ where: { descripcion: 'Egresos' } });
  const claseIngresos = await prisma.claseCuenta.findFirst({ where: { descripcion: 'Ingresos' } });
  const claseCapital = await prisma.claseCuenta.findFirst({ where: { descripcion: 'Capital Contable' } });

  const cuentasBase = [
    // Activos
    { codigo: '110', descripcion: 'Efectivo y Equivalentes', claseId: claseActivoCirc!.id, recibeMovimientos: false },
    { codigo: '110.01', descripcion: 'Caja General', claseId: claseActivoCirc!.id, recibeMovimientos: true },
    { codigo: '110.01.01', descripcion: 'Caja Chica', claseId: claseActivoCirc!.id, recibeMovimientos: true },
    { codigo: '110.01.02', descripcion: 'Bancos Nacionales', claseId: claseActivoCirc!.id, recibeMovimientos: true },
    { codigo: '120', descripcion: 'Cuentas por Cobrar', claseId: claseActivoCirc!.id, recibeMovimientos: false },
    { codigo: '120.01', descripcion: 'Clientes', claseId: claseActivoCirc!.id, recibeMovimientos: true, requiereNIT: true },
    { codigo: '130', descripcion: 'Inventarios', claseId: claseActivoCirc!.id, recibeMovimientos: false },
    { codigo: '130.01', descripcion: 'Inventario de Insumos', claseId: claseActivoCirc!.id, recibeMovimientos: true },
    { codigo: '150', descripcion: 'Activos Fijos', claseId: claseActivoFijo!.id, recibeMovimientos: false },
    { codigo: '150.01', descripcion: 'Terrenos', claseId: claseActivoFijo!.id, recibeMovimientos: true },
    { codigo: '150.02', descripcion: 'Maquinaria y Equipo', claseId: claseActivoFijo!.id, recibeMovimientos: true },
    { codigo: '150.02.01', descripcion: 'Vehículos', claseId: claseActivoFijo!.id, recibeMovimientos: true },
    // Pasivos
    { codigo: '210', descripcion: 'Cuentas por Pagar', claseId: clasePasivoCirc!.id, recibeMovimientos: false },
    { codigo: '210.01', descripcion: 'Proveedores', claseId: clasePasivoCirc!.id, recibeMovimientos: true, requiereNIT: true },
    { codigo: '220', descripcion: 'Aportes y Retenciones', claseId: clasePasivoCirc!.id, recibeMovimientos: false },
    { codigo: '220.01', descripcion: 'Fondo de Capitalización Laboral', claseId: clasePasivoCirc!.id, recibeMovimientos: true },
    { codigo: '220.02', descripcion: 'Fondo Cap. Laboral', claseId: clasePasivoCirc!.id, recibeMovimientos: true },
    { codigo: '230', descripcion: 'Deducciones Obreras', claseId: clasePasivoCirc!.id, recibeMovimientos: false },
    { codigo: '230.01', descripcion: 'Deducc. Obreras C.C.S.S.', claseId: clasePasivoCirc!.id, recibeMovimientos: true },
    // Egresos (Gastos)
    { codigo: '510', descripcion: 'Gastos de Operación', claseId: claseEgresos!.id, recibeMovimientos: false },
    { codigo: '510.03', descripcion: 'Mano de Obra', claseId: claseEgresos!.id, recibeMovimientos: false },
    { codigo: '510.03.01', descripcion: 'Mano de Obra Directa', claseId: claseEgresos!.id, recibeMovimientos: true, requiereCentroCosto: true },
    { codigo: '510.04', descripcion: 'Cargas Sociales', claseId: claseEgresos!.id, recibeMovimientos: false },
    { codigo: '510.04.06', descripcion: 'Cargas Sociales Patronales', claseId: claseEgresos!.id, recibeMovimientos: false },
    { codigo: '510.04.06.01', descripcion: 'CCSS Patrono', claseId: claseEgresos!.id, recibeMovimientos: false },
    { codigo: '510.04.06.01.01', descripcion: 'CCSS Patrono SEM', claseId: claseEgresos!.id, recibeMovimientos: true },
    { codigo: '520', descripcion: 'Gastos Administrativos', claseId: claseEgresos!.id, recibeMovimientos: false },
    { codigo: '520.01', descripcion: 'Gastos Administrativos General', claseId: claseEgresos!.id, recibeMovimientos: true },
    // Ingresos
    { codigo: '410', descripcion: 'Ingresos Operacionales', claseId: claseIngresos!.id, recibeMovimientos: false },
    { codigo: '410.01', descripcion: 'Venta de Fruta', claseId: claseIngresos!.id, recibeMovimientos: true, requiereNIT: true },
    { codigo: '410.02', descripcion: 'Otros Ingresos', claseId: claseIngresos!.id, recibeMovimientos: true },
    // Capital
    { codigo: '310', descripcion: 'Capital Social', claseId: claseCapital!.id, recibeMovimientos: false },
    { codigo: '310.01', descripcion: 'Capital Social Pagado', claseId: claseCapital!.id, recibeMovimientos: true },
    { codigo: '320', descripcion: 'Resultados', claseId: claseCapital!.id, recibeMovimientos: false },
    { codigo: '320.01', descripcion: 'Utilidad del Período', claseId: claseCapital!.id, recibeMovimientos: true },
    { codigo: '320.02', descripcion: 'Utilidades Retenidas', claseId: claseCapital!.id, recibeMovimientos: true },
  ];
  for (const cta of cuentasBase) {
    const existing = await prisma.cuentaContable.findUnique({ where: { codigo: cta.codigo } });
    if (!existing) await prisma.cuentaContable.create({ data: cta });
  }

  console.log('✅ Contabilidad seeded!');
  console.log('   💱 3 monedas (CRC, USD, EUR)');
  console.log('   📊 5 clasificaciones contables');
  console.log('   📁 8 clases de cuenta');
  console.log('   📐 6 niveles contables');
  console.log('   💸 20 tipos de gasto');
  console.log('   ⚙️ 6 parámetros contables');
  console.log('   📋 37 cuentas contables base');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

