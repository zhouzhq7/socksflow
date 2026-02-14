"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  AlertCircle,
  Check,
  Ruler,
  Edit3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";

// 尺码档案类型
interface SizeProfile {
  id: string;
  name: string;
  sockSize: string;
  shoeSize?: string;
  notes?: string;
  isDefault: boolean;
}

export default function ProfilePage() {
  const { user, updateProfile, changePassword, isLoading } = useAuthStore();

  // 表单状态
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });

  // 密码修改状态
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // 保存状态
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // 尺码档案状态
  const [sizeProfiles, setSizeProfiles] = useState<SizeProfile[]>([
    {
      id: "1",
      name: "我的尺码",
      sockSize: "L",
      shoeSize: "42",
      notes: "喜欢宽松一点的袜子",
      isDefault: true,
    },
  ]);
  const [sizeDialogOpen, setSizeDialogOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<SizeProfile | null>(null);
  const [sizeFormData, setSizeFormData] = useState<Partial<SizeProfile>>({
    name: "",
    sockSize: "M",
    shoeSize: "",
    notes: "",
    isDefault: false,
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingSizeId, setDeletingSizeId] = useState<string | null>(null);

  // 获取用户姓名首字母
  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name.charAt(0).toUpperCase();
  };

  // 处理表单变更
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
    setSaveError("");
  };

  // 保存个人资料
  const handleSave = async () => {
    setSaveSuccess(false);
    setSaveError("");

    try {
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "保存失败");
    }
  };

  // 验证密码
  const validatePassword = () => {
    if (passwordData.newPassword.length < 6) {
      setPasswordError("新密码至少需要6个字符");
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("两次输入的密码不一致");
      return false;
    }
    setPasswordError("");
    return true;
  };

  // 修改密码
  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordDialogOpen(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "修改密码失败");
    }
  };

  // 打开尺码编辑弹窗
  const openSizeDialog = (profile?: SizeProfile) => {
    if (profile) {
      setEditingSize(profile);
      setSizeFormData({ ...profile });
    } else {
      setEditingSize(null);
      setSizeFormData({
        name: "",
        sockSize: "M",
        shoeSize: "",
        notes: "",
        isDefault: false,
      });
    }
    setSizeDialogOpen(true);
  };

  // 保存尺码档案
  const saveSizeProfile = () => {
    if (!sizeFormData.name) return;

    if (editingSize) {
      // 更新现有档案
      setSizeProfiles((prev) =>
        prev.map((p) =>
          p.id === editingSize.id
            ? ({ ...p, ...sizeFormData } as SizeProfile)
            : sizeFormData.isDefault
            ? { ...p, isDefault: false }
            : p
        )
      );
    } else {
      // 创建新档案
      const newProfile: SizeProfile = {
        id: Date.now().toString(),
        name: sizeFormData.name || "新档案",
        sockSize: sizeFormData.sockSize || "M",
        shoeSize: sizeFormData.shoeSize,
        notes: sizeFormData.notes,
        isDefault: sizeFormData.isDefault || false,
      };
      if (newProfile.isDefault) {
        setSizeProfiles((prev) =>
          [...prev.map((p) => ({ ...p, isDefault: false })), newProfile]
        );
      } else {
        setSizeProfiles((prev) => [...prev, newProfile]);
      }
    }
    setSizeDialogOpen(false);
  };

  // 删除尺码档案
  const deleteSizeProfile = () => {
    if (deletingSizeId) {
      setSizeProfiles((prev) => prev.filter((p) => p.id !== deletingSizeId));
      setDeleteConfirmOpen(false);
      setDeletingSizeId(null);
    }
  };

  // 设置默认尺码
  const setDefaultSize = (id: string) => {
    setSizeProfiles((prev) =>
      prev.map((p) => ({ ...p, isDefault: p.id === id }))
    );
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900">个人资料</h1>
        <p className="text-slate-500">管理您的个人信息和偏好设置</p>
      </div>

      {/* 成功提示 */}
      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-700">
          <Check className="h-5 w-5" />
          <span>保存成功！</span>
        </div>
      )}

      {/* 错误提示 */}
      {saveError && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>{saveError}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧 - 头像和基本信息 */}
        <div className="space-y-6 lg:col-span-1">
          {/* 头像卡片 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="bg-amber-100 text-amber-600 text-2xl">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {user?.name || "用户"}
                </h3>
                <p className="text-sm text-slate-500">{user?.email}</p>
                <Badge variant="secondary" className="mt-2">
                  普通会员
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 账号安全 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4" />
                账号安全
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">登录密码</p>
                  <p className="text-xs text-slate-500">定期修改密码保护账号安全</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPasswordDialogOpen(true)}
                >
                  修改
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧 - 详细信息表单 */}
        <div className="space-y-6 lg:col-span-2">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                基本信息
              </CardTitle>
              <CardDescription>更新您的个人资料信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 姓名 */}
              <div className="grid gap-2">
                <Label htmlFor="name">姓名</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="pl-10"
                    placeholder="请输入您的姓名"
                  />
                </div>
              </div>

              {/* 邮箱 - 只读 */}
              <div className="grid gap-2">
                <Label htmlFor="email">邮箱</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="pl-10 bg-slate-50"
                  />
                </div>
                <p className="text-xs text-slate-500">邮箱地址不可修改</p>
              </div>

              {/* 手机号 */}
              <div className="grid gap-2">
                <Label htmlFor="phone">手机号</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="pl-10"
                    placeholder="请输入您的手机号"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      保存修改
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 尺码档案 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  尺码档案
                </CardTitle>
                <CardDescription>管理您的袜子尺码偏好</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openSizeDialog()}
              >
                添加档案
              </Button>
            </CardHeader>
            <CardContent>
              {sizeProfiles.length > 0 ? (
                <div className="space-y-3">
                  {sizeProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className={cn(
                        "flex items-center justify-between rounded-lg border p-4",
                        profile.isDefault && "border-amber-200 bg-amber-50/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                          <Ruler className="h-5 w-5 text-slate-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900">
                              {profile.name}
                            </p>
                            {profile.isDefault && (
                              <Badge variant="secondary" className="text-xs">
                                默认
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">
                            袜子尺码: {profile.sockSize}
                            {profile.shoeSize && ` · 鞋码: ${profile.shoeSize}`}
                          </p>
                          {profile.notes && (
                            <p className="text-xs text-slate-400 mt-1">
                              {profile.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!profile.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDefaultSize(profile.id)}
                          >
                            设为默认
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openSizeDialog(profile)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            setDeletingSizeId(profile.id);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Ruler className="mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-sm text-slate-500">暂无尺码档案</p>
                  <p className="text-xs text-slate-400">
                    添加尺码档案，订阅时快速选择
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 修改密码弹窗 */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
            <DialogDescription>请输入当前密码和新密码</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {passwordError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span>{passwordError}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">当前密码</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={
                !passwordData.currentPassword ||
                !passwordData.newPassword ||
                !passwordData.confirmPassword
              }
              className="bg-amber-600 hover:bg-amber-700"
            >
              确认修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 尺码档案编辑弹窗 */}
      <Dialog open={sizeDialogOpen} onOpenChange={setSizeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingSize ? "编辑尺码档案" : "添加尺码档案"}</DialogTitle>
            <DialogDescription>设置您的袜子尺码偏好</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sizeName">档案名称</Label>
              <Input
                id="sizeName"
                value={sizeFormData.name}
                onChange={(e) =>
                  setSizeFormData({ ...sizeFormData, name: e.target.value })
                }
                placeholder="例如：我的尺码、工作用"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sockSize">袜子尺码</Label>
              <Select
                value={sizeFormData.sockSize}
                onValueChange={(value) =>
                  setSizeFormData({ ...sizeFormData, sockSize: value })
                }
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
            <div className="space-y-2">
              <Label htmlFor="shoeSize">鞋码（可选）</Label>
              <Input
                id="shoeSize"
                value={sizeFormData.shoeSize}
                onChange={(e) =>
                  setSizeFormData({ ...sizeFormData, shoeSize: e.target.value })
                }
                placeholder="例如：42"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">备注（可选）</Label>
              <Input
                id="notes"
                value={sizeFormData.notes}
                onChange={(e) =>
                  setSizeFormData({ ...sizeFormData, notes: e.target.value })
                }
                placeholder="例如：喜欢宽松一点的"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={sizeFormData.isDefault}
                onChange={(e) =>
                  setSizeFormData({ ...sizeFormData, isDefault: e.target.checked })
                }
                className="rounded border-slate-300"
              />
              <Label htmlFor="isDefault" className="cursor-pointer">
                设为默认尺码
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSizeDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={saveSizeProfile}
              disabled={!sizeFormData.name}
              className="bg-amber-600 hover:bg-amber-700"
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后，该尺码档案将无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingSizeId(null)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteSizeProfile}
              className="bg-red-600 hover:bg-red-700"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
