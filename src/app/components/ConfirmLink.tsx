"use client";

import { useRouter } from "next/navigation";

export default function ConfirmLink({
  href,
  message,
  className,
  children,
}: {
  href: string;
  message: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (confirm(message)) router.push(href);
      }}
    >
      {children}
    </button>
  );
}
