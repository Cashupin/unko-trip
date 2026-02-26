import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Rutas públicas que no necesitan autenticación
const publicRoutes = [
  '/',
  '/auth/signin',
  '/auth/error',
];

export async function middleware(request: any) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Redirect to signin if not authenticated and trying to access protected route
  if (!session?.user) {
    const signinUrl = new URL('/auth/signin', request.url);
    signinUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signinUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
