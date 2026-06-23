"use client";

import { GameVisual } from "@/components/game/GameVisual";
import { ResultBars } from "@/components/game/ResultBars";
import { useQuestionCountdown } from "@/components/game/use-question-countdown";
import { useGameSocket } from "@/components/game/use-game-socket";
import { choiceStyles } from "@/lib/choice-styles";
import type { HostActionType } from "@/types/game";
import QRCode from "qrcode";
import Image from "next/image";
import { useEffect, useState } from "react";

interface HostGameProps {
	gameId: string;
	hostKey: string;
}

function getJoinUrl(gameId: string): string {
	if (typeof window === "undefined") {
		return `/play/${gameId}`;
	}

	return `${window.location.origin}/play/${gameId}`;
}

export function HostGame({ gameId, hostKey }: HostGameProps) {
	const { status, snapshot, errorMessage, sendAction } = useGameSocket({ gameId, role: "host", hostKey });
	const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
	const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
	const question = snapshot?.currentQuestion ?? null;
	const joinUrl = getJoinUrl(gameId);
	const isRevealed = snapshot?.status === "revealed";
	const remainingSeconds = useQuestionCountdown({
		endsAtMs: snapshot?.questionEndsAtMs ?? null,
		isActive: snapshot?.status === "accepting-answers",
	});

	useEffect(() => {
		let cancelled = false;

		QRCode.toDataURL(joinUrl, {
			errorCorrectionLevel: "H",
			margin: 1,
			scale: 8,
			color: {
				dark: "#0f172a",
				light: "#ffffff",
			},
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

	const sendHostAction = (type: HostActionType) => {
		sendAction({ type });
	};

	const copyJoinUrl = async () => {
		try {
			await navigator.clipboard.writeText(joinUrl);
			setCopyStatus("copied");
			window.setTimeout(() => setCopyStatus("idle"), 1200);
		} catch {
			setCopyStatus("idle");
		}
	};

	return (
		<main className="liquid-bg min-h-screen overflow-x-hidden p-3 text-slate-900 xl:h-screen xl:overflow-hidden">
			<div className="grid min-h-[calc(100vh-1.5rem)] grid-cols-1 gap-3 xl:h-full xl:min-h-0 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
				<section className="liquid-panel grid min-h-[720px] grid-rows-[auto_minmax(0,1fr)_auto_auto] gap-3 overflow-hidden rounded-[2rem] p-4 xl:min-h-0">
					<header className="flex min-h-0 flex-wrap items-center justify-between gap-3">
						<div>
							<p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-500">Teacher Control</p>
							<h1 className="text-3xl font-black leading-tight tracking-tight text-slate-900 2xl:text-5xl">{question?.title ?? "รอเริ่มเกม"}</h1>
						</div>
						<div className="liquid-control rounded-3xl px-5 py-3 text-right">
							<p className="text-sm font-bold text-slate-500">คนตอบแล้ว</p>
							<p className="text-4xl font-black text-sky-600 2xl:text-5xl">{snapshot?.answeredCount ?? 0}</p>
							<p className="mt-2 text-sm font-bold text-slate-500">เหลือเวลา {remainingSeconds ?? "-"} วิ</p>
						</div>
					</header>

					<GameVisual question={question} isRevealed={isRevealed} statusLabel={snapshot?.message} />

					<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
						{question?.choices.map((choice) => (
							<div
								key={choice.id}
								className={`liquid-button rounded-3xl border px-5 py-3 text-xl font-black 2xl:text-3xl ${choiceStyles[choice.id].panelClassName}`}
							>
								<span className="mr-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-center text-lg">{choice.id}</span>
								{choice.text}
							</div>
						))}
					</div>

					<ResultBars results={snapshot?.results ?? []} showCorrectAnswer={isRevealed} />
				</section>

				<aside className="liquid-panel relative flex min-h-0 flex-col gap-3 overflow-y-auto rounded-[2rem] p-4 text-slate-900">
					<div className="shrink-0">
						<p className="text-sm font-bold text-slate-500">สถานะ</p>
						<p className="text-xl font-black 2xl:text-2xl">{snapshot?.message ?? "กำลังเชื่อมต่อ"}</p>
						<p className="mt-1 text-sm text-slate-500">WebSocket: {status}</p>
						{errorMessage ? <p className="mt-2 rounded-md bg-red-50 p-3 text-sm font-semibold text-danger">{errorMessage}</p> : null}
					</div>

					<div className="liquid-control shrink-0 rounded-3xl p-3">
						<p className="text-sm font-bold text-slate-500">ให้ผู้เล่นเข้าเกม</p>
						<div className="my-3 rounded-3xl border border-dashed border-white/60 bg-white/35 p-4">
							<p className="text-base font-black text-slate-700">เปิดลิงก์นี้บนมือถือหรือแท็บเล็ต</p>
							<p className="mt-1 text-sm font-semibold leading-6 text-slate-500">สแกน QR หรือคัดลอกลิงก์ด้านล่างได้เลย</p>
							<div className="mt-3 flex items-center justify-center rounded-3xl bg-white p-3">
								{qrDataUrl ? (
									<Image alt="QR code for player join URL" className="h-44 w-44 rounded-2xl" height={176} src={qrDataUrl} width={176} />
								) : (
									<div className="flex h-44 w-44 items-center justify-center rounded-2xl bg-slate-100 text-center text-sm font-bold text-slate-500">
										Generating QR...
									</div>
								)}
							</div>
							<div className="mt-3 rounded-2xl bg-white/60 px-3 py-2 text-sm font-semibold text-slate-800">{joinUrl}</div>
							<button
								className="mt-3 min-h-11 cursor-pointer rounded-2xl border border-sky-200/70 bg-sky-100 px-4 py-2 text-sm font-black text-sky-900 transition hover:bg-sky-200"
								type="button"
								onClick={copyJoinUrl}
							>
								{copyStatus === "copied" ? "คัดลอกแล้ว" : "คัดลอก URL"}
							</button>
						</div>
						<p className="text-sm font-semibold text-slate-500">ผู้เล่นที่เชื่อมต่อ: {snapshot?.playerCount ?? 0}</p>
					</div>

					<div className="shrink-0">
						<p className="text-sm font-bold text-slate-500">ชุดคำถาม</p>
						<div className="liquid-control mt-2 rounded-3xl px-4 py-3 text-sm font-black text-slate-800">สัตว์เท่านั้น</div>
					</div>

					<div className="grid shrink-0 grid-cols-2 gap-2">
						<button className="liquid-button min-h-12 cursor-pointer rounded-2xl border border-sky-200/80 bg-sky-200/80 px-3 py-3 font-black text-sky-950 transition hover:bg-sky-300/80" type="button" onClick={() => sendHostAction("start-question")}>
							Start
						</button>
						<button className="liquid-control min-h-12 cursor-pointer rounded-2xl px-3 py-3 font-black transition hover:bg-white/55" type="button" onClick={() => sendHostAction("close-answers")}>
							Close
						</button>
						<button className="liquid-control min-h-12 cursor-pointer rounded-2xl px-3 py-3 font-black transition hover:bg-white/55" type="button" onClick={() => sendHostAction("show-result")}>
							Result
						</button>
						<button className="liquid-button min-h-12 cursor-pointer rounded-2xl border border-emerald-200/80 bg-emerald-200/80 px-3 py-3 font-black text-emerald-950 transition hover:bg-emerald-300/80" type="button" onClick={() => sendHostAction("reveal-answer")}>
							Reveal
						</button>
						<button className="liquid-button min-h-12 cursor-pointer rounded-2xl border border-indigo-200/80 bg-indigo-200/80 px-3 py-3 font-black text-indigo-950 transition hover:bg-indigo-300/80" type="button" onClick={() => sendHostAction("next-question")}>
							Next
						</button>
						<button className="liquid-button min-h-12 cursor-pointer rounded-2xl border border-rose-200/80 bg-rose-200/80 px-3 py-3 font-black text-rose-950 transition hover:bg-rose-300/80" type="button" onClick={() => sendHostAction("reset-game")}>
							Reset
						</button>
					</div>

					<div className="liquid-control shrink-0 rounded-3xl p-3 text-sm font-semibold text-slate-500">
						<p>
							ข้อ {snapshot?.currentQuestionNumber ?? 0} / {snapshot?.totalQuestions ?? 0}
						</p>
						<p>Game ID: {gameId}</p>
					</div>
				</aside>
			</div>
		</main>
	);
}
