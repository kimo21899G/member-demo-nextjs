import type { Metadata } from "next";
import "@/app/globals.css";
import Header from "@/app/components/layout/Header";
import Footer from "@/app/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "My Next App",
    template: "%s | My Next App",
  },
  description: "Next.js 기본 레이아웃 예제",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-dvh bg-zinc-50 text-zinc-900">
        {/* 전체 레이아웃: Header - Main - Footer */}
        <div className="min-h-dvh flex flex-col">
          <Header />

          <main className="flex-1">{children}</main>

          <Footer />
        </div>
      </body>
    </html>
  );
}
