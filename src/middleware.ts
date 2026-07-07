import { NextResponse, type NextRequest } from "next/server";

// Primera línea de defensa: sin cookie de sesión no se entra a /admin.
// La verificación real (firma + rol admin) ocurre en el layout de admin
// con el Admin SDK, porque el middleware corre en Edge sin firebase-admin.
export function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/" && session) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*"],
};
