# 🌿 Dashboard Gerencial de Labores — EFRANAVI S.A.

> **Panel ejecutivo de gestión agrícola** para monitoreo en tiempo real de labores, productividad y costos operativos.

## 📊 Descripción

Dashboard ejecutivo diseñado para la gerencia de EFRANAVI S.A. que centraliza toda la información operativa del sistema Fruitend 2.0 en visualizaciones interactivas y KPIs en tiempo real.

## 🎯 Funcionalidades

### KPIs Principales
- Hectáreas bajo manejo
- Labores ejecutadas vs programadas
- Costo promedio por hectárea
- Cédulas pendientes / aplicadas
- Stock de insumos críticos
- Productividad por finca

### Visualizaciones
- 📈 Tendencia de labores mensuales
- 🥧 Distribución de costos por tipo de labor
- 📊 Comparativo de rendimiento por finca
- 🗺️ Mapa de cobertura de aplicaciones
- 📉 Evolución de inventario de insumos
- ⏱️ Cumplimiento de programación técnica

### Características Técnicas
- Conexión directa a la BD de Fruitend 2.0
- Actualización en tiempo real
- Diseño responsive (desktop, tablet, móvil)
- Modo oscuro premium
- Exportación de reportes

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
|------------|-----------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| ORM | Prisma 6.x |
| BD | SQLite (dev) / PostgreSQL (prod) |
| Charts | Recharts |
| Icons | Lucide React |
| Estilos | CSS Custom (Premium Dark Theme) |

## 🚀 Arranque

```bash
cd dashboard-gerencial-labores
npm run dev
# http://localhost:3001
```

## 📁 Estructura

```
src/
├── app/
│   ├── globals.css          ← Design system (dark premium)
│   ├── layout.tsx           ← Root layout
│   └── page.tsx             ← Dashboard principal
├── components/
│   ├── KpiCard.tsx          ← Tarjetas KPI animadas
│   ├── Charts.tsx           ← Gráficos Recharts
│   └── Header.tsx           ← Header ejecutivo
└── lib/
    └── prisma.ts            ← Conexión BD
```

## 🔗 Relación con Fruitend 2.0

Este dashboard lee datos directamente de la base de datos de Fruitend 2.0.
En desarrollo, apunta al mismo `dev.db` (SQLite).
En producción, ambos apuntan a la misma instancia PostgreSQL.
