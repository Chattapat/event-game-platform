import type { Metadata } from "next";
import Link from "next/link";

interface TeacherFinishedPageProps {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ key?: string }>;
}

export const metadata: Metadata = {
  title: "จบเกมแล้ว",
  description: "Finished game screen for teacher control",
};

export default async function TeacherFinishedPage({
  params,
  searchParams,
}: TeacherFinishedPageProps) {
  const { gameId } = await params;
  const { key } = await searchParams;
  const teacherHref = key
    ? `/teacher/${gameId}?key=${encodeURIComponent(key)}`
    : `/teacher/${gameId}`;

  return (
    <main className="liquid-bg flex min-h-screen items-center justify-center px-4 py-8 text-slate-900">
      <section className="liquid-panel w-full max-w-2xl rounded-[2rem] p-8 text-center">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-500">
          Teacher Control
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
          จบเกมแล้ว
        </h1>
        <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
          เกมรอบนี้จบแล้ว สามารถกลับไปหน้าควบคุมเพื่อ Reset และเริ่มรอบใหม่ได้
        </p>
        <Link
          className="liquid-button mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl border border-sky-200/80 bg-sky-200/80 px-6 py-3 text-base font-black text-sky-950 hover:bg-sky-300/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/80"
          href={teacherHref}
        >
          กลับหน้า Teacher Control
        </Link>
      </section>
    </main>
  );
}
