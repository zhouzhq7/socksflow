import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "登录/注册 - SockFlow",
  description: "登录或注册 SockFlow 账号，开始您的智能袜子订阅服务",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {children}
    </div>
  );
}
