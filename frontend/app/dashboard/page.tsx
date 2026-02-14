"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Calendar,
  Clock,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/store/authStore";
import { useSubscriptionStore, Subscription } from "@/lib/store/subscriptionStore";
import { orderApi } from "@/lib/api";
import { cn } from "@/lib/utils";

// 订单类型
interface Order {
  id: string;
  orderNo: string;
  status: "pending" | "paid" | "shipped" | "completed" | "cancelled";
  totalAmount: number;
  createdAt: string;
}

// 状态标签映射
const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  active: { label: "进行中", variant: "default" as const, className: "bg-green-100 text-green-700 hover:bg-green-100" },
  paused: { label: "已暂停", variant: "secondary" as const, className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" },
  cancelled: { label: "已取消", variant: "destructive" as const },
  expired: { label: "已过期", variant: "outline" as const },
};

const orderStatusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "待支付", variant: "secondary" as const },
  paid: { label: "已支付", variant: "default" as const },
  shipped: { label: "已发货", variant: "default" as const },
  completed: { label: "已完成", variant: "outline" as const },
  cancelled: { label: "已取消", variant: "destructive" as const },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { subscriptions, loading: subscriptionLoading, fetchSubscriptions, getActiveSubscription } = useSubscriptionStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const activeSubscription = getActiveSubscription();

  // 加载数据 - 确保只在客户端执行且认证就绪
  useEffect(() => {
    // 等待 hydration 和认证状态恢复
    const timer = setTimeout(() => {
      const loadData = async () => {
        // 检查是否有 token
        const token = localStorage.getItem("access_token");
        if (!token) {
          console.log("未找到 token，跳过数据加载");
          setOrdersLoading(false);
          return;
        }

        try {
          await fetchSubscriptions();
          
          // 获取最近订单
          const response = await orderApi.getOrders({ limit: 3 });
          setOrders(response.data?.slice(0, 3) || []);
        } catch (error) {
          console.error("加载数据失败:", error);
        } finally {
          setOrdersLoading(false);
        }
      };
      loadData();
    }, 300); // 增加延迟确保 token 已恢复

    return () => clearTimeout(timer);
  }, [fetchSubscriptions]);

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 格式化价格
  const formatPrice = (price: number, currency: string = "CNY") => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  return (
    <div className="space-y-8">
      {/* 欢迎区域 */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900">
          欢迎回来，{user?.name || "用户"}！
        </h1>
        <p className="text-slate-500">
          这是您的 SockFlow 控制中心，在这里管理您的订阅和订单。
        </p>
      </div>

      {/* 订阅状态卡片 */}
      {subscriptionLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ) : activeSubscription ? (
        <Card className="border-amber-100 bg-gradient-to-r from-amber-50/50 to-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-lg">当前订阅</CardTitle>
              </div>
              <Badge
                variant={statusLabels[activeSubscription.status]?.variant || "default"}
                className={cn(statusLabels[activeSubscription.status]?.className)}
              >
                {statusLabels[activeSubscription.status]?.label || activeSubscription.status}
              </Badge>
            </div>
            <CardDescription>{activeSubscription.planName}</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">到期时间</p>
                  <p className="text-sm font-medium">
                    {formatDate(activeSubscription.currentPeriodEnd)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">下次配送</p>
                  <p className="text-sm font-medium">
                    {formatDate(activeSubscription.nextDeliveryDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">订阅费用</p>
                  <p className="text-sm font-medium">
                    {formatPrice(activeSubscription.price, activeSubscription.currency)}/月
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/subscriptions")}
            >
              管理订阅
            </Button>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => router.push(`/dashboard/subscriptions?id=${activeSubscription.id}`)}
            >
              查看详情
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Package className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">暂无活跃订阅</h3>
            <p className="mb-4 text-center text-sm text-slate-500">
              您还没有任何活跃的订阅方案，开始订阅享受优质袜子配送服务吧！
            </p>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="mr-2 h-4 w-4" />
              创建订阅
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 快捷操作和最近订单 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 快捷操作 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">快捷操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => router.push("/dashboard/subscriptions")}
            >
              <Package className="h-4 w-4" />
              管理订阅
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => router.push("/dashboard/orders")}
            >
              <ShoppingBag className="h-4 w-4" />
              查看订单
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => router.push("/dashboard/settings")}
            >
              <Sparkles className="h-4 w-4" />
              个人设置
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* 最近订单 */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">最近订单</CardTitle>
              <CardDescription>您最近的3个订单</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/orders")}
            >
              查看全部
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                        <ShoppingBag className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          订单 {order.orderNo}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {formatPrice(order.totalAmount)}
                      </span>
                      <Badge
                        variant={orderStatusLabels[order.status]?.variant || "default"}
                        className="text-xs"
                      >
                        {orderStatusLabels[order.status]?.label || order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">暂无订单记录</p>
                <p className="text-xs text-slate-400">您的订单将显示在这里</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
