"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  LogOut,
  Menu,
  Footprints,
  ChevronRight,
  User,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

// 侧边栏导航项
const navItems = [
  {
    title: "概览",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "订阅管理",
    href: "/dashboard/subscriptions",
    icon: Package,
  },
  {
    title: "订单历史",
    href: "/dashboard/orders",
    icon: ShoppingBag,
  },
  {
    title: "个人设置",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "个人资料",
    href: "/dashboard/profile",
    icon: UserCircle,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, fetchUser } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // 处理 hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // 初始化时获取用户信息（只在客户端执行一次）
  useEffect(() => {
    if (!isHydrated) return;
    
    // 延迟执行，避免 hydration 不匹配
    const timer = setTimeout(() => {
      if (!user && !isAuthenticated) {
        fetchUser();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isHydrated]);

  // 处理登出
  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  // 获取用户姓名首字母
  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name.charAt(0).toUpperCase();
  };

  // 渲染侧边栏导航
  const renderNavItems = (isMobile = false) => (
    <nav className={cn("flex flex-col gap-1", isMobile ? "px-2" : "px-3")}>
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => isMobile && setIsMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              isActive
                ? "bg-amber-50 text-amber-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              isMobile && "py-3"
            )}
          >
            <Icon className={cn("h-5 w-5", isActive ? "text-amber-600" : "text-slate-500")} />
            <span>{item.title}</span>
            {isActive && !isMobile && (
              <ChevronRight className="ml-auto h-4 w-4 text-amber-600" />
            )}
          </Link>
        );
      })}
    </nav>
  );

  // 在 hydration 完成前显示加载状态
  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
          <p className="text-sm text-slate-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* 桌面端侧边栏 */}
      <aside className="hidden w-64 flex-col border-r bg-white lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600">
              <Footprints className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">SockFlow</span>
          </Link>
        </div>

        {/* 导航 */}
        <div className="flex-1 overflow-auto py-4">
          {renderNavItems()}
        </div>

        {/* 底部 - 用户信息 */}
        <div className="border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-amber-100 text-amber-600">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium text-slate-900">
                    {user?.name || "用户"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {user?.email || ""}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>我的账号</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  个人设置
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* 移动端头部 */}
      <div className="flex flex-1 flex-col lg:hidden">
        <header className="flex h-14 items-center justify-between border-b bg-white px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600">
              <Footprints className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">SockFlow</span>
          </Link>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="flex h-14 items-center border-b px-4">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600">
                      <Footprints className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-slate-900">SockFlow</span>
                  </Link>
                </div>

                {/* 导航 */}
                <div className="flex-1 overflow-auto py-4">
                  {renderNavItems(true)}
                </div>

                {/* 用户信息 */}
                <div className="border-t p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-amber-100 text-amber-600">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {user?.name || "用户"}
                      </p>
                      <p className="text-xs text-slate-500">{user?.email || ""}</p>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-red-600"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* 移动端内容区域 */}
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>

      {/* 桌面端内容区域 */}
      <main className="hidden flex-1 overflow-auto p-8 lg:block">{children}</main>
    </div>
  );
}
