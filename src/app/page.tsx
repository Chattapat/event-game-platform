import Link from "next/link";

import { TeacherAccessForm } from "@/components/home/TeacherAccessForm";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col justify-center gap-8">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Event Game
          </p>
          <h1 className="max-w-3xl text-5xl font-bold leading-tight sm:text-6xl">
            Shadow Guessing Game
          </h1>
          <p className="max-w-2xl text-xl leading-8 text-slate-600">
            เกมทายภาพจากเงาสำหรับจอ LED และมือถือผู้เข้าร่วม พร้อมหน้า Teacher
            Control และ Student Play สำหรับใช้งานจริงในห้องเรียน
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            className="student-play-cta liquid-button flex min-h-20 w-full max-w-xl items-center justify-center rounded-[2rem] border border-emerald-200/80 bg-emerald-100 px-8 py-5 text-center text-2xl font-black text-emerald-950 shadow-[0_18px_42px_rgba(16,185,129,0.16)] transition hover:bg-emerald-200/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 sm:w-auto"
            href="/play/hall"
          >
            Student Play
          </Link>
        </div>

        <TeacherAccessForm />
      </section>
    </main>
  );
}
