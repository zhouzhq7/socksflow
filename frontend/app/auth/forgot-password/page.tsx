"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("请输入邮箱地址");
      return;
    }
    
    setLoading(true);
    // 模拟发送重置邮件
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setSent(true);
    toast.success("重置邮件已发送，请检查邮箱");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/auth/login">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold">忘记密码</CardTitle>
          <CardDescription>
            输入您的邮箱地址，我们将发送密码重置链接
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">邮件已发送</h3>
              <p className="text-muted-foreground mb-4">
                请检查您的邮箱 {email}，点击邮件中的链接重置密码
              </p>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full">
                  返回登录
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱地址</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "发送中..." : "发送重置链接"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
