"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Bell,
  Moon,
  Shield,
  Mail,
  Smartphone,
  Save,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    // 通知设置
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    marketingEmails: false,
    
    // 订阅提醒
    deliveryReminders: true,
    paymentReminders: true,
    renewalReminders: true,
    
    // 隐私设置
    profileVisible: false,
    shareUsageData: true,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // 模拟保存
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
    
    toast({
      title: "设置已保存",
      description: "您的偏好设置已更新",
    });
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">个人设置</h1>
        <p className="text-slate-500 mt-1">管理您的账户偏好和通知设置</p>
      </div>

      {/* 通知设置 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Bell className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle>通知设置</CardTitle>
              <CardDescription>选择您希望接收的通知类型</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 邮件通知 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-slate-400" />
              <div>
                <Label htmlFor="email-notifications" className="font-medium">
                  邮件通知
                </Label>
                <p className="text-sm text-slate-500">接收订单和订阅相关的邮件</p>
              </div>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.emailNotifications}
              onCheckedChange={() => handleToggle("emailNotifications")}
            />
          </div>

          <Separator />

          {/* 短信通知 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-slate-400" />
              <div>
                <Label htmlFor="sms-notifications" className="font-medium">
                  短信通知
                </Label>
                <p className="text-sm text-slate-500">接收配送提醒和验证码</p>
              </div>
            </div>
            <Switch
              id="sms-notifications"
              checked={settings.smsNotifications}
              onCheckedChange={() => handleToggle("smsNotifications")}
            />
          </div>

          <Separator />

          {/* 营销邮件 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-slate-400" />
              <div>
                <Label htmlFor="marketing-emails" className="font-medium">
                  营销邮件
                </Label>
                <p className="text-sm text-slate-500">接收优惠活动和新品推荐</p>
              </div>
            </div>
            <Switch
              id="marketing-emails"
              checked={settings.marketingEmails}
              onCheckedChange={() => handleToggle("marketingEmails")}
            />
          </div>
        </CardContent>
      </Card>

      {/* 订阅提醒 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Settings className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle>订阅提醒</CardTitle>
              <CardDescription>管理您的订阅相关提醒</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 配送提醒 */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="delivery-reminders" className="font-medium">
                配送提醒
              </Label>
              <p className="text-sm text-slate-500">袜子发货前通知您</p>
            </div>
            <Switch
              id="delivery-reminders"
              checked={settings.deliveryReminders}
              onCheckedChange={() => handleToggle("deliveryReminders")}
            />
          </div>

          <Separator />

          {/* 续费提醒 */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="renewal-reminders" className="font-medium">
                续费提醒
              </Label>
              <p className="text-sm text-slate-500">订阅到期前提醒您续费</p>
            </div>
            <Switch
              id="renewal-reminders"
              checked={settings.renewalReminders}
              onCheckedChange={() => handleToggle("renewalReminders")}
            />
          </div>

          <Separator />

          {/* 付款提醒 */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="payment-reminders" className="font-medium">
                付款提醒
              </Label>
              <p className="text-sm text-slate-500">自动扣费前通知您</p>
            </div>
            <Switch
              id="payment-reminders"
              checked={settings.paymentReminders}
              onCheckedChange={() => handleToggle("paymentReminders")}
            />
          </div>
        </CardContent>
      </Card>

      {/* 隐私与安全 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle>隐私与安全</CardTitle>
              <CardDescription>管理您的隐私设置</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 个人资料可见 */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="profile-visible" className="font-medium">
                公开个人资料
              </Label>
              <p className="text-sm text-slate-500">允许其他用户查看您的资料</p>
            </div>
            <Switch
              id="profile-visible"
              checked={settings.profileVisible}
              onCheckedChange={() => handleToggle("profileVisible")}
            />
          </div>

          <Separator />

          {/* 共享使用数据 */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="share-usage" className="font-medium">
                共享使用数据
              </Label>
              <p className="text-sm text-slate-500">帮助我们改进服务</p>
            </div>
            <Switch
              id="share-usage"
              checked={settings.shareUsageData}
              onCheckedChange={() => handleToggle("shareUsageData")}
            />
          </div>

          <Separator />

          {/* 修改密码链接 */}
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-slate-400" />
              <span className="font-medium">修改密码</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>
        </CardContent>
      </Card>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-amber-600 hover:bg-amber-700"
        >
          {isSaving ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              保存中...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              保存设置
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
