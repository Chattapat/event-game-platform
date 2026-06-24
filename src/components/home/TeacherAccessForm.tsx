"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const teacherAccessCode = "24681357";
const teacherControlUrl = "/teacher/hall?key=teacher-demo";

export function TeacherAccessForm() {
	const router = useRouter();
	const [accessCode, setAccessCode] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (accessCode.trim() !== teacherAccessCode) {
			setErrorMessage("รหัสไม่ถูกต้อง");
			return;
		}

		setErrorMessage(null);
		router.push(teacherControlUrl);
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
				className="action-button liquid-button min-h-12 rounded-2xl border border-sky-200/80 bg-sky-200/80 px-6 py-3 text-base font-black text-sky-950 hover:bg-sky-300/80 sm:mt-7"
				type="submit"
			>
				เข้า Teacher Control
			</button>
		</form>
	);
}
