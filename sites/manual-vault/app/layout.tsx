import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "知物 · 说明书管家",
  description:
    "让每一件设备，都有一本随手可查的说明书。保存原图，整理功能与设置，循着来源找到答案。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
