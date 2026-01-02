import Link from "next/link";
import Container from "./Container";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <Container className="py-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600">
          © {new Date().getFullYear()} My Next App. All rights reserved.
        </p>

        <div className="flex items-center gap-3 text-sm">
          <Link className="text-zinc-600 hover:text-zinc-900" href="/privacy">
            개인정보처리방침
          </Link>
          <Link className="text-zinc-600 hover:text-zinc-900" href="/terms">
            이용약관
          </Link>
        </div>
      </Container>
    </footer>
  );
}
