import Link from "next/link";
import { Footprints, Package, Truck, Heart } from "lucide-react";
import ProductShowcase from "./components/ProductShowcase";
import AuthNav from "./components/AuthNav";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Footprints className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-slate-900">SockFlow</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="#features"
              className="text-slate-600 hover:text-slate-900 transition-colors hidden sm:block"
            >
              功能
            </Link>
            <Link
              href="#showcase"
              className="text-slate-600 hover:text-slate-900 transition-colors hidden sm:block"
            >
              产品
            </Link>
            <Link
              href="http://localhost:8000/api/docs"
              target="_blank"
              className="text-slate-600 hover:text-slate-900 transition-colors hidden sm:block"
            >
              API 文档
            </Link>
            <AuthNav />
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 mb-6">
            智能袜子订阅服务
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
            让每个人都能轻松拥有舒适、时尚、合脚的袜子，
            <br className="hidden sm:block" />
            告别袜子失踪的烦恼
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <button className="bg-indigo-600 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto">
                <Package className="h-5 w-5" />
                开始订阅
              </button>
            </Link>
            <Link href="#features">
              <button className="bg-white text-slate-700 border-2 border-slate-200 px-8 py-4 rounded-full text-lg font-medium hover:border-slate-300 transition-colors w-full sm:w-auto">
                了解更多
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-16">
            为什么选择 SockFlow？
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Package className="h-8 w-8 text-indigo-600" />}
              title="精选搭配"
              description="根据您的偏好和需求，每月为您精选合适的袜子款式"
            />
            <FeatureCard
              icon={<Truck className="h-8 w-8 text-indigo-600" />}
              title="免费配送"
              description="全国包邮，每月准时送达，省心省力"
            />
            <FeatureCard
              icon={<Heart className="h-8 w-8 text-indigo-600" />}
              title="灵活管理"
              description="随时暂停、修改或取消订阅，完全由您掌控"
            />
          </div>
        </div>
      </section>

      {/* 产品展示区域 - 包含产品展示、订阅盒、用户评价 */}
      <section id="showcase">
        <ProductShowcase />
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            准备好开始您的袜子订阅之旅了吗？
          </h2>
          <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
            立即注册，享受首月优惠，让 SockFlow 为您带来全新的袜子体验
          </p>
          <Link href="/auth/register">
            <button className="bg-white text-indigo-600 px-8 py-4 rounded-full text-lg font-medium hover:bg-indigo-50 transition-colors">
              免费注册
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Footprints className="h-6 w-6 text-indigo-400" />
              <span className="text-white font-semibold">SockFlow</span>
            </div>
            <p className="text-sm">© 2026 SockFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-8 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
  );
}
