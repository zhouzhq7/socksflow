import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 需要认证的路由
const protectedRoutes = ["/dashboard"];

// 认证相关路由（已登录用户不应访问）
const authRoutes = ["/auth/login", "/auth/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 获取token（从cookie）
  const token = request.cookies.get("access_token")?.value;

  // 检查是否是受保护路由（包括所有子路由）
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // 检查是否是认证路由（包括所有子路由）
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // 未登录用户访问受保护路由，重定向到登录页
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 已登录用户访问认证路由，重定向到dashboard
  if (isAuthRoute && token) {
    // 检查是否有重定向参数
    const redirectTo = request.nextUrl.searchParams.get("redirect");
    if (redirectTo && redirectTo.startsWith("/")) {
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// 配置匹配规则
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了:
     * - api (API 路由)
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     * - 其他静态资源
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
