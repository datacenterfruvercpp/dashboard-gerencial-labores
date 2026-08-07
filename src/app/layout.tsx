import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard Gerencial de Labores | CPP S.A.',
  description: 'Panel ejecutivo dinámico — Corporación Piñales de Pital',
  openGraph: {
    type: 'website',
    url: 'https://reportedelabores.datacenterpc.com',
    title: 'Dashboard Gerencial de Labores | CPP S.A.',
    description: 'Panel ejecutivo dinámico — Corporación Piñales de Pital',
    siteName: 'Dashboard de Labores CPP',
    images: [
      {
        url: 'https://reportedelabores.datacenterpc.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Dashboard Gerencial de Labores CPP S.A.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dashboard Gerencial de Labores | CPP S.A.',
    description: 'Panel ejecutivo dinámico — Corporación Piñales de Pital',
    images: ['https://reportedelabores.datacenterpc.com/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
