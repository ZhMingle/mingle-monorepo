import type { Metadata } from "next";
import type { Viewport } from "next";
import "./shop.css";
import "./mobile.css";
import "./product-page.css";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#223e35" };

export const metadata: Metadata = {
  title: "Mingle's Choice · 日常好物",
  description: "挑选日常好物，在线咨询，用 NZD 轻松结账。",
  appleWebApp: { capable: true, title: "我的小店", statusBarStyle: "default" },
  icons: {
    icon: "/shop-icon.svg",
    shortcut: "/shop-icon.svg",
    apple: "/app-icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" crossOrigin="use-credentials" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
