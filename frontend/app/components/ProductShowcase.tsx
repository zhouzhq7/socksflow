"use client";

import { useState } from "react";
import { Footprints, Star, Check, ArrowRight, Sparkles } from "lucide-react";

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
    title: "基础盒",
    pairs: 2,
    price: "¥29",
    items: ["基础棉袜", "日常休闲袜"],
    color: "from-blue-500 to-blue-600",
  },
  {
    title: "标准盒",
    pairs: 3,
    price: "¥49",
    items: ["运动袜", "商务袜", "休闲袜"],
    color: "from-indigo-500 to-indigo-600",
    popular: true,
  },
  {
    title: "高级盒",
    pairs: 5,
    price: "¥89",
    items: ["美利奴羊毛袜", "专业运动袜", "商务袜", "休闲袜", "限量款"],
    color: "from-purple-500 to-purple-600",
  },
];

export default function ProductShowcase() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);

  const filteredProducts =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.category === activeCategory);

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

        {/* 订阅盒展示 */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-12 text-white">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              您的订阅盒里有什么？
            </h3>
            <p className="text-slate-300 max-w-2xl mx-auto">
              每月精心搭配的袜子组合，根据您的偏好和需求定制，
              惊喜与实用兼备
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {boxContents.map((box, idx) => (
              <div
                key={idx}
                className={`relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 ${
                  box.popular ? "ring-2 ring-amber-400" : ""
                }`}
              >
                {box.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1 rounded-full">
                    最受欢迎
                  </div>
                )}

                {/* 盒子视觉 */}
                <div
                  className={`h-32 rounded-xl bg-gradient-to-br ${box.color} mb-6 flex items-center justify-center relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-white/10" />
                  <div className="relative text-center">
                    <Footprints className="h-12 w-12 text-white/80 mx-auto mb-2" />
                    <span className="text-3xl font-bold text-white">{box.pairs}</span>
                    <span className="text-white/80 ml-1">双</span>
                  </div>
                  {/* 装饰 */}
                  <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/20 rounded-full" />
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-white/10 rounded-full" />
                </div>

                <h4 className="text-xl font-bold mb-2">{box.title}</h4>
                <p className="text-2xl font-bold text-amber-400 mb-4">{box.price}/月</p>

                <ul className="space-y-2 mb-6">
                  {box.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="h-4 w-4 text-green-400" />
                      {item}
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-full font-medium transition-colors flex items-center justify-center gap-2 ${
                    box.popular
                      ? "bg-amber-400 text-amber-900 hover:bg-amber-300"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  选择此方案
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 客户评价 */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-center text-slate-900 mb-12">
            用户真实评价
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "张先生",
                role: "订阅用户 · 6个月",
                content: "以前总是找不到配对的袜子，现在每个月都有新袜子送到，质量还特别好！",
                rating: 5,
              },
              {
                name: "李女士",
                role: "订阅用户 · 1年",
                content: "给老公订的，他特别喜欢运动袜系列。客服服务也很贴心，会根据反馈调整搭配。",
                rating: 5,
              },
              {
                name: "王先生",
                role: "订阅用户 · 3个月",
                content: "商务袜的品质超出预期，比商场里买的还要舒服，性价比很高。",
                rating: 5,
              },
            ].map((review, idx) => (
              <div
                key={idx}
                className="bg-slate-50 rounded-2xl p-6 border border-slate-100"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  "{review.content}"
                </p>
                <div>
                  <p className="font-medium text-slate-900">{review.name}</p>
                  <p className="text-sm text-slate-500">{review.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
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
