import { NextRequest, NextResponse } from 'next/server';

const AUTH_USER = process.env.AUTH_USER || 'Willfire80';
const AUTH_PASS = process.env.AUTH_PASS || 'Abisai@130680@';

export function middleware(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (authHeader) {
    const encoded = authHeader.split(' ')[1];
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const [user, pass] = decoded.split(':');
    if (user === AUTH_USER && pass === AUTH_PASS) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Acceso no autorizado. Ingresa tu usuario y contraseña.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Dashboard Gerencial de Labores - Acceso Restringido"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
