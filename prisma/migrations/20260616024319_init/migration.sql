-- CreateTable
CREATE TABLE "Empresa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Finca" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Finca_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "fincaId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lote_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bloque" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" INTEGER NOT NULL,
    "area" REAL NOT NULL DEFAULT 0,
    "loteId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Bloque_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClasificacionArticulo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Articulo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "ingredienteActivo" TEXT NOT NULL DEFAULT '',
    "unidadMedida" TEXT NOT NULL DEFAULT 'kg',
    "clasificacionId" INTEGER NOT NULL,
    "diasReingreso" INTEGER NOT NULL DEFAULT 0,
    "diasCosecha" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Articulo_clasificacionId_fkey" FOREIGN KEY ("clasificacionId") REFERENCES "ClasificacionArticulo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Tractor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Boquilla" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Boom" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TipoMaterial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Variedad" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Responsable" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Programa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "etapa" TEXT NOT NULL,
    "area" TEXT NOT NULL DEFAULT 'FERTILIZACION'
);

-- CreateTable
CREATE TABLE "Labor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "descripcion" TEXT NOT NULL,
    "codigo" TEXT NOT NULL DEFAULT '',
    "dias" INTEGER NOT NULL DEFAULT 0,
    "grsPorPlanta" REAL NOT NULL DEFAULT 0,
    "ltsPorHa" REAL NOT NULL DEFAULT 0,
    "justificacion" TEXT NOT NULL DEFAULT '',
    "equipo" TEXT NOT NULL DEFAULT '',
    "programaId" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Labor_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "Programa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DosisLabor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "laborId" INTEGER NOT NULL,
    "articuloId" INTEGER NOT NULL,
    "dosisPorHa" REAL NOT NULL DEFAULT 0,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "DosisLabor_laborId_fkey" FOREIGN KEY ("laborId") REFERENCES "Labor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DosisLabor_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "Articulo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Grupo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "etapa" TEXT NOT NULL,
    "programaId" INTEGER,
    "fechaSiembra" DATETIME,
    "fechaForza" DATETIME,
    "inicioPrograma" DATETIME,
    "modificado" BOOLEAN NOT NULL DEFAULT false,
    "areaTotal" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Grupo_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "Programa" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GrupoBloqueAsignacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "grupoId" INTEGER NOT NULL,
    "bloqueId" INTEGER NOT NULL,
    "pesoForza" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "GrupoBloqueAsignacion_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GrupoBloqueAsignacion_bloqueId_fkey" FOREIGN KEY ("bloqueId") REFERENCES "Bloque" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EntradaBodega" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "consecutivo" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL,
    "noFactura" TEXT NOT NULL DEFAULT '',
    "proveedorId" INTEGER,
    "tipo" TEXT NOT NULL DEFAULT 'COMPRA',
    "moneda" TEXT NOT NULL DEFAULT 'COLONES',
    "subtotal" REAL NOT NULL DEFAULT 0,
    "descuento" REAL NOT NULL DEFAULT 0,
    "impuesto" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EntradaBodega_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EntradaBodegaDetalle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entradaId" INTEGER NOT NULL,
    "articuloId" INTEGER NOT NULL,
    "cantidad" REAL NOT NULL DEFAULT 0,
    "precioUnitario" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "EntradaBodegaDetalle_entradaId_fkey" FOREIGN KEY ("entradaId") REFERENCES "EntradaBodega" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EntradaBodegaDetalle_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "Articulo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalidaBodega" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "consecutivo" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'CEDULA',
    "cedulaId" INTEGER,
    "grupoId" INTEGER,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "hasTotales" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalidaBodega_cedulaId_fkey" FOREIGN KEY ("cedulaId") REFERENCES "Cedula" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SalidaBodega_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalidaBodegaDetalle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "salidaId" INTEGER NOT NULL,
    "articuloId" INTEGER NOT NULL,
    "cantidad" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "SalidaBodegaDetalle_salidaId_fkey" FOREIGN KEY ("salidaId") REFERENCES "SalidaBodega" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SalidaBodegaDetalle_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "Articulo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cedula" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "consecutivo" INTEGER NOT NULL,
    "tipoAplicacion" TEXT NOT NULL DEFAULT 'FOLIAR',
    "fecha" DATETIME NOT NULL,
    "semana" INTEGER NOT NULL DEFAULT 0,
    "anio" INTEGER NOT NULL DEFAULT 0,
    "grupoId" INTEGER,
    "laborId" INTEGER,
    "tractorId" INTEGER,
    "boomId" INTEGER,
    "boquillaId" INTEGER,
    "volAgua" REAL NOT NULL DEFAULT 0,
    "porcentajeCaminos" REAL NOT NULL DEFAULT 0,
    "areaTotal" REAL NOT NULL DEFAULT 0,
    "justificacion" TEXT NOT NULL DEFAULT '',
    "estado" TEXT NOT NULL DEFAULT 'GENERADA',
    "fechaAplicacion" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Cedula_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Cedula_laborId_fkey" FOREIGN KEY ("laborId") REFERENCES "Labor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Cedula_tractorId_fkey" FOREIGN KEY ("tractorId") REFERENCES "Tractor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Cedula_boomId_fkey" FOREIGN KEY ("boomId") REFERENCES "Boom" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Cedula_boquillaId_fkey" FOREIGN KEY ("boquillaId") REFERENCES "Boquilla" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CedulaDetalle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cedulaId" INTEGER NOT NULL,
    "articuloId" INTEGER NOT NULL,
    "dosisPorHa" REAL NOT NULL DEFAULT 0,
    "dosisPorBoom" REAL NOT NULL DEFAULT 0,
    "dosisFraccion" REAL NOT NULL DEFAULT 0,
    "dosisTotal" REAL NOT NULL DEFAULT 0,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CedulaDetalle_cedulaId_fkey" FOREIGN KEY ("cedulaId") REFERENCES "Cedula" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CedulaDetalle_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "Articulo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Siembra" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bloqueId" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL,
    "plantas" INTEGER NOT NULL DEFAULT 0,
    "area" REAL NOT NULL DEFAULT 0,
    "densidad" INTEGER NOT NULL DEFAULT 65000,
    "tipoMaterialId" INTEGER NOT NULL,
    "variedadId" INTEGER NOT NULL,
    "rangoPesos" TEXT NOT NULL DEFAULT '',
    "ciclo" INTEGER NOT NULL DEFAULT 1,
    "cerrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Siembra_bloqueId_fkey" FOREIGN KEY ("bloqueId") REFERENCES "Bloque" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Siembra_tipoMaterialId_fkey" FOREIGN KEY ("tipoMaterialId") REFERENCES "TipoMaterial" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Siembra_variedadId_fkey" FOREIGN KEY ("variedadId") REFERENCES "Variedad" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "esSupervisor" BOOLEAN NOT NULL DEFAULT false,
    "permisos" TEXT NOT NULL DEFAULT '{}',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SemanaCalendario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "anio" INTEGER NOT NULL,
    "semana" INTEGER NOT NULL,
    "hasSiembra" REAL NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "Finca_codigo_key" ON "Finca"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Lote_fincaId_codigo_key" ON "Lote"("fincaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Bloque_loteId_numero_key" ON "Bloque"("loteId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "ClasificacionArticulo_nombre_key" ON "ClasificacionArticulo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Articulo_codigo_key" ON "Articulo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_nombre_key" ON "Proveedor"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Tractor_codigo_key" ON "Tractor"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Boquilla_nombre_key" ON "Boquilla"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Boom_codigo_key" ON "Boom"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "TipoMaterial_nombre_key" ON "TipoMaterial"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Variedad_nombre_key" ON "Variedad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Responsable_nombre_key" ON "Responsable"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Programa_nombre_etapa_area_key" ON "Programa"("nombre", "etapa", "area");

-- CreateIndex
CREATE UNIQUE INDEX "Labor_programaId_descripcion_key" ON "Labor"("programaId", "descripcion");

-- CreateIndex
CREATE UNIQUE INDEX "DosisLabor_laborId_articuloId_key" ON "DosisLabor"("laborId", "articuloId");

-- CreateIndex
CREATE UNIQUE INDEX "Grupo_codigo_key" ON "Grupo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "GrupoBloqueAsignacion_grupoId_bloqueId_key" ON "GrupoBloqueAsignacion"("grupoId", "bloqueId");

-- CreateIndex
CREATE UNIQUE INDEX "EntradaBodega_consecutivo_key" ON "EntradaBodega"("consecutivo");

-- CreateIndex
CREATE UNIQUE INDEX "SalidaBodega_consecutivo_key" ON "SalidaBodega"("consecutivo");

-- CreateIndex
CREATE UNIQUE INDEX "SalidaBodega_cedulaId_key" ON "SalidaBodega"("cedulaId");

-- CreateIndex
CREATE UNIQUE INDEX "Cedula_consecutivo_key" ON "Cedula"("consecutivo");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_codigo_key" ON "Usuario"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "SemanaCalendario_anio_semana_key" ON "SemanaCalendario"("anio", "semana");
