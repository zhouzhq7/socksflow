"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container max-w-3xl mx-auto py-12 px-4">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">服务条款</h1>

        <div className="prose prose-slate max-w-none">
          <p className="text-muted-foreground mb-6">
            最后更新日期：2026年2月15日
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. 服务概述</h2>
            <p className="mb-4">
              SocksFlow 是一项智能袜子订阅服务，为您提供定期配送的高品质袜子。
              通过使用我们的服务，您同意遵守本服务条款的所有规定。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. 订阅服务</h2>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>我们提供基础版、标准版和高级版三种订阅方案</li>
              <li>订阅费用按月收取，支持随时取消</li>
              <li>取消订阅后，当月已支付的费用不予退还</li>
              <li>我们保留调整价格和方案的权利，会提前通知用户</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. 配送说明</h2>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>我们将在每月固定日期为您配送袜子</li>
              <li>配送地址以您账户中设置的默认地址为准</li>
              <li>如因地址错误导致配送失败，我们不承担责任</li>
              <li>配送范围仅限中国大陆地区</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. 退换货政策</h2>
            <p className="mb-4">
              由于袜子的个人卫生属性，除非商品存在质量问题，否则不接受退换货。
              如发现质量问题，请在收到商品后7天内联系客服。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. 账户安全</h2>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>您有责任保护自己的账户密码</li>
              <li>如发现账户异常，请立即联系我们</li>
              <li>禁止分享、出售或转让账户</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. 联系我们</h2>
            <p>
              如有任何问题，请通过以下方式联系我们：
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>客服邮箱：support@socksflow.com</li>
              <li>客服电话：400-XXX-XXXX</li>
              <li>工作时间：周一至周五 9:00-18:00</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-muted-foreground">
          <p>© 2026 SocksFlow. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
