"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Container from "./Container";

const NAV = [
  { href: "/", label: "홈" },
  { href: "/members", label: "회원목록" },
  { href: "/about", label: "소개" },
  { href: "/docs", label: "문서" },
  { href: "/contact", label: "문의" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // 라우트 변경 시 모바일 메뉴 닫기
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // ESC로 닫기
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <Container className="h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
            N
          </span>
          <span className="hidden sm:inline">회원관리 프로그램예제</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "px-3 py-2 text-sm rounded-md transition",
                  active
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-100",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions (예: 로그인 버튼) */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm px-3 py-2 rounded-md border border-zinc-200 hover:bg-zinc-50"
          >
            로그인
          </Link>
          <Link
            href="/members/signup"
            className="text-sm px-3 py-2 rounded-md bg-zinc-900 text-white hover:bg-zinc-800"
          >
            회원가입
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-md border border-zinc-200 p-2 hover:bg-zinc-50"
          aria-label="메뉴 열기"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {/* 아이콘 (간단 SVG) */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 7H20M4 12H20M4 17H20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </Container>

      {/* Mobile Menu Panel */}
      <div
        className={`md:hidden border-t border-zinc-200 bg-white ${
          open ? "block" : "hidden"
        }`}
      >
        <Container className="py-3">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "px-3 py-2 rounded-md text-sm",
                    active
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-100",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href="/login"
              className="text-sm px-3 py-2 rounded-md border border-zinc-200 hover:bg-zinc-50 text-center"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="text-sm px-3 py-2 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 text-center"
            >
              회원가입
            </Link>
          </div>
        </Container>
      </div>
    </header>
  );
}
