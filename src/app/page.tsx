import Link from "next/link";

export default function HomePage() {
	return (
		<main className="min-h-screen bg-background px-6 py-10 text-foreground">
			<section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col justify-center gap-8">
				<div className="space-y-4">
					<p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Event Game MVP</p>
					<h1 className="max-w-3xl text-5xl font-bold leading-tight sm:text-6xl">Shadow Guessing Audience Game</h1>
					<p className="max-w-2xl text-xl leading-8 text-slate-600">
						เกมทายภาพจากเงาสำหรับจอ LED และมือถือผู้เข้าร่วม พร้อมหน้า Teacher Control และ Student Play สำหรับใช้งานจริงในห้องเรียนหรืออีเวนต์
					</p>
				</div>

				<div className="flex flex-col gap-3 sm:flex-row">
					<Link
						className="min-h-12 cursor-pointer rounded-lg bg-primary px-6 py-4 text-center text-lg font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
						href="/teacher/hall?key=teacher-demo"
					>
						Teacher Control
					</Link>
					<Link
						className="min-h-12 cursor-pointer rounded-lg border border-border bg-surface px-6 py-4 text-center text-lg font-semibold transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
						href="/play/hall"
					>
						Student Play
					</Link>
				</div>

				<div className="rounded-lg border border-border bg-surface p-5 text-sm leading-6 text-slate-600">
					<p className="font-semibold text-slate-900">Local test setup</p>
					<p>Room เริ่มต้นถูกตั้งค่าไว้ล่วงหน้าสำหรับ smoke test, host key `teacher-demo` ใช้เฉพาะ local, default room คือ `hall`, คำถาม hardcode 12 ข้อ และรูปยังใช้ fallback artwork สำหรับข้อที่ยังไม่มี asset จริง</p>
				</div>
			</section>
		</main>
	);
}
