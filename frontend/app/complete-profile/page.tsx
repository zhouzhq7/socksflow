"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  User, 
  MapPin, 
  Ruler, 
  ChevronRight, 
  CheckCircle2,
  AlertCircle,
  Footprints
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore, isUserProfileComplete, getMissingProfileFields } from "@/lib/store/authStore";

// 步骤定义
const STEPS = [
  { id: "phone", title: "完善联系方式", icon: User, description: "请输入您的手机号" },
  { id: "address", title: "添加配送地址", icon: MapPin, description: "设置默认配送地址" },
  { id: "size", title: "选择尺码", icon: Ruler, description: "选择您的袜子尺码" },
];

// 主页面组件
export default function CompleteProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
      </div>
    }>
      <CompleteProfileContent />
    </Suspense>
  );
}

// 内容组件
function CompleteProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("return") || "/dashboard";
  
  const { user, isAuthenticated, isLoading, updateProfile } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 表单数据
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    province: "",
    city: "",
    district: "",
    address: "",
    zipCode: "",
  });
  const [size, setSize] = useState(user?.sizeProfile?.sockSize || "M");

  // 检查用户是否已登录
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=/complete-profile&return=${encodeURIComponent(returnUrl)}`);
    }
  }, [isAuthenticated, isLoading, router, returnUrl]);

  // 检查用户是否已完成信息
  useEffect(() => {
    if (user && isUserProfileComplete(user)) {
      // 如果信息已完整，直接跳转到目标页面
      router.push(returnUrl);
    }
  }, [user, router, returnUrl]);

  // 确定当前步骤
  useEffect(() => {
    if (user) {
      if (!user.phone) {
        setCurrentStep(0);
      } else if (!user.addresses || user.addresses.length === 0) {
        setCurrentStep(1);
      } else if (!user.sizeProfile?.sockSize) {
        setCurrentStep(2);
      }
    }
  }, [user]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!phone || phone.length < 11) {
      setError("请输入有效的手机号");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await updateProfile({ phone });
      setCurrentStep(1);
      // 更新地址表单中的手机号
      setAddress(prev => ({ ...prev, phone }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // 验证地址信息
    if (!address.name || !address.phone || !address.province || 
        !address.city || !address.district || !address.address) {
      setError("请填写完整的地址信息");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // 调用 API 保存地址（这里需要后端支持）
      // await saveAddress(address);
      
      // 模拟成功，进入下一步
      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存地址失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    setIsSubmitting(true);
    try {
      // 调用 API 保存尺码（这里需要后端支持）
      // await saveSizeProfile({ sockSize: size });
      
      // 完成后跳转到目标页面
      router.push(returnUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存尺码失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // 跳过完善信息，但显示提示
    router.push(returnUrl);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
      </div>
    );
  }

  const CurrentStepIcon = STEPS[currentStep].icon;
  const missingFields = user ? getMissingProfileFields(user) : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Footprints className="h-8 w-8 text-amber-600" />
            <span className="text-xl font-bold text-slate-900">SocksFlow</span>
          </Link>
        </div>

        {/* 进度条 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                        isCompleted 
                          ? "bg-green-500 text-white" 
                          : isCurrent 
                            ? "bg-amber-600 text-white"
                            : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className={`text-xs ${isCurrent ? "font-medium text-slate-900" : "text-slate-500"}`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-600 transition-all duration-500"
                style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* 提示信息 */}
        {missingFields.length > 0 && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              为了给您提供更好的订阅服务，请完善以下信息：
              <span className="font-medium">{missingFields.join("、")}</span>
            </AlertDescription>
          </Alert>
        )}

        {/* 错误提示 */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 步骤内容 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CurrentStepIcon className="h-5 w-5 text-amber-600" />
              {STEPS[currentStep].title}
            </CardTitle>
            <CardDescription>{STEPS[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* 步骤 1: 手机号 */}
            {currentStep === 0 && (
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="phone">手机号码</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="请输入11位手机号"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={11}
                    className="mt-1"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      下一步
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* 步骤 2: 地址 */}
            {currentStep === 1 && (
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">收货人姓名</Label>
                    <Input
                      id="name"
                      placeholder="请输入姓名"
                      value={address.name}
                      onChange={(e) => setAddress({ ...address, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="addr-phone">手机号码</Label>
                    <Input
                      id="addr-phone"
                      type="tel"
                      placeholder="请输入手机号"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>省份</Label>
                    <Select 
                      value={address.province} 
                      onValueChange={(v) => setAddress({ ...address, province: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="选择省份" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="北京市">北京市</SelectItem>
                        <SelectItem value="上海市">上海市</SelectItem>
                        <SelectItem value="广东省">广东省</SelectItem>
                        <SelectItem value="浙江省">浙江省</SelectItem>
                        <SelectItem value="江苏省">江苏省</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>城市</Label>
                    <Select 
                      value={address.city} 
                      onValueChange={(v) => setAddress({ ...address, city: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="选择城市" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="北京市">北京市</SelectItem>
                        <SelectItem value="上海市">上海市</SelectItem>
                        <SelectItem value="广州市">广州市</SelectItem>
                        <SelectItem value="深圳市">深圳市</SelectItem>
                        <SelectItem value="杭州市">杭州市</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>区县</Label>
                    <Select 
                      value={address.district} 
                      onValueChange={(v) => setAddress({ ...address, district: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="选择区县" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="朝阳区">朝阳区</SelectItem>
                        <SelectItem value="海淀区">海淀区</SelectItem>
                        <SelectItem value="浦东新区">浦东新区</SelectItem>
                        <SelectItem value="天河区">天河区</SelectItem>
                        <SelectItem value="南山区">南山区</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="detail">详细地址</Label>
                  <Input
                    id="detail"
                    placeholder="街道、小区、门牌号"
                    value={address.address}
                    onChange={(e) => setAddress({ ...address, address: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="zip">邮政编码（选填）</Label>
                  <Input
                    id="zip"
                    placeholder="请输入邮政编码"
                    value={address.zipCode}
                    onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setCurrentStep(0)}
                  >
                    上一步
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        下一步
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* 步骤 3: 尺码 */}
            {currentStep === 2 && (
              <form onSubmit={handleSizeSubmit} className="space-y-4">
                <div>
                  <Label>袜子尺码</Label>
                  <Select value={size} onValueChange={setSize}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="选择尺码" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S">S (35-37)</SelectItem>
                      <SelectItem value="M">M (38-40)</SelectItem>
                      <SelectItem value="L">L (41-43)</SelectItem>
                      <SelectItem value="XL">XL (44-46)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-2">
                    如果不确定尺码，可以参考鞋码选择对应的袜子尺码
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                  >
                    上一步
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        完成
                        <CheckCircle2 className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* 跳过按钮 */}
        <div className="text-center mt-6">
          <Button 
            variant="link" 
            onClick={handleSkip}
            className="text-slate-500"
          >
            暂不完善，稍后设置
          </Button>
        </div>
      </div>
    </div>
  );
}
