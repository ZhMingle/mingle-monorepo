import type { Metadata } from "next";
import "./shop.css";

export const metadata: Metadata = {
  title: "Mingle's Choice · 日常好物",
  description: "挑选日常好物，在线咨询，用 NZD 轻松结账。",
  icons: {
    icon: "/shop-icon.svg",
    shortcut: "/shop-icon.svg",
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
