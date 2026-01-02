import Container from "@/app/components/layout/Container";

export default function HomePage() {
  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold">홈</h1>
      <p className="mt-2 text-zinc-700">
        RootLayout + Header/Nav(모바일) + Footer 기본 예제입니다.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 bg-white p-4"
          >
            카드 {i + 1}
          </div>
        ))}
      </div>
    </Container>
  );
}
