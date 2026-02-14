"use client";

import { useEffect, useState } from "react";
import { 
  MapPin, 
  Plus, 
  Pencil, 
  Trash2, 
  Star, 
  Home, 
  Briefcase,
  Check,
  X,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { addressApi, Address, AddressData } from "@/lib/api";
import { cn } from "@/lib/utils";

// 省份、城市、区县数据（简化版）
const PROVINCES = ["北京市", "上海市", "广东省", "浙江省", "江苏省", "四川省", "湖北省", "湖南省"];
const CITIES: Record<string, string[]> = {
  "北京市": ["北京市"],
  "上海市": ["上海市"],
  "广东省": ["广州市", "深圳市", "珠海市", "佛山市"],
  "浙江省": ["杭州市", "宁波市", "温州市"],
  "江苏省": ["南京市", "苏州市", "无锡市"],
  "四川省": ["成都市"],
  "湖北省": ["武汉市"],
  "湖南省": ["长沙市"],
};
const DISTRICTS: Record<string, string[]> = {
  "北京市": ["朝阳区", "海淀区", "东城区", "西城区", "丰台区"],
  "上海市": ["浦东新区", "黄浦区", "静安区", "徐汇区"],
  "广州市": ["天河区", "越秀区", "海珠区", "白云区"],
  "深圳市": ["南山区", "福田区", "罗湖区", "宝安区"],
  "杭州市": ["西湖区", "拱墅区", "上城区", "滨江区"],
};

// 地址标签
const ADDRESS_TAGS = [
  { value: "家", label: "家", icon: Home },
  { value: "公司", label: "公司", icon: Briefcase },
  { value: "其他", label: "其他", icon: MapPin },
];

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // 表单数据
  const [formData, setFormData] = useState<AddressData>({
    name: "",
    phone: "",
    province: "",
    city: "",
    district: "",
    address: "",
    zip_code: "",
    is_default: false,
    tag: "",
  });

  // 加载地址列表
  const loadAddresses = async () => {
    try {
      setLoading(true);
      const response = await addressApi.getAddresses();
      setAddresses(response.items);
      setError(null);
    } catch (err) {
      setError("加载地址失败");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  // 打开新建对话框
  const openCreateDialog = () => {
    setEditingAddress(null);
    setFormData({
      name: "",
      phone: "",
      province: "",
      city: "",
      district: "",
      address: "",
      zip_code: "",
      is_default: addresses.length === 0, // 第一个地址默认设为默认
      tag: "",
    });
    setIsDialogOpen(true);
  };

  // 打开编辑对话框
  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      name: address.name,
      phone: address.phone,
      province: address.province,
      city: address.city,
      district: address.district,
      address: address.address,
      zip_code: address.zip_code || "",
      is_default: address.is_default,
      tag: address.tag || "",
    });
    setIsDialogOpen(true);
  };

  // 保存地址
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingAddress) {
        await addressApi.updateAddress(editingAddress.id, formData);
      } else {
        await addressApi.createAddress(formData);
      }
      await loadAddresses();
      setIsDialogOpen(false);
    } catch (err) {
      setError(editingAddress ? "更新地址失败" : "创建地址失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 删除地址
  const handleDelete = async (id: number) => {
    try {
      await addressApi.deleteAddress(id);
      await loadAddresses();
      setDeleteConfirmId(null);
    } catch (err) {
      setError("删除地址失败");
    }
  };

  // 设置默认地址
  const handleSetDefault = async (id: number) => {
    try {
      await addressApi.setDefaultAddress(id);
      await loadAddresses();
    } catch (err) {
      setError("设置默认地址失败");
    }
  };

  // 获取标签图标
  const getTagIcon = (tag?: string) => {
    const tagConfig = ADDRESS_TAGS.find(t => t.value === tag);
    const Icon = tagConfig?.icon || MapPin;
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">地址管理</h1>
          <p className="text-slate-500">管理您的配送地址</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">地址管理</h1>
          <p className="text-slate-500">管理您的配送地址，方便订阅商品送达</p>
        </div>
        <Button 
          onClick={openCreateDialog}
          className="bg-amber-600 hover:bg-amber-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          新建地址
        </Button>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 地址列表 */}
      {addresses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <MapPin className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">暂无地址</h3>
            <p className="mb-4 text-center text-sm text-slate-500">
              您还没有添加任何配送地址，点击下方按钮添加
            </p>
            <Button 
              onClick={openCreateDialog}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              添加地址
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <Card 
              key={address.id} 
              className={cn(
                "relative transition-all",
                address.is_default && "ring-2 ring-amber-500 ring-offset-2"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                      {getTagIcon(address.tag)}
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {address.name}
                        {address.tag && (
                          <Badge variant="secondary" className="text-xs">
                            {address.tag}
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-slate-500">{address.phone}</p>
                    </div>
                  </div>
                  {address.is_default && (
                    <Badge className="bg-amber-500 text-white">
                      <Star className="mr-1 h-3 w-3 fill-current" />
                      默认
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-slate-700">
                  {address.province} {address.city} {address.district}
                </p>
                <p className="text-slate-600">{address.address}</p>
                {address.zip_code && (
                  <p className="text-sm text-slate-500 mt-1">
                    邮编：{address.zip_code}
                  </p>
                )}
              </CardContent>
              <Separator />
              <div className="flex items-center justify-between p-4">
                <div className="flex gap-2">
                  {!address.is_default && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(address.id)}
                    >
                      <Star className="mr-1 h-4 w-4" />
                      设为默认
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(address)}
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setDeleteConfirmId(address.id)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    删除
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 新建/编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "编辑地址" : "新建地址"}
            </DialogTitle>
            <DialogDescription>
              请填写完整的配送地址信息
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* 收货人信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">收货人姓名</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入姓名"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">手机号码</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="11位手机号"
                    className="mt-1"
                    maxLength={11}
                    required
                  />
                </div>
              </div>

              {/* 标签选择 */}
              <div>
                <Label>地址标签</Label>
                <div className="flex gap-2 mt-1">
                  {ADDRESS_TAGS.map((tag) => (
                    <Button
                      key={tag.value}
                      type="button"
                      variant={formData.tag === tag.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData({ ...formData, tag: tag.value })}
                      className={cn(
                        formData.tag === tag.value && "bg-amber-600 hover:bg-amber-700"
                      )}
                    >
                      <tag.icon className="mr-1 h-4 w-4" />
                      {tag.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 省市区选择 */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>省份</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(v) => setFormData({ ...formData, province: v, city: "", district: "" })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="选择省份" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>城市</Label>
                  <Select
                    value={formData.city}
                    onValueChange={(v) => setFormData({ ...formData, city: v, district: "" })}
                    disabled={!formData.province}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="选择城市" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.province && CITIES[formData.province]?.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>区县</Label>
                  <Select
                    value={formData.district}
                    onValueChange={(v) => setFormData({ ...formData, district: v })}
                    disabled={!formData.city}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="选择区县" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISTRICTS[formData.city]?.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                      {/* 当没有区县数据时，使用城市名作为唯一选项 */}
                      {(!DISTRICTS[formData.city] || DISTRICTS[formData.city].length === 0) && formData.city && (
                        <SelectItem value={formData.city}>{formData.city}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 详细地址 */}
              <div>
                <Label htmlFor="address">详细地址</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="街道、小区、门牌号"
                  className="mt-1"
                  required
                />
              </div>

              {/* 邮编 */}
              <div>
                <Label htmlFor="zip_code">邮政编码（选填）</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  placeholder="请输入邮编"
                  className="mt-1"
                  maxLength={6}
                />
              </div>

              {/* 默认地址 */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <Label htmlFor="is_default" className="cursor-pointer">
                  设为默认地址
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button 
                type="submit" 
                className="bg-amber-600 hover:bg-amber-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>{editingAddress ? "保存" : "创建"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这个地址吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              取消
            </Button>
            <Button 
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
