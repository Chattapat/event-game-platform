import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { Question } from "@/types/game";

interface GameVisualProps {
	question: Question | null;
	isRevealed: boolean;
	statusLabel?: string;
}

export function GameVisual({ question, isRevealed, statusLabel }: GameVisualProps) {
	const [transitionLabel, setTransitionLabel] = useState<"reveal" | "next" | null>(null);
	const previousQuestionIdRef = useRef<string | null>(question?.id ?? null);
	const previousRevealedRef = useRef(isRevealed);

	useEffect(() => {
		const previousQuestionId = previousQuestionIdRef.current;
		const previousRevealed = previousRevealedRef.current;
		let timeoutId: number | null = null;

		if (question?.id && previousQuestionId && question.id !== previousQuestionId) {
			setTransitionLabel("next");
			timeoutId = window.setTimeout(() => setTransitionLabel(null), 900);
		} else if (isRevealed && !previousRevealed) {
			setTransitionLabel("reveal");
			timeoutId = window.setTimeout(() => setTransitionLabel(null), 900);
		}

		previousQuestionIdRef.current = question?.id ?? null;
		previousRevealedRef.current = isRevealed;

		return () => {
			if (timeoutId != null) {
				window.clearTimeout(timeoutId);
			}
		};
	}, [isRevealed, question?.id]);

	if (!question) {
		return (
			<div className="liquid-stage relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden rounded-[2rem] text-center text-slate-900">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.68),_rgba(224,242,254,0.28)_58%,_rgba(255,255,255,0.18)_100%)]" />
				<div className="absolute inset-x-20 top-10 h-24 rounded-full bg-white/45 blur-3xl" />
				<div className="relative space-y-3">
					<p className="text-4xl font-black tracking-tight text-slate-900 xl:text-6xl">พร้อมเริ่มเกม</p>
					<p className="text-xl font-semibold text-slate-600 xl:text-2xl">กดเริ่มคำถามได้เลย</p>
				</div>
			</div>
		);
	}

	return (
		<div className={`liquid-stage relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden rounded-[2rem] text-slate-900 ${transitionLabel ? "stage-pop" : ""}`}>
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.74),_rgba(228,240,255,0.30)_60%,_rgba(255,255,255,0.12)_100%)]" />
			<div className="absolute inset-x-8 top-0 h-36 rounded-full bg-white/55 blur-3xl" />
			<div className="absolute bottom-0 h-1/3 w-full bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.52),_transparent_65%)]" />
			{statusLabel ? (
				<div className="glass-chip absolute left-5 top-5 rounded-full px-4 py-2 text-sm font-bold text-slate-700">
					{statusLabel}
				</div>
			) : null}
			<QuestionArtwork key={question.id} question={question} isRevealed={isRevealed} />
			{transitionLabel ? (
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<div className="glass-chip stage-banner rounded-full px-5 py-3 text-lg font-black text-slate-700">
						{transitionLabel === "reveal" ? "เฉลยแล้ว" : "ข้อถัดไป"}
					</div>
				</div>
			) : null}
			<div className="glass-chip absolute bottom-4 left-4 rounded-full px-4 py-2 text-sm font-bold text-slate-700 transition-all duration-700 ease-out">
				{isRevealed ? "เฉลย" : "ภาพเงา"}
			</div>
		</div>
	);
}

interface QuestionArtworkProps {
	question: Question;
	isRevealed: boolean;
}

function QuestionArtwork({ question, isRevealed }: QuestionArtworkProps) {
	const [shadowFailed, setShadowFailed] = useState(false);
	const [realFailed, setRealFailed] = useState(false);

	return (
		<div className="relative flex h-[min(78vw,18rem)] w-[min(78vw,18rem)] items-center justify-center sm:h-80 sm:w-80 xl:h-[26rem] xl:w-[26rem] 2xl:h-[30rem] 2xl:w-[30rem]">
			<div
				className={`liquid-panel absolute inset-0 rounded-[2.25rem] border border-white/40 bg-white/55 shadow-2xl shadow-slate-500/15 transition-all duration-700 ease-out motion-safe:transition-all ${
					isRevealed ? "scale-100 opacity-100" : "scale-[0.985] opacity-100"
				}`}
			/>
			{!shadowFailed ? (
				<Image
					alt=""
					aria-hidden="true"
					className={`absolute inset-0 h-full w-full object-contain p-4 transition-all duration-700 ease-out motion-safe:transition-all ${
						isRevealed ? "scale-95 opacity-0 blur-sm" : "scale-100 opacity-100"
					}`}
					fill
					onError={() => setShadowFailed(true)}
					sizes="(min-width: 1536px) 20rem, (min-width: 640px) 18rem, 78vw"
					src={question.shadowImageUrl}
				/>
			) : (
				<div
					aria-hidden="true"
					className={`absolute inset-0 flex items-center justify-center rounded-[2rem] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.95),_rgba(226,244,255,0.72)_60%,_rgba(255,255,255,0.46)_100%)] p-4 text-center text-2xl font-black text-slate-500 transition-all duration-700 ease-out motion-safe:transition-all ${
						isRevealed ? "scale-95 opacity-0 blur-sm" : "scale-100 opacity-100"
					}`}
				>
					ภาพเงา
				</div>
			)}
			{!realFailed ? (
				<Image
					alt={question.answerText}
					className={`absolute inset-0 h-full w-full object-contain p-4 transition-all duration-700 ease-out motion-safe:transition-all ${
						isRevealed ? "scale-100 opacity-100" : "scale-[0.98] opacity-0 blur-sm"
					}`}
					fill
					onError={() => setRealFailed(true)}
					sizes="(min-width: 1536px) 20rem, (min-width: 640px) 18rem, 78vw"
					src={question.realImageUrl}
				/>
			) : (
				<div
					aria-hidden="true"
					className={`absolute inset-0 flex items-center justify-center rounded-[2rem] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.95),_rgba(224,242,254,0.68)_60%,_rgba(255,255,255,0.44)_100%)] p-6 text-center text-3xl font-black text-slate-700 transition-all duration-700 ease-out motion-safe:transition-all ${
						isRevealed ? "scale-100 opacity-100" : "scale-[0.98] opacity-0 blur-sm"
					}`}
				>
					{question.answerText}
				</div>
			)}
		</div>
	);
}
