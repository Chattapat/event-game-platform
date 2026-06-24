"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const teacherGameId = "hall";

export function TeacherAccessForm() {
	const router = useRouter();
	const [accessCode, setAccessCode] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (isSubmitting) {
			return;
		}

		setIsSubmitting(true);
		setErrorMessage(null);

		try {
			const response = await fetch("/api/teacher-access", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code: accessCode.trim() }),
			});

			const data = (await response.json().catch(() => null)) as { key?: string; error?: string } | null;

			if (!response.ok || !data?.key) {
				setErrorMessage(data?.error ?? "เข้าสู่ Teacher Control ไม่สำเร็จ");
				return;
			}

			router.push(`/teacher/${teacherGameId}?key=${encodeURIComponent(data.key)}`);
		} catch {
			setErrorMessage("เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form className="liquid-panel flex w-full max-w-xl flex-col gap-3 rounded-[2rem] p-4 sm:flex-row sm:items-start" onSubmit={handleSubmit}>
			<div className="min-w-0 flex-1">
				<label className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-slate-500" htmlFor="teacher-access-code">
					Teacher Code
				</label>
				<input
					className="min-h-12 w-full rounded-2xl border border-white/60 bg-white/70 px-4 text-lg font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-200 focus:ring-4 focus:ring-sky-100"
					id="teacher-access-code"
					inputMode="numeric"
					maxLength={8}
					name="teacher-access-code"
					pattern="[0-9]{8}"
					placeholder="กรอกรหัสสำหรับครู"
					type="password"
					value={accessCode}
					onChange={(event) => {
						setAccessCode(event.target.value.replace(/\D/g, ""));
						setErrorMessage(null);
					}}
				/>
				{errorMessage ? <p className="mt-2 text-sm font-bold text-rose-600">{errorMessage}</p> : null}
			</div>
			<button
				className="action-button liquid-button min-h-12 rounded-2xl border border-sky-200/80 bg-sky-200/80 px-6 py-3 text-base font-black text-sky-950 hover:bg-sky-300/80 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-7"
				disabled={isSubmitting}
				type="submit"
			>
				{isSubmitting ? "กำลังเข้า…" : "เข้า Teacher Control"}
			</button>
		</form>
	);
}
