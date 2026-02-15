"use client";

import { useEffect, useState } from "react";
import {
  ShoppingBag,
  AlertCircle,
  Eye,
  CreditCard,
  X,
  Truck,
  Package,
  MapPin,
  Calendar,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { orderApi, paymentApi } from "@/lib/api";
import { toast } from "sonner";

// 订单类型
interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Address {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
}

interface Logistics {
  company: string;
  trackingNo: string;
  status: string;
  updatedAt: string;
}

interface Order {
  id: string;
  orderNo: string;
  status: "pending" | "paid" | "shipped" | "completed" | "cancelled";
  totalAmount: number;
  currency: string;
  items: OrderItem[];
  address: Address;
  logistics?: Logistics;
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
  completedAt?: string;
}

// 状态配置
const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  pending: {
    label: "待支付",
    variant: "secondary",
    icon: <Clock className="h-4 w-4" />,
  },
  paid: {
    label: "已支付",
    variant: "default",
    icon: <CreditCard className="h-4 w-4" />,
  },
  shipped: {
    label: "已发货",
    variant: "default",
    icon: <Truck className="h-4 w-4" />,
  },
  completed: {
    label: "已完成",
    variant: "outline",
    icon: <Package className="h-4 w-4" />,
  },
  cancelled: {
    label: "已取消",
    variant: "destructive",
    icon: <X className="h-4 w-4" />,
  },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);

  // 加载订单列表
  const fetchOrders = async () => {
    try {
      const response = await orderApi.getOrders();
      setOrders(response.data || []);
    } catch (error) {
      console.error("加载订单失败:", error);
    }
  };

  // 初始加载 - 延迟执行等待 hydration 和认证就绪
  useEffect(() => {
    const timer = setTimeout(() => {
      // 检查是否有 token
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }

      const loadOrders = async () => {
        try {
          await fetchOrders();
        } finally {
          setLoading(false);
        }
      };
      loadOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // 查看订单详情
  const viewOrderDetail = async (order: Order) => {
    try {
      const response = await orderApi.getOrder(order.id);
      setSelectedOrder(response.data);
      setDetailOpen(true);
    } catch (error) {
      console.error("获取订单详情失败:", error);
      // 如果没有API，使用本地数据
      setSelectedOrder(order);
      setDetailOpen(true);
    }
  };

  // 处理支付
  const handlePay = async (orderId: string) => {
    try {
      setPayingOrderId(orderId);
      const response = await paymentApi.createPayment({
        order_id: orderId,
        payment_method: "alipay",
      });
      
      // If Alipay SDK returns a form, submit it
      if (response.data?.payment_form) {
        const div = document.createElement("div");
        div.innerHTML = response.data.payment_form;
        document.body.appendChild(div);
        const form = div.querySelector("form");
        if (form) form.submit();
      } else if (response.data?.pay_url) {
        window.open(response.data.pay_url, "_blank");
      } else {
        toast.success("支付创建成功，请查看支付页面");
        fetchOrders(); // Refresh orders
      }
    } catch (error: any) {
      console.error("支付失败:", error);
      toast.error(error?.response?.data?.detail || "支付失败，请重试");
    } finally {
      setPayingOrderId(null);
    }
  };

  // 处理取消订单
  const handleCancel = async () => {
    if (!cancellingId) return;
    try {
      await orderApi.cancelOrder(cancellingId);
      // 更新本地状态
      setOrders(orders.map(o => o.id === cancellingId ? { ...o, status: "cancelled" } : o));
      setCancelDialogOpen(false);
      setCancellingId(null);
    } catch (error) {
      console.error("取消订单失败:", error);
    }
  };

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900">订单历史</h1>
        <p className="text-slate-500">查看和管理您的所有订单</p>
      </div>

      {/* 订单列表 */}
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
      ) : orders.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单号</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const status = statusConfig[order.status];
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNo}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>{formatPrice(order.totalAmount, order.currency)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={status?.variant || "default"}
                          className="gap-1"
                        >
                          {status?.icon}
                          {status?.label || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {order.status === "pending" && (
                            <Button
                              size="sm"
                              className="bg-amber-600 hover:bg-amber-700"
                              onClick={() => handlePay(order.id)}
                              disabled={payingOrderId === order.id}
                            >
                              <CreditCard className="mr-1 h-4 w-4" />
                              {payingOrderId === order.id ? "处理中..." : "去支付"}
                            </Button>
                          )}
                          {order.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCancellingId(order.id);
                                setCancelDialogOpen(true);
                              }}
                            >
                              <X className="mr-1 h-4 w-4" />
                              取消
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewOrderDetail(order)}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            详情
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <ShoppingBag className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">暂无订单</h3>
            <p className="max-w-md text-center text-sm text-slate-500">
              您还没有任何订单记录。开始订阅后，您的订单将显示在这里。
            </p>
          </CardContent>
        </Card>
      )}

      {/* 订单详情弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>订单详情</DialogTitle>
            <DialogDescription>
              订单号: {selectedOrder?.orderNo}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* 订单状态 */}
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  {statusConfig[selectedOrder.status]?.icon}
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {statusConfig[selectedOrder.status]?.label}
                    </p>
                    <p className="text-xs text-slate-500">
                      创建于 {formatDate(selectedOrder.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">
                    {formatPrice(selectedOrder.totalAmount, selectedOrder.currency)}
                  </p>
                </div>
              </div>

              {/* 商品列表 */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-slate-900">商品列表</h4>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>商品</TableHead>
                        <TableHead className="text-right">单价</TableHead>
                        <TableHead className="text-right">数量</TableHead>
                        <TableHead className="text-right">小计</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="text-right">
                            {formatPrice(item.unitPrice, selectedOrder.currency)}
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {formatPrice(item.totalPrice, selectedOrder.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* 配送地址 */}
              {selectedOrder.address && (
                <div>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <MapPin className="h-4 w-4" />
                    配送地址
                  </h4>
                  <div className="rounded-lg border p-4">
                    <p className="font-medium text-slate-900">
                      {selectedOrder.address.name} {selectedOrder.address.phone}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedOrder.address.province} {selectedOrder.address.city}{" "}
                      {selectedOrder.address.district}
                    </p>
                    <p className="text-sm text-slate-600">
                      {selectedOrder.address.detail}
                    </p>
                  </div>
                </div>
              )}

              {/* 物流信息 */}
              {selectedOrder.logistics && (
                <div>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Truck className="h-4 w-4" />
                    物流信息
                  </h4>
                  <div className="rounded-lg border p-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">快递公司:</span>
                      <span className="text-sm font-medium">{selectedOrder.logistics.company}</span>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <span className="text-sm text-slate-600">运单号:</span>
                      <span className="text-sm font-medium">{selectedOrder.logistics.trackingNo}</span>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <span className="text-sm text-slate-600">物流状态:</span>
                      <span className="text-sm font-medium">{selectedOrder.logistics.status}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 时间线 */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Calendar className="h-4 w-4" />
                  订单时间线
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">创建订单:</span>
                    <span>{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  {selectedOrder.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">支付完成:</span>
                      <span>{formatDate(selectedOrder.paidAt)}</span>
                    </div>
                  )}
                  {selectedOrder.shippedAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">发货时间:</span>
                      <span>{formatDate(selectedOrder.shippedAt)}</span>
                    </div>
                  )}
                  {selectedOrder.completedAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">完成时间:</span>
                      <span>{formatDate(selectedOrder.completedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 取消订单确认弹窗 */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认取消订单？</AlertDialogTitle>
            <AlertDialogDescription>
              取消后，该订单将被关闭。如果已支付，款项将原路退回。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancellingId(null)}>
              不取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-red-600 hover:bg-red-700"
            >
              确认取消
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
