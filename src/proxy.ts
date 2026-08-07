import { NextRequest, NextResponse } from 'next/server';

const AUTH_USER = process.env.AUTH_USER || 'Willfire80';
const AUTH_PASS = process.env.AUTH_PASS || 'Abisai@130680@';

function checkAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) return false;
  const encoded = authHeader.split(' ')[1];
  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const [user, pass] = decoded.split(':');
  return user === AUTH_USER && pass === AUTH_PASS;
}

export function proxy(req: NextRequest) {
  if (checkAuth(req)) {
    return NextResponse.next();
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
