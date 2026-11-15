import type { Metadata } from "next";
import type { Viewport } from "next";
import "./shop.css";
import "./mobile.css";
import "./product-page.css";
import "./language.css";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#223e35" };

export const metadata: Metadata = {
  title: "Mingle's Choice · Everyday, considered.",
  description: "Thoughtful everyday finds. Shop, chat and check out in NZD.",
  appleWebApp: { capable: true, title: "My shop", statusBarStyle: "default" },
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
    <html lang="en-NZ">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" crossOrigin="use-credentials" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
