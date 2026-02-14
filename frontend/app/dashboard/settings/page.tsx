import { redirect } from "next/navigation";

export default function SettingsPage() {
  // 重定向到个人资料页面
  redirect("/dashboard/profile");
}
