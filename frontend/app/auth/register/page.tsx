"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Footprints, Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/lib/store/authStore";

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface PasswordStrength {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, isAuthenticated, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // 如果已登录，跳转到仪表板
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // 清除错误
  useEffect(() => {
    clearError();
  }, [clearError]);

  // 验证邮箱格式
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 密码强度检查
  const getPasswordStrength = (password: string): PasswordStrength => {
    return {
      hasMinLength: password.length >= 6,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthScore = Object.values(passwordStrength).filter(Boolean).length;

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "请输入姓名";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "姓名至少为2个字符";
    }

    if (!formData.email.trim()) {
      newErrors.email = "请输入邮箱地址";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "请输入有效的邮箱地址";
    }

    if (!formData.password) {
      newErrors.password = "请输入密码";
    } else if (formData.password.length < 6) {
      newErrors.password = "密码长度至少为6位";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "请确认密码";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "两次输入的密码不一致";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // 清除对应字段的错误
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setSubmitError("");
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      // 注册成功会自动登录并跳转到 dashboard
    } catch (error) {
      setSubmitError("注册失败，该邮箱可能已被注册");
    }
  };

  // 获取密码强度颜色
  const getStrengthColor = () => {
    if (strengthScore <= 1) return "bg-red-500";
    if (strengthScore <= 2) return "bg-yellow-500";
    if (strengthScore <= 3) return "bg-amber-500";
    return "bg-green-500";
  };

  // 获取密码强度文字
  const getStrengthText = () => {
    if (strengthScore <= 1) return "弱";
    if (strengthScore <= 2) return "一般";
    if (strengthScore <= 3) return "良好";
    return "强";
  };

  return (
    <Card className="w-full max-w-md shadow-2xl bg-white/95 backdrop-blur-sm border-0">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2">
            <Footprints className="h-8 w-8 text-amber-500" />
            <span className="text-xl font-bold text-slate-900">SockFlow</span>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-slate-900">创建账号</CardTitle>
        <CardDescription className="text-slate-500">注册 SockFlow 账号，开启智能袜子订阅之旅</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {submitError && (
            <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm border border-red-200">
              {submitError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-700">姓名</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="请输入您的姓名"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
              className={errors.name ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-amber-500"}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700">邮箱地址</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className={errors.email ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-amber-500"}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700">密码</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="请输入密码（至少6位）"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                className={errors.password ? "border-red-500 pr-10 focus-visible:ring-red-500" : "pr-10 focus-visible:ring-amber-500"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
            {/* 密码强度指示器 */}
            {formData.password && (
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                      style={{ width: `${(strengthScore / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 min-w-[2rem]">{getStrengthText()}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className={`flex items-center gap-1 ${passwordStrength.hasMinLength ? "text-green-600" : "text-slate-400"}`}>
                    {passwordStrength.hasMinLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    至少6位字符
                  </div>
                  <div className={`flex items-center gap-1 ${passwordStrength.hasLowercase ? "text-green-600" : "text-slate-400"}`}>
                    {passwordStrength.hasLowercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    包含小写字母
                  </div>
                  <div className={`flex items-center gap-1 ${passwordStrength.hasUppercase ? "text-green-600" : "text-slate-400"}`}>
                    {passwordStrength.hasUppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    包含大写字母
                  </div>
                  <div className={`flex items-center gap-1 ${passwordStrength.hasNumber ? "text-green-600" : "text-slate-400"}`}>
                    {passwordStrength.hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    包含数字
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-700">确认密码</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="请再次输入密码"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                className={errors.confirmPassword ? "border-red-500 pr-10 focus-visible:ring-red-500" : "pr-10 focus-visible:ring-amber-500"}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="agree"
              className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 mt-1"
              required
            />
            <Label htmlFor="agree" className="text-sm font-normal leading-tight text-slate-600">
              我已阅读并同意{" "}
              <Link href="/terms" className="text-amber-600 hover:text-amber-700 transition-colors">
                服务条款
              </Link>{" "}
              和{" "}
              <Link href="/privacy" className="text-amber-600 hover:text-amber-700 transition-colors">
                隐私政策
              </Link>
            </Label>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                注册中...
              </>
            ) : (
              "注册"
            )}
          </Button>
          <p className="text-sm text-center text-slate-600">
            已有账号？{" "}
            <Link
              href="/auth/login"
              className="text-amber-600 hover:text-amber-700 font-medium transition-colors"
            >
              立即登录
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
