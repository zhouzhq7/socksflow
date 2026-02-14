"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/store/authStore";

export default function AuthNav() {
  const router = useRouter();
  const { user, isAuthenticated, logout, fetchUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // 避免 hydration 不匹配，只在客户端获取用户信息
  useEffect(() => {
    setMounted(true);
    // 如果已认证但没有用户信息，获取用户信息
    if (!user && isAuthenticated) {
      fetchUser();
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // 获取用户名的首字母作为头像
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // 服务端渲染或 hydration 期间显示占位符
  if (!mounted) {
    return (
      <div className="flex items-center gap-4">
        <div className="w-20 h-9 bg-slate-200 rounded-full animate-pulse" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-slate-100">
            <Avatar className="h-9 w-9 bg-amber-100">
              <AvatarFallback className="bg-amber-500 text-white text-sm font-medium">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none text-slate-900">{user.name}</p>
              <p className="text-xs leading-none text-slate-500">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="cursor-pointer">
              <User className="mr-2 h-4 w-4 text-slate-500" />
              用户中心
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4 text-slate-500" />
              设置
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/auth/login"
        className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
      >
        登录
      </Link>
      <Link href="/auth/register">
        <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-5">
          注册
        </Button>
      </Link>
    </div>
  );
}
