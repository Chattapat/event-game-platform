import type { ChoiceId } from "@/types/game";

interface ChoiceStyle {
	panelClassName: string;
	buttonClassName: string;
	barClassName: string;
	label: string;
}

export const choiceStyles: Record<ChoiceId, ChoiceStyle> = {
	A: {
		panelClassName: "border-rose-200/80 bg-rose-200/78 text-rose-950 shadow-rose-300/20",
		buttonClassName: "border-rose-200/80 bg-rose-200/78 text-rose-950 shadow-rose-300/20 hover:bg-rose-300/80",
		barClassName: "bg-rose-300",
		label: "A",
	},
	B: {
		panelClassName: "border-sky-200/80 bg-sky-200/78 text-sky-950 shadow-sky-300/20",
		buttonClassName: "border-sky-200/80 bg-sky-200/78 text-sky-950 shadow-sky-300/20 hover:bg-sky-300/80",
		barClassName: "bg-sky-300",
		label: "B",
	},
	C: {
		panelClassName: "border-amber-200/80 bg-amber-200/82 text-amber-950 shadow-amber-300/20",
		buttonClassName: "border-amber-200/80 bg-amber-200/82 text-amber-950 shadow-amber-300/20 hover:bg-amber-300/80",
		barClassName: "bg-amber-300",
		label: "C",
	},
	D: {
		panelClassName: "border-emerald-200/80 bg-emerald-200/80 text-emerald-950 shadow-emerald-300/20",
		buttonClassName: "border-emerald-200/80 bg-emerald-200/80 text-emerald-950 shadow-emerald-300/20 hover:bg-emerald-300/80",
		barClassName: "bg-emerald-300",
		label: "D",
	},
};
