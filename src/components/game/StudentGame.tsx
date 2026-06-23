"use client";

import { useEffect, useRef } from "react";

import { useGameSocket } from "@/components/game/use-game-socket";
import { useQuestionCountdown } from "@/components/game/use-question-countdown";
import { choiceStyles } from "@/lib/choice-styles";
import type { ChoiceId } from "@/types/game";

interface StudentGameProps {
	gameId: string;
}

export function StudentGame({ gameId }: StudentGameProps) {
	const { status, snapshot, errorMessage, playerId, sendAction } = useGameSocket({ gameId, role: "student" });
	const question = snapshot?.currentQuestion ?? null;
	const canAnswer = Boolean(question && snapshot?.status === "accepting-answers" && !snapshot.hasAnswered && playerId);
	const selectedChoiceId = snapshot?.selectedChoiceId ?? null;
	const remainingSeconds = useQuestionCountdown({
		endsAtMs: snapshot?.questionEndsAtMs ?? null,
		isActive: snapshot?.status === "accepting-answers",
	});
	const lastTickSecondRef = useRef<number | null>(null);

	useEffect(() => {
		if (snapshot?.status !== "accepting-answers" || remainingSeconds == null) {
			lastTickSecondRef.current = null;
			return;
		}

		if (remainingSeconds > 5 || remainingSeconds <= 0 || lastTickSecondRef.current === remainingSeconds) {
			return;
		}

		lastTickSecondRef.current = remainingSeconds;

		const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
		if (!AudioContextCtor) {
			return;
		}

		const audioContext = new AudioContextCtor();
		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();

		oscillator.type = "sine";
		oscillator.frequency.value = 880;
		gainNode.gain.value = 0.02;

		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);
		oscillator.start();
		oscillator.stop(audioContext.currentTime + 0.08);

		oscillator.onended = () => {
			audioContext.close().catch(() => {});
		};
	}, [remainingSeconds, snapshot?.status]);
	const countdownProgress = remainingSeconds == null ? 0 : Math.max(0, (remainingSeconds / (snapshot?.questionDurationMs ?? 15_000)) * 100);

	const submitAnswer = (choiceId: ChoiceId) => {
		if (!playerId) {
			return;
		}

		sendAction({ type: "submit-answer", playerId, choiceId });
	};

	return (
		<main className="liquid-bg min-h-screen px-4 py-5 text-slate-900">
			<section className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-xl flex-col gap-5">
				<header className="liquid-panel rounded-[2rem] p-5 text-slate-900">
					<p className="text-sm font-black uppercase tracking-[0.18em] text-sky-500">Student Play</p>
					<h1 className="mt-2 text-3xl font-black tracking-tight">{question?.title ?? "เข้าร่วมเกมแล้ว"}</h1>
					<p className="mt-2 text-base font-semibold leading-7 text-slate-600">{snapshot?.message ?? "กำลังเชื่อมต่อเกม"}</p>
					<p className="mt-2 text-sm font-semibold text-slate-500">Connection: {status}</p>
					<p className="mt-2 inline-flex rounded-full bg-white/55 px-3 py-1 text-sm font-bold text-slate-700">
						เวลาคงเหลือ {remainingSeconds ?? "-"} วิ
					</p>
					<div className="mt-3 h-3 overflow-hidden rounded-full bg-white/45">
						<div
							className={`h-full rounded-full transition-[width] duration-300 ease-linear ${
								(remainingSeconds ?? 0) <= 5 ? "bg-rose-400" : "bg-sky-400"
							}`}
							style={{ width: `${countdownProgress}%` }}
						/>
					</div>
					{errorMessage ? <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-600">{errorMessage}</p> : null}
				</header>

				<div className="liquid-panel flex-1 rounded-[2rem] p-4">
						{question ? (
							<div className="grid gap-3">
								{question.choices.map((choice) => (
								<button
									key={choice.id}
									className={`liquid-button min-h-20 cursor-pointer rounded-3xl border px-5 py-4 text-left text-2xl font-black transition duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/80 disabled:cursor-not-allowed disabled:grayscale disabled:opacity-55 ${
										selectedChoiceId === choice.id
											? "scale-[1.03] ring-4 ring-white/80 shadow-[0_16px_36px_rgba(56,80,128,0.22)]"
											: "shadow-[0_10px_28px_rgba(56,80,128,0.14)]"
									} ${choiceStyles[choice.id].buttonClassName}`}
									type="button"
									disabled={!canAnswer}
									onClick={() => submitAnswer(choice.id)}
								>
									<span className="mr-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-center text-xl">{choice.id}</span>
									<span className="flex-1">{choice.text}</span>
									{selectedChoiceId === choice.id ? <span className="ml-3 rounded-full bg-white/35 px-3 py-1 text-xs font-black uppercase tracking-[0.18em]">เลือกแล้ว</span> : null}
								</button>
							))}
						</div>
					) : (
						<div className="flex min-h-80 items-center justify-center text-center">
							<div>
								<p className="text-3xl font-black">รอคำถามจากจอใหญ่</p>
								<p className="mt-3 font-semibold text-slate-500">เมื่อ Teacher Control เริ่มคำถาม ตัวเลือกจะขึ้นที่นี่</p>
							</div>
						</div>
					)}
				</div>

				<footer className="liquid-panel rounded-[2rem] p-4 text-center text-lg font-black text-slate-900">
					<div>
						{snapshot?.hasAnswered ? "ส่งคำตอบแล้ว รอดูเฉลยบนจอใหญ่" : null}
						{snapshot?.status === "closed-answers" ? "ปิดรับคำตอบแล้ว รอข้อถัดไป" : null}
						{snapshot?.status === "revealed" && question ? `คำตอบคือ ${question.answerText}` : null}
						{snapshot?.status === "finished" ? "จบเกมแล้ว ขอบคุณที่ร่วมสนุก" : null}
						{canAnswer ? "เลือกคำตอบได้ 1 ครั้ง" : null}
					</div>
				</footer>
			</section>
		</main>
	);
}
