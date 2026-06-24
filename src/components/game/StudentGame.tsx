"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useGameSocket } from "@/components/game/use-game-socket";
import { useQuestionCountdown } from "@/components/game/use-question-countdown";
import { choiceStyles } from "@/lib/choice-styles";
import type { ChoiceId } from "@/types/game";

interface StudentGameProps {
	gameId: string;
}

export function StudentGame({ gameId }: StudentGameProps) {
	const router = useRouter();
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

	useEffect(() => {
		if (snapshot?.status !== "finished") {
			return;
		}

		const timeoutId = window.setTimeout(() => {
			router.push(`/play/${gameId}/finished`);
		}, 3500);

		return () => window.clearTimeout(timeoutId);
	}, [gameId, router, snapshot?.status]);
	const totalQuestionSeconds = Math.max(1, Math.round((snapshot?.questionDurationMs ?? 15_000) / 1000));
	const countdownProgress = remainingSeconds == null ? 0 : Math.max(0, (remainingSeconds / totalQuestionSeconds) * 100);
	const isAnswerRevealed = snapshot?.status === "revealed";
	const statusText =
		snapshot?.status === "accepting-answers"
			? "เปิดรับคำตอบ"
			: snapshot?.status === "closed-answers"
				? "ปิดรับคำตอบ"
				: snapshot?.status === "revealed"
					? "เฉลยแล้ว"
					: snapshot?.status === "finished"
						? "จบเกมแล้ว"
						: "รอคำถาม";

	const submitAnswer = (choiceId: ChoiceId) => {
		if (!playerId) {
			return;
		}

		sendAction({ type: "submit-answer", playerId, choiceId });
	};

	const getChoiceButtonClassName = (choiceId: ChoiceId): string => {
		if (isAnswerRevealed && selectedChoiceId !== choiceId) {
			return "border-slate-200/80 bg-slate-100 text-slate-500 shadow-[0_8px_20px_rgba(100,116,139,0.08)]";
		}

		if (selectedChoiceId !== choiceId) {
			return `${choiceStyles[choiceId].buttonClassName} shadow-[0_10px_28px_rgba(56,80,128,0.14)]`;
		}

		if (isAnswerRevealed && question?.correctChoiceId === choiceId) {
			return "scale-[1.03] border-emerald-200/90 bg-emerald-100 text-emerald-950 ring-4 ring-emerald-200/80 shadow-[0_16px_36px_rgba(16,185,129,0.18)]";
		}

		if (isAnswerRevealed) {
			return "scale-[1.03] border-rose-200/90 bg-rose-100 text-rose-950 ring-4 ring-rose-200/80 shadow-[0_16px_36px_rgba(244,63,94,0.18)]";
		}

		return `${choiceStyles[choiceId].buttonClassName} scale-[1.03] ring-4 ring-white/80 shadow-[0_16px_36px_rgba(56,80,128,0.22)]`;
	};

	return (
		<main className="liquid-bg min-h-screen px-4 py-5 text-slate-900">
			<section className="page-shell mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-2xl flex-col gap-4 sm:gap-5">
				<header className="liquid-panel rounded-[2rem] p-5 text-slate-900">
					<div className="flex flex-wrap items-center gap-2">
						<p className="text-sm font-black uppercase tracking-[0.18em] text-sky-500">Student Play</p>
						<span className="glass-chip rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Room {gameId}</span>
						<span className="glass-chip rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">{statusText}</span>
					</div>
					<h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{question?.title ?? "เข้าร่วมเกมแล้ว"}</h1>
					<p className="mt-2 text-base font-semibold leading-7 text-slate-600">{snapshot?.message ?? "กำลังเชื่อมต่อเกม"}</p>
					<div className="mt-4 flex items-center justify-between gap-3">
						<p className="text-sm font-semibold text-slate-500">Connection: {status}</p>
						<p className="glass-chip inline-flex rounded-full px-3 py-2 text-sm font-bold text-slate-700">
							เวลาคงเหลือ {remainingSeconds ?? "-"} วิ
						</p>
					</div>
					<div className="mt-3 h-3 overflow-hidden rounded-full bg-white/45">
						<div
							className={`h-full rounded-full transition-[width] duration-300 ease-linear ${
								(remainingSeconds ?? 0) <= 5 ? "countdown-bar-danger" : "countdown-bar"
							}`}
							style={{ width: `${countdownProgress}%` }}
						/>
					</div>
					{errorMessage ? <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-600">{errorMessage}</p> : null}
				</header>

				<div className="liquid-panel flex-1 rounded-[2rem] p-4">
					{question ? (
						<div className="grid gap-3">
							{question.choices.map((choice) => {
								return (
									<button
										key={choice.id}
										className={`action-button liquid-button min-h-20 rounded-3xl border px-4 py-4 text-left text-xl font-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/80 disabled:cursor-not-allowed sm:px-5 sm:text-2xl ${getChoiceButtonClassName(choice.id)}`}
										type="button"
										disabled={!canAnswer}
										onClick={() => submitAnswer(choice.id)}
									>
										<span className="mr-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/30 text-center text-lg sm:mr-4 sm:h-11 sm:w-11 sm:text-xl">{choice.id}</span>
										<span className="flex-1">{choice.text}</span>
										{selectedChoiceId === choice.id ? <span className="ml-3 rounded-full bg-white/40 px-3 py-1 text-xs font-black uppercase tracking-[0.18em]">เลือกแล้ว</span> : null}
									</button>
								);
							})}
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

				<footer className="liquid-panel rounded-[2rem] p-4 text-center text-base font-black text-slate-900 sm:text-lg">
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
