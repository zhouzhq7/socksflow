"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Package,
  Play,
  Pause,
  X,
  Settings,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Plus,
  Clock,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useSubscriptionStore,
  Subscription,
  DeliveryPreferences,
} from "@/lib/store/subscriptionStore";

// 状态标签配置
const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }
> = {
  active: {
    label: "进行中",
    variant: "default",
    color: "bg-green-50 text-green-700 border-green-200",
  },
  paused: {
    label: "已暂停",
    variant: "secondary",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  cancelled: {
    label: "已取消",
    variant: "destructive",
    color: "bg-gray-50 text-gray-700 border-gray-200",
  },
  expired: {
    label: "已过期",
    variant: "outline",
    color: "bg-gray-50 text-gray-700 border-gray-200",
  },
};

// 频率选项
const frequencyOptions = [
  { value: "1", label: "每月配送" },
  { value: "2", label: "双月配送" },
  { value: "3", label: "季度配送" },
];

// 配送频率映射
const frequencyMap: Record<string, number> = {
  monthly: 1,
  bimonthly: 2,
  quarterly: 3,
};

// 订阅方案配置
const planConfigs = [
  { code: "basic", name: "基础盒", price: 29, pairs: 2, description: "每月2双基础棉袜" },
  { code: "standard", name: "标准盒", price: 49, pairs: 3, description: "每月3双精选袜子组合" },
  { code: "premium", name: "高级盒", price: 89, pairs: 5, description: "每月5双高端袜子组合" },
];

export default function SubscriptionsPage() {
  const searchParams = useSearchParams();
  const subscriptionId = searchParams.get("id");
  const createParam = searchParams.get("create");
  const planParam = searchParams.get("plan");
  
  const {
    subscriptions,
    currentSubscription,
    loading,
    fetchSubscriptions,
    fetchSubscription,
    createSubscription,
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
    updatePreferences,
    clearCurrentSubscription,
  } = useSubscriptionStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(0);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "pause" | "resume" | "cancel";
    subscription: Subscription | null;
  }>({ type: "pause", subscription: null });

  // 偏好设置表单状态
  const [preferences, setPreferences] = useState<DeliveryPreferences>({});
  
  // 创建订阅表单状态
  const [createPreferences, setCreatePreferences] = useState<DeliveryPreferences>({
    frequency: "monthly",
    size: "M",
  });

  // 加载订阅列表 - 延迟执行等待 hydration 和认证就绪
  useEffect(() => {
    const timer = setTimeout(() => {
      // 检查是否有 token
      const token = localStorage.getItem("access_token");
      if (token) {
        fetchSubscriptions();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchSubscriptions]);

  // 如果有id参数，展开对应的订阅
  useEffect(() => {
    if (subscriptionId) {
      setExpandedId(subscriptionId);
      fetchSubscription(subscriptionId);
    }
  }, [subscriptionId, fetchSubscription]);

  // 如果有create参数，打开创建弹窗
  useEffect(() => {
    if (createParam === "true") {
      const planIdx = planParam ? parseInt(planParam, 10) : 0;
      if (!isNaN(planIdx) && planIdx >= 0 && planIdx < planConfigs.length) {
        setSelectedPlan(planIdx);
      }
      setCreateOpen(true);
    }
  }, [createParam, planParam]);

  // 展开/折叠订阅详情
  const toggleExpand = async (subscription: Subscription) => {
    if (expandedId === subscription.id) {
      setExpandedId(null);
      clearCurrentSubscription();
    } else {
      setExpandedId(subscription.id);
      await fetchSubscription(subscription.id);
    }
  };

  // 打开偏好设置弹窗
  const openPreferences = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setPreferences(subscription.preferences || {});
    setPreferencesOpen(true);
  };

  // 保存偏好设置
  const savePreferences = async () => {
    if (selectedSubscription) {
      await updatePreferences(selectedSubscription.id, preferences);
      setPreferencesOpen(false);
      setSelectedSubscription(null);
    }
  };

  // 处理暂停/恢复/取消操作
  const handleAction = async () => {
    if (!confirmAction.subscription) return;

    const { type, subscription } = confirmAction;
    try {
      if (type === "pause") {
        await pauseSubscription(subscription.id);
      } else if (type === "resume") {
        await resumeSubscription(subscription.id);
      } else if (type === "cancel") {
        await cancelSubscription(subscription.id);
      }
    } catch (error) {
      console.error("操作失败:", error);
    } finally {
      setConfirmAction({ type: "pause", subscription: null });
    }
  };

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("zh-CN", {
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

  // 创建订阅
  const handleCreateSubscription = async () => {
    const plan = planConfigs[selectedPlan];
    // 解析频率值
    const freqValue = createPreferences.frequency || "monthly";
    const frequency = frequencyMap[freqValue] || parseInt(freqValue) || 1;
    
    // 构建后端需要的数据格式
    const subscriptionData = {
      plan_code: plan.code,
      delivery_frequency: frequency,
      shipping_address: {
        name: "默认地址",
        phone: "13800000000",
        address: "待完善详细地址",
        city: "北京市",
        province: "北京市",
        district: "朝阳区",
        zip_code: "100000",
      },
      style_preferences: {
        size: createPreferences.size,
        note: createPreferences.note,
      },
      auto_renew: true,
      payment_method: "alipay",
    };
    
    await createSubscription(subscriptionData.plan_code, subscriptionData);
    setCreateOpen(false);
    setCreatePreferences({ frequency: "monthly", size: "M" });
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900">订阅管理</h1>
        <p className="text-slate-500">管理您的 SockFlow 订阅方案</p>
      </div>

      {/* 订阅列表 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="mt-2 h-4 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : subscriptions.length > 0 ? (
        <div className="space-y-4">
          {subscriptions.map((subscription) => {
            const isExpanded = expandedId === subscription.id;
            const status = statusConfig[subscription.status];

            return (
              <Card key={subscription.id} className={cn("overflow-hidden", isExpanded && "ring-2 ring-amber-100")}>
                {/* 订阅基本信息 */}
                <CardHeader className="cursor-pointer pb-4" onClick={() => toggleExpand(subscription)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50">
                        <Package className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{subscription.planName}</CardTitle>
                        <CardDescription className="mt-1">
                          创建于 {formatDate(subscription.createdAt)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={status?.variant || "default"}
                        className={cn("border", status?.color)}
                      >
                        {status?.label || subscription.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* 展开详情 */}
                {isExpanded && (
                  <CardContent className="border-t bg-slate-50/50 px-6 py-4">
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* 订阅信息 */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-slate-900">订阅信息</h4>
                        <div className="grid gap-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-slate-500" />
                            <span className="text-slate-600">订阅费用:</span>
                            <span className="font-medium">
                              {formatPrice(subscription.price, subscription.currency)}/月
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            <span className="text-slate-600">当前周期:</span>
                            <span className="font-medium">
                              {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                            </span>
                          </div>
                          {subscription.nextDeliveryDate && (
                            <div className="flex items-center gap-2 text-sm">
                              <Sparkles className="h-4 w-4 text-slate-500" />
                              <span className="text-slate-600">下次配送:</span>
                              <span className="font-medium text-amber-600">
                                {formatDate(subscription.nextDeliveryDate)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 配送偏好 */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-slate-900">配送偏好</h4>
                        <div className="grid gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">配送频率:</span>
                            <span className="font-medium">
                              {subscription.preferences?.frequency === "monthly" && "每月配送"}
                              {subscription.preferences?.frequency === "bimonthly" && "双月配送"}
                              {subscription.preferences?.frequency === "quarterly" && "季度配送"}
                              {!subscription.preferences?.frequency && "默认"}
                            </span>
                          </div>
                          {subscription.preferences?.size && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">尺码:</span>
                              <span className="font-medium">{subscription.preferences.size}</span>
                            </div>
                          )}
                          {subscription.preferences?.style && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">风格偏好:</span>
                              <span className="font-medium">{subscription.preferences.style.join(", ")}</span>
                            </div>
                          )}
                          {subscription.preferences?.note && (
                            <div className="mt-2 rounded bg-white p-2 text-xs text-slate-600">
                              备注: {subscription.preferences.note}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="mt-6 flex flex-wrap gap-2">
                      {subscription.status === "active" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPreferences(subscription)}
                          >
                            <Settings className="mr-1 h-4 w-4" />
                            修改偏好
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setConfirmAction({ type: "pause", subscription })
                            }
                          >
                            <Pause className="mr-1 h-4 w-4" />
                            暂停订阅
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              setConfirmAction({ type: "cancel", subscription })
                            }
                          >
                            <X className="mr-1 h-4 w-4" />
                            取消订阅
                          </Button>
                        </>
                      )}
                      {subscription.status === "paused" && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700"
                            onClick={() =>
                              setConfirmAction({ type: "resume", subscription })
                            }
                          >
                            <Play className="mr-1 h-4 w-4" />
                            恢复订阅
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              setConfirmAction({ type: "cancel", subscription })
                            }
                          >
                            <X className="mr-1 h-4 w-4" />
                            取消订阅
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Package className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">暂无订阅</h3>
            <p className="mb-6 max-w-md text-center text-sm text-slate-500">
              您还没有创建任何订阅方案。创建订阅后，您将每月收到精心挑选的袜子配送。
            </p>
            <Button 
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              创建订阅
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 创建订阅弹窗 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>创建新订阅</DialogTitle>
            <DialogDescription>
              选择适合您的订阅方案，开始享受优质袜子配送服务
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* 方案选择 */}
            <div className="grid gap-3">
              <Label>选择方案</Label>
              <div className="grid grid-cols-3 gap-3">
                {planConfigs.map((plan, idx) => (
                  <button
                    key={plan.code}
                    onClick={() => setSelectedPlan(idx)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedPlan === idx
                        ? "border-amber-500 bg-amber-50"
                        : "border-slate-200 hover:border-amber-300"
                    }`}
                  >
                    <div className="font-bold text-slate-900">{plan.name}</div>
                    <div className="text-amber-600 font-bold">¥{plan.price}/月</div>
                    <div className="text-xs text-slate-500 mt-1">{plan.pairs}双/月</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 选中的方案详情 */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="font-medium text-slate-900 mb-1">
                {planConfigs[selectedPlan].name}
              </div>
              <p className="text-sm text-slate-600">
                {planConfigs[selectedPlan].description}
              </p>
            </div>

            {/* 配送频率 */}
            <div className="grid gap-2">
              <Label htmlFor="create-frequency">配送频率</Label>
              <Select
                value={createPreferences.frequency || "monthly"}
                onValueChange={(value) =>
                  setCreatePreferences({ ...createPreferences, frequency: value as DeliveryPreferences["frequency"] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择配送频率" />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 尺码 */}
            <div className="grid gap-2">
              <Label htmlFor="create-size">默认尺码</Label>
              <Select
                value={createPreferences.size || "M"}
                onValueChange={(value) => setCreatePreferences({ ...createPreferences, size: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择尺码" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S">S (35-37)</SelectItem>
                  <SelectItem value="M">M (38-40)</SelectItem>
                  <SelectItem value="L">L (41-43)</SelectItem>
                  <SelectItem value="XL">XL (44-46)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 备注 */}
            <div className="grid gap-2">
              <Label htmlFor="create-note">偏好备注（可选）</Label>
              <Textarea
                id="create-note"
                placeholder="例如：喜欢运动风格、需要黑色商务款等..."
                value={createPreferences.note || ""}
                onChange={(e) => setCreatePreferences({ ...createPreferences, note: e.target.value })}
                rows={2}
              />
            </div>

            {/* 费用总结 */}
            <div className="flex items-center justify-between py-3 border-t">
              <span className="text-slate-600">每月费用</span>
              <span className="text-xl font-bold text-amber-600">
                ¥{planConfigs[selectedPlan].price}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleCreateSubscription} 
              className="bg-amber-600 hover:bg-amber-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  创建中...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  确认创建
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 偏好设置弹窗 */}
      <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>修改配送偏好</DialogTitle>
            <DialogDescription>
              更新您的 {selectedSubscription?.planName} 配送偏好设置
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="frequency">配送频率</Label>
              <Select
                value={preferences.frequency || "monthly"}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, frequency: value as DeliveryPreferences["frequency"] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择配送频率" />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="size">尺码</Label>
              <Select
                value={preferences.size || ""}
                onValueChange={(value) => setPreferences({ ...preferences, size: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择尺码" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S">S (35-37)</SelectItem>
                  <SelectItem value="M">M (38-40)</SelectItem>
                  <SelectItem value="L">L (41-43)</SelectItem>
                  <SelectItem value="XL">XL (44-46)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">备注说明</Label>
              <Textarea
                id="note"
                placeholder="请输入您的特殊需求或偏好..."
                value={preferences.note || ""}
                onChange={(e) => setPreferences({ ...preferences, note: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreferencesOpen(false)}>
              取消
            </Button>
            <Button onClick={savePreferences} className="bg-indigo-600 hover:bg-indigo-700">
              保存设置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 确认操作弹窗 */}
      <AlertDialog
        open={!!confirmAction.subscription}
        onOpenChange={() => setConfirmAction({ type: "pause", subscription: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction.type === "pause" && "确认暂停订阅？"}
              {confirmAction.type === "resume" && "确认恢复订阅？"}
              {confirmAction.type === "cancel" && "确认取消订阅？"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction.type === "pause" &&
                "暂停后，您将不会收到新的配送，但订阅仍然有效。您可以随时恢复。"}
              {confirmAction.type === "resume" &&
                "恢复后，您的订阅将重新开始正常配送。"}
              {confirmAction.type === "cancel" &&
                "取消后，您的订阅将在当前周期结束后终止。此操作不可撤销。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={cn(
                confirmAction.type === "cancel"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              )}
            >
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
