"use client";

import { GameVisual } from "@/components/game/GameVisual";
import { useGameSocket } from "@/components/game/use-game-socket";
import { useQuestionCountdown } from "@/components/game/use-question-countdown";
import { choiceStyles } from "@/lib/choice-styles";
import QRCode from "qrcode";
import Image from "next/image";
import { useEffect, useState } from "react";

interface DisplayGameProps {
	gameId: string;
}

const LOW_TIME_THRESHOLD_SECONDS = 5;

function getJoinUrl(gameId: string): string {
	if (typeof window === "undefined") {
		return `/play/${gameId}`;
	}

	return `${window.location.origin}/play/${gameId}`;
}

/**
 * Read-only big-screen view for the projector/LED. Connects as a "display"
 * spectator: it never counts as a player and shows no host controls. The join
 * count is shown ONLY here (during the lobby), nowhere else.
 */
export function DisplayGame({ gameId }: DisplayGameProps) {
	const { snapshot, errorMessage } = useGameSocket({ gameId, role: "display" });
	const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
	const joinUrl = getJoinUrl(gameId);
	const question = snapshot?.currentQuestion ?? null;
	const gameStatus = snapshot?.status ?? "waiting";
	const isWaiting = gameStatus === "waiting";
	const isFinished = gameStatus === "finished";
	const isRevealed = gameStatus === "revealed";
	const remainingSeconds = useQuestionCountdown({
		endsAtMs: snapshot?.questionEndsAtMs ?? null,
		isActive: gameStatus === "accepting-answers",
	});

	useEffect(() => {
		let cancelled = false;

		QRCode.toDataURL(joinUrl, {
			errorCorrectionLevel: "H",
			margin: 1,
			scale: 10,
			color: { dark: "#0f172a", light: "#ffffff" },
		})
			.then((dataUrl) => {
				if (!cancelled) {
					setQrDataUrl(dataUrl);
				}
			})
			.catch(() => {
				if (!cancelled) {
					setQrDataUrl(null);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [joinUrl]);

	if (isWaiting) {
		return (
			<main className="liquid-bg flex min-h-screen flex-col items-center justify-center gap-8 p-8 text-slate-900">
				<div className="space-y-3 text-center">
					<p className="text-lg font-black uppercase tracking-[0.3em] text-sky-500">
						Shadow Guessing Game
					</p>
					<h1 className="text-5xl font-black tracking-tight sm:text-6xl xl:text-7xl">
						สแกนเพื่อเข้าร่วม
					</h1>
					<p className="text-2xl font-semibold text-slate-600">
						ใช้มือถือสแกน QR ด้านล่างเพื่อเข้าเล่น
					</p>
				</div>

				<div className="liquid-panel flex flex-col items-center gap-5 rounded-[2.5rem] p-8">
					<div className="rounded-[2rem] bg-white p-5">
						{qrDataUrl ? (
							<Image
								alt="QR code สำหรับเข้าร่วมเกม"
								className="h-72 w-72 xl:h-96 xl:w-96"
								height={384}
								priority
								src={qrDataUrl}
								width={384}
							/>
						) : (
							<div className="flex h-72 w-72 items-center justify-center rounded-2xl bg-slate-100 text-center text-xl font-bold text-slate-500 xl:h-96 xl:w-96">
								กำลังสร้าง QR...
							</div>
						)}
					</div>
					<p className="break-all text-center text-xl font-bold text-slate-700">
						{joinUrl}
					</p>
				</div>

				<div className="liquid-control flex items-center gap-4 rounded-full px-10 py-4">
					<span className="text-2xl font-semibold text-slate-600">
						เข้าร่วมแล้ว
					</span>
					<span className="text-5xl font-black text-sky-600 xl:text-6xl">
						{snapshot?.playerCount ?? 0}
					</span>
					<span className="text-2xl font-semibold text-slate-600">คน</span>
				</div>

				<p className="text-xl font-semibold text-slate-500">
					รอคุณครูเริ่มเกม…
				</p>

				{errorMessage ? (
					<p className="rounded-2xl bg-red-50 px-5 py-3 text-lg font-semibold text-danger">
						{errorMessage}
					</p>
				) : null}
			</main>
		);
	}

	if (isFinished) {
		return (
			<main className="liquid-bg flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center text-slate-900">
				<p className="text-7xl">🎉</p>
				<h1 className="text-5xl font-black tracking-tight sm:text-6xl xl:text-7xl">
					จบเกมแล้ว
				</h1>
				<p className="text-2xl font-semibold text-slate-600">
					ขอบคุณทุกคนที่ร่วมเล่น
				</p>
			</main>
		);
	}

	const statusText =
		gameStatus === "closed-answers"
			? "ปิดรับคำตอบ"
			: gameStatus === "revealed"
				? "เฉลยแล้ว"
				: "เปิดรับคำตอบ";
	const countdownToneClass =
		(remainingSeconds ?? 0) <= LOW_TIME_THRESHOLD_SECONDS
			? "text-rose-600"
			: "text-sky-600";

	return (
		<main className="liquid-bg flex min-h-screen flex-col gap-4 p-4 text-slate-900 xl:h-screen xl:overflow-hidden xl:p-6">
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap items-center gap-3">
					<span className="glass-chip rounded-full px-4 py-2 text-sm font-bold uppercase tracking-[0.16em] text-slate-600">
						ข้อ {snapshot?.currentQuestionNumber ?? 0} /{" "}
						{snapshot?.totalQuestions ?? 0}
					</span>
					{question?.title ? (
						<h1 className="text-3xl font-extrabold tracking-tight xl:text-5xl">
							{question.title}
						</h1>
					) : null}
				</div>
				{gameStatus === "accepting-answers" ? (
					<div className="liquid-control flex items-center gap-3 rounded-3xl px-6 py-3">
						<span className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
							เวลา
						</span>
						<span className={`text-5xl font-black ${countdownToneClass}`}>
							{remainingSeconds ?? "-"}
						</span>
					</div>
				) : (
					<span className="glass-chip rounded-full px-5 py-3 text-lg font-black text-slate-600">
						{statusText}
					</span>
				)}
			</header>

			<div className="min-h-[18rem] flex-1">
				<GameVisual question={question} isRevealed={isRevealed} />
			</div>

			<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
				{question?.choices.map((choice) => {
					const choiceResult = snapshot?.results.find(
						(result) => result.choiceId === choice.id,
					);
					const hasResult = choiceResult != null;

					return (
						<div
							key={choice.id}
							className={`liquid-button rounded-3xl border px-5 py-4 text-xl font-black xl:text-2xl 2xl:text-3xl ${choiceStyles[choice.id].panelClassName}`}
						>
							<div className="flex items-center justify-between gap-4">
								<div className="flex min-w-0 items-center">
									<span className="mr-3 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/30 text-center text-xl">
										{choice.id}
									</span>
									<span className="truncate">{choice.text}</span>
									{isRevealed && choiceResult?.isCorrect ? (
										<span className="ml-3 shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-700">
											คำตอบถูก
										</span>
									) : null}
								</div>
								{hasResult ? (
									<div className="shrink-0 text-3xl font-black 2xl:text-4xl">
										{choiceResult.percentage}%
									</div>
								) : null}
							</div>
							{hasResult ? (
								<div className="mt-3">
									<div className="h-2 overflow-hidden rounded-full bg-white/50">
										<div
											className={`h-full transition-[width] duration-500 ease-out ${isRevealed && choiceResult.isCorrect ? "bg-emerald-500" : choiceStyles[choice.id].barClassName}`}
											style={{ width: `${choiceResult.percentage}%` }}
										/>
									</div>
								</div>
							) : null}
						</div>
					);
				})}
			</div>
		</main>
	);
}
