"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Footprints, Star, Check, ArrowRight, Sparkles, ChevronLeft, ChevronRight, Quote, Package, Lock, AlertCircle, MapPin, User, Ruler } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { addressApi, Address } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// 产品分类数据
const categories = [
  { id: "all", name: "全部" },
  { id: "sport", name: "运动袜" },
  { id: "casual", name: "休闲袜" },
  { id: "business", name: "商务袜" },
  { id: "wool", name: "羊毛袜" },
];

// 产品数据
const products = [
  {
    id: 1,
    name: "专业运动袜 Pro",
    category: "sport",
    price: "¥39",
    rating: 4.9,
    reviews: 128,
    material: "Coolmax 速干纤维",
    features: ["透气网眼", "加厚毛巾底", "足弓支撑"],
    colors: ["#1e293b", "#dc2626", "#2563eb"],
    description: "专为跑步和高强度运动设计",
    badge: "热销",
  },
  {
    id: 2,
    name: "精梳棉商务袜",
    category: "business",
    price: "¥35",
    rating: 4.8,
    reviews: 96,
    material: "100% 精梳棉",
    features: ["抗菌防臭", "无缝袜头", "经典条纹"],
    colors: ["#1f2937", "#374151", "#4b5563"],
    description: "职场精英的首选",
    badge: null,
  },
  {
    id: 3,
    name: "美利奴羊毛袜",
    category: "wool",
    price: "¥69",
    rating: 5.0,
    reviews: 84,
    material: "澳洲美利奴羊毛",
    features: ["恒温保暖", "天然抗菌", "超轻保暖"],
    colors: ["#78350f", "#92400e", "#a16207"],
    description: "冬季保暖必备",
    badge: "新品",
  },
  {
    id: 4,
    name: "潮流街头袜",
    category: "casual",
    price: "¥29",
    rating: 4.7,
    reviews: 156,
    material: "有机棉混纺",
    features: ["个性图案", "加厚耐磨", "多彩设计"],
    colors: ["#7c3aed", "#db2777", "#ea580c"],
    description: "展现个性的时尚单品",
    badge: "人气",
  },
  {
    id: 5,
    name: "压缩运动袜",
    category: "sport",
    price: "¥49",
    rating: 4.8,
    reviews: 72,
    material: "梯度压缩纤维",
    features: ["促进血液循环", "减少疲劳", "专业压缩"],
    colors: ["#059669", "#0891b2", "#6366f1"],
    description: "长途运动的最佳伴侣",
    badge: null,
  },
  {
    id: 6,
    name: "竹纤维休闲袜",
    category: "casual",
    price: "¥32",
    rating: 4.9,
    reviews: 203,
    material: "天然竹纤维",
    features: ["天然抗菌", "丝滑触感", "环保材质"],
    colors: ["#065f46", "#047857", "#10b981"],
    description: "环保舒适两不误",
    badge: "环保",
  },
];

// 订阅盒展示数据
const boxContents = [
  {
    title: "基础版",
    pairs: 2,
    price: "¥29.90",
    items: ["基础棉袜", "日常休闲袜"],
    color: "from-blue-500 to-blue-600",
  },
  {
    title: "标准版",
    pairs: 4,
    price: "¥49.90",
    items: ["运动袜", "商务袜", "休闲袜", "限量款"],
    color: "from-indigo-500 to-indigo-600",
    popular: true,
  },
  {
    title: "高级版",
    pairs: 6,
    price: "¥79.90",
    items: ["美利奴羊毛袜", "专业运动袜", "商务袜", "休闲袜", "限量款", "神秘惊喜款"],
    color: "from-purple-500 to-purple-600",
  },
];

export default function ProductShowcase() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState("all");
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);
  const [selectedBox, setSelectedBox] = useState<number | null>(1); // 默认选中标准版
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  
  // 获取用户地址列表
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoadingAddresses(true);
      addressApi.getAddresses()
        .then((res) => {
          setAddresses(res.items);
        })
        .catch((error) => {
          console.error("Failed to fetch addresses:", error);
          setAddresses([]);
        })
        .finally(() => {
          setIsLoadingAddresses(false);
        });
    } else {
      setAddresses([]);
    }
  }, [isAuthenticated]);
  
  // 检查用户是否已完成必要信息（手机号 + 至少一个地址）
  const isProfileComplete = !!(user?.phone && addresses.length > 0);
  
  // 获取缺失的必填信息
  const getMissingFields = (): string[] => {
    if (!user) return ["登录信息"];
    
    const missing: string[] = [];
    
    if (!user.phone) missing.push("手机号");
    if (addresses.length === 0) missing.push("配送地址");
    
    return missing;
  };
  
  const missingFields = getMissingFields();

  const filteredProducts =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.category === activeCategory);

  // 处理订阅方案选择
  const handleBoxSelect = (box: typeof boxContents[0], idx: number) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setSelectedBox(idx);
    setSelectedPlanIndex(idx);
    
    // 延迟处理，让用户看到选中效果
    setTimeout(() => {
      if (!isAuthenticated) {
        // 未登录：跳转到登录页，并带上订阅方案信息（登录后需要创建订阅）
        const redirectUrl = encodeURIComponent(`/dashboard/subscriptions?create=true&plan=${idx}`);
        router.push(`/auth/login?redirect=${redirectUrl}`);
      } else if (!isProfileComplete) {
        // 已登录但信息不完整：显示提示弹窗
        setShowProfileDialog(true);
        setIsProcessing(false);
      } else {
        // 已登录且信息完整：跳转到订阅管理页面
        router.push(`/dashboard/subscriptions?create=true&plan=${idx}`);
      }
    }, 400);
  };
  
  // 处理去完善信息
  const handleGoToCompleteProfile = () => {
    if (selectedPlanIndex === null) return;
    const returnUrl = encodeURIComponent(`/dashboard/subscriptions?create=true&plan=${selectedPlanIndex}`);
    router.push(`/complete-profile?return=${returnUrl}`);
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            精选品质
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            探索我们的袜子系列
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            从日常休闲到专业运动，从商务正式到户外探险，
            每一双都经过精心挑选，只为给您最舒适的体验
          </p>
        </div>

        {/* 分类标签 */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* 产品网格 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
              onMouseEnter={() => setHoveredProduct(product.id)}
              onMouseLeave={() => setHoveredProduct(null)}
            >
              {/* 徽章 */}
              {product.badge && (
                <div className="absolute top-4 left-4 z-10 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
                  {product.badge}
                </div>
              )}

              {/* 产品图片区域 - 使用 CSS 模拟袜子 */}
              <div className="relative h-64 bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
                {/* 袜子图形 */}
                <div
                  className="relative transition-transform duration-300 group-hover:scale-110"
                  style={{
                    filter: hoveredProduct === product.id ? "drop-shadow(0 20px 30px rgba(0,0,0,0.15))" : "none",
                  }}
                >
                  <SockIllustration color={product.colors[0]} pattern={product.category} />
                </div>

                {/* 悬停时显示快速操作 */}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button className="bg-white text-slate-900 px-6 py-3 rounded-full font-medium shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                    查看详情
                  </button>
                </div>
              </div>

              {/* 产品信息 */}
              <div className="p-6">
                {/* 评分 */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(product.rating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-slate-600">
                    {product.rating} ({product.reviews})
                  </span>
                </div>

                {/* 名称和描述 */}
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {product.name}
                </h3>
                <p className="text-sm text-slate-500 mb-3">{product.description}</p>

                {/* 材质标签 */}
                <p className="text-xs text-indigo-600 font-medium mb-3">
                  {product.material}
                </p>

                {/* 特性标签 */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded"
                    >
                      <Check className="h-3 w-3" />
                      {feature}
                    </span>
                  ))}
                </div>

                {/* 颜色和价格 */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {product.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: color }}
                        title={`颜色 ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <span className="text-xl font-bold text-slate-900">
                    {product.price}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 订阅盒展示 - 悬停预览，点击选中 */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-12 text-white">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              选择您的订阅方案
            </h3>
            <p className="text-slate-300 max-w-2xl mx-auto">
              每月精心搭配的袜子组合，根据您的偏好和需求定制，
              悬停预览效果，点击卡片立即订阅
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {boxContents.map((box, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedBox(idx)}
                className={`group relative cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300 
                  ${selectedBox === idx
                    ? "bg-white/20 border-amber-400 shadow-lg shadow-amber-400/20 scale-105"
                    : "bg-white/10 border-white/20 hover:bg-white/20 hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-400/10 hover:scale-105"
                  }`}
              >
                {/* 选中标记 */}
                {selectedBox === idx && (
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center z-10">
                    <Check className="h-5 w-5 text-amber-900" />
                  </div>
                )}

                {/* 未登录提示 */}
                {!isAuthenticated && selectedBox === idx && (
                  <div className="absolute -top-3 left-4 bg-slate-600 text-white text-xs font-medium px-3 py-1 rounded-full z-10 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    需登录
                  </div>
                )}

                {/* 受欢迎标签 */}
                {box.popular && (
                  <div className="absolute -top-3 left-4 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full z-10">
                    最受欢迎
                  </div>
                )}

                {/* 盒子视觉 */}
                <div
                  className={`h-32 rounded-xl bg-gradient-to-br ${box.color} mb-6 flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
                    selectedBox === idx ? "ring-2 ring-amber-400" : ""
                  }`}
                >
                  <div className="absolute inset-0 bg-white/10" />
                  <div className="relative text-center">
                    <Package className="h-12 w-12 text-white/80 mx-auto mb-2" />
                    <span className="text-3xl font-bold text-white">{box.pairs}</span>
                    <span className="text-white/80 ml-1">双/月</span>
                  </div>
                  {/* 装饰 */}
                  <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/20 rounded-full" />
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-white/10 rounded-full" />
                </div>

                <h4 className="text-xl font-bold mb-2 group-hover:text-amber-300 transition-colors">{box.title}</h4>
                <p className="text-3xl font-bold text-amber-400 mb-4 group-hover:scale-110 transition-transform origin-left">{box.price}<span className="text-lg text-slate-400">/月</span></p>

                <ul className="space-y-2 mb-6">
                  {box.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300 group-hover:text-white transition-colors">
                      <Check className={`h-4 w-4 transition-colors ${selectedBox === idx ? "text-amber-400" : "text-green-400 group-hover:text-amber-400"}`} />
                      {item}
                    </li>
                  ))}
                </ul>

                {/* 选择按钮 */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBoxSelect(box, idx);
                  }}
                  className={`w-full py-3 rounded-full font-bold text-center transition-all duration-300 flex items-center justify-center gap-2 ${
                    selectedBox === idx
                      ? "bg-amber-400 text-amber-900 hover:bg-amber-300"
                      : "bg-white/10 text-white group-hover:bg-amber-400 group-hover:text-amber-900"
                  }`}
                >
                  {selectedBox === idx 
                    ? (!isAuthenticated ? "登录后订阅" : "立即订阅")
                    : "选择此方案"
                  }
                  <ArrowRight className={`h-4 w-4 transition-transform ${selectedBox === idx ? "" : "group-hover:translate-x-1"}`} />
                </div>
              </div>
            ))}
          </div>


        </div>

        {/* 客户评价 - 轮播展示 */}
        <TestimonialCarousel />
      </div>
      
      {/* 信息不完善提示弹窗 */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              需要完善信息
            </DialogTitle>
            <DialogDescription>
              创建订阅前，请先完善以下信息：
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-3">
              {missingFields.includes("手机号") && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <User className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">手机号码</p>
                    <p className="text-sm text-slate-500">用于接收订单通知</p>
                  </div>
                </div>
              )}
              {missingFields.includes("配送地址") && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">配送地址</p>
                    <p className="text-sm text-slate-500">用于配送袜子</p>
                  </div>
                </div>
              )}
              {missingFields.includes("尺码信息") && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Ruler className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">尺码信息</p>
                    <p className="text-sm text-slate-500">用于匹配合适的袜子</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowProfileDialog(false)}>
              稍后再说
            </Button>
            <Button 
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleGoToCompleteProfile}
            >
              去完善信息
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// 袜子图形组件
function SockIllustration({ color, pattern }: { color: string; pattern: string }) {
  // 根据类别返回不同的图案
  const getPattern = () => {
    switch (pattern) {
      case "sport":
        return (
          <>
            <rect x="20" y="30" width="60" height="8" rx="2" fill="rgba(255,255,255,0.3)" />
            <rect x="20" y="50" width="40" height="8" rx="2" fill="rgba(255,255,255,0.3)" />
          </>
        );
      case "business":
        return (
          <>
            <rect x="15" y="25" width="70" height="2" fill="rgba(255,255,255,0.4)" />
            <rect x="15" y="35" width="70" height="2" fill="rgba(255,255,255,0.4)" />
            <rect x="15" y="45" width="70" height="2" fill="rgba(255,255,255,0.4)" />
          </>
        );
      case "casual":
        return (
          <>
            <circle cx="50" cy="40" r="15" fill="rgba(255,255,255,0.2)" />
            <circle cx="35" cy="60" r="10" fill="rgba(255,255,255,0.2)" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <svg
      width="100"
      height="120"
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      {/* 袜子主体 */}
      <path
        d="M30 10 L70 10 L70 50 Q70 70 90 80 Q95 82 95 90 Q95 100 85 100 L45 100 Q25 100 25 80 L25 20 Q25 10 30 10"
        fill={color}
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
      />
      {/* 袜口罗纹 */}
      <rect x="28" y="10" width="44" height="15" rx="3" fill={`${color}dd`} />
      {/* 图案 */}
      {getPattern()}
      {/* 高光 */}
      <ellipse cx="40" cy="30" rx="8" ry="15" fill="rgba(255,255,255,0.2)" />
    </svg>
  );
}
// 评价数据
const testimonials = [
  {
    id: 1,
    name: "张先生",
    role: "订阅用户 · 6个月",
    avatar: "Z",
    content: "以前总是找不到配对的袜子，现在每个月都有新袜子送到，质量还特别好！ SocksFlow 彻底改变了我对袜子的认知。",
    rating: 5,
  },
  {
    id: 2,
    name: "李女士",
    role: "订阅用户 · 1年",
    avatar: "L",
    content: "给老公订的，他特别喜欢运动袜系列。客服服务也很贴心，会根据反馈调整搭配。一年下来省了不少购物时间！",
    rating: 5,
  },
  {
    id: 3,
    name: "王先生",
    role: "订阅用户 · 3个月",
    avatar: "W",
    content: "商务袜的品质超出预期，比商场里买的还要舒服，性价比很高。穿在脚上很有质感，同事都问我在哪买的。",
    rating: 5,
  },
  {
    id: 4,
    name: "陈小姐",
    role: "订阅用户 · 8个月",
    avatar: "C",
    content: "羊毛袜太舒服了！冬天脚再也不冷了。而且包装很精美，每次开箱都有惊喜的感觉，像收到礼物一样。",
    rating: 5,
  },
  {
    id: 5,
    name: "刘先生",
    role: "订阅用户 · 2年",
    avatar: "L",
    content: "从最开始的怀疑到现在的铁杆粉丝，SocksFlow 的品质一直很稳定。推荐给所有懒人，再也不用担心袜子不够穿了！",
    rating: 5,
  },
];

// 评价卡片组件
function ReviewCard({ name, avatar, rating, content, role }: {
  name: string;
  avatar: string;
  rating: number;
  content: string;
  role: string;
}) {
  return (
    <div className="flex-shrink-0 w-[400px] mx-4 p-6 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-900">{name}</span>
            <div className="flex text-amber-400">
              {[...Array(rating)].map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-amber-400" />
              ))}
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-3">{role}</p>
          <p className="text-slate-600 italic text-sm leading-relaxed line-clamp-4">
            "{content}"
          </p>
        </div>
      </div>
    </div>
  );
}

// 评价轮播组件 - Marquee 滚动效果
function TestimonialCarousel() {
  return (
    <div className="mt-20">
      <h3 className="text-2xl font-bold text-center text-slate-900 mb-12">
        用户真实评价
      </h3>

      {/* Marquee 滚动区域 */}
      <div className="relative overflow-hidden group">
        {/* 左侧渐变遮罩 */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        {/* 右侧渐变遮罩 */}
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        {/* 滚动容器 */}
        <div className="flex animate-marquee group-hover:[animation-play-state:paused]">
          {/* 第一组评价 */}
          {testimonials.map((review, i) => (
            <ReviewCard key={`a-${i}`} {...review} />
          ))}
          {/* 第二组评价（复制实现无缝滚动） */}
          {testimonials.map((review, i) => (
            <ReviewCard key={`b-${i}`} {...review} />
          ))}
        </div>
      </div>

      {/* CSS 动画样式 */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </div>
  );
}
