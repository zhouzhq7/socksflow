"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
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

        <h1 className="text-3xl font-bold mb-8">隐私政策</h1>

        <div className="prose prose-slate max-w-none">
          <p className="text-muted-foreground mb-6">
            最后更新日期：2026年2月15日
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. 信息收集</h2>
            <p className="mb-4">
              我们收集以下类型的信息：
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>账户信息</strong>：邮箱地址、密码、用户名</li>
              <li><strong>个人信息</strong>：姓名、联系电话</li>
              <li><strong>配送信息</strong>：收货地址、邮政编码</li>
              <li><strong>尺码信息</strong>：袜子尺码、鞋码（用于产品匹配）</li>
              <li><strong>支付信息</strong>：支付记录（不存储银行卡号）</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. 信息使用</h2>
            <p className="mb-4">
              我们使用您的信息用于以下目的：
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>处理您的订阅订单和配送</li>
              <li>管理您的账户和提供客户服务</li>
              <li>发送订单状态更新和物流信息</li>
              <li>改进我们的产品和服务</li>
              <li>发送营销信息（您可以选择退订）</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. 信息保护</h2>
            <p className="mb-4">
              我们采用多种安全措施保护您的个人信息：
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>使用 SSL 加密传输数据</li>
              <li>密码使用 bcrypt 加密存储</li>
              <li>定期进行安全审计</li>
              <li>限制员工访问敏感信息</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. 信息共享</h2>
            <p className="mb-4">
              我们不会出售您的个人信息。仅在以下情况下共享信息：
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>与物流合作伙伴共享配送信息</li>
              <li>与支付服务提供商处理交易</li>
              <li>法律要求或保护我们的合法权益</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Cookie 使用</h2>
            <p className="mb-4">
              我们使用 Cookie 和类似技术来：
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>保持您的登录状态</li>
              <li>记住您的偏好设置</li>
              <li>分析网站使用情况</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. 您的权利</h2>
            <p className="mb-4">
              您有权：
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>查看、修改或删除您的个人信息</li>
              <li>导出您的数据</li>
              <li>取消订阅营销邮件</li>
              <li>注销账户</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. 联系我们</h2>
            <p>
              如果您对隐私政策有任何疑问，请联系我们：
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>隐私邮箱：privacy@socksflow.com</li>
              <li>客服电话：400-XXX-XXXX</li>
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
