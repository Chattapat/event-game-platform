"use client";

import { useEffect, useState } from "react";

interface UseQuestionCountdownOptions {
	endsAtMs: number | null;
	isActive: boolean;
}

export function useQuestionCountdown({ endsAtMs, isActive }: UseQuestionCountdownOptions): number | null {
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		if (!isActive || !endsAtMs) {
			return undefined;
		}

		const timer = window.setInterval(() => {
			setNow(() => Date.now());
		}, 250);

		return () => {
			window.clearInterval(timer);
		};
	}, [endsAtMs, isActive]);

	if (!isActive || !endsAtMs) {
		return null;
	}

	return Math.max(0, Math.ceil((endsAtMs - now) / 1000));
}
