import { choiceStyles } from "@/lib/choice-styles";
import type { ChoiceResult } from "@/types/game";

interface ResultBarsProps {
	results: ChoiceResult[];
	showCorrectAnswer: boolean;
}

export function ResultBars({ results, showCorrectAnswer }: ResultBarsProps) {
	if (results.length === 0) {
		return null;
	}

	return (
		<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
			{results.map((result) => (
				<div key={result.choiceId} className="liquid-control rounded-3xl p-4">
					<div className="mb-2 flex items-center justify-between gap-3">
						<div className="text-lg font-bold">
							{result.choiceId}. {result.text}
							{showCorrectAnswer && result.isCorrect ? <span className="ml-3 rounded-full bg-emerald-100 px-2 py-1 text-sm text-emerald-700">คำตอบถูก</span> : null}
						</div>
						<div className="text-2xl font-black">{result.percentage}%</div>
					</div>
					<div className="h-3 overflow-hidden rounded-full bg-white/55">
						<div
							className={`h-full transition-[width] duration-500 ease-out ${showCorrectAnswer && result.isCorrect ? "bg-emerald-500" : choiceStyles[result.choiceId].barClassName}`}
							style={{ width: `${result.percentage}%` }}
						/>
					</div>
					<p className="mt-2 text-sm font-semibold text-slate-500">{result.count} คน</p>
				</div>
			))}
		</div>
	);
}
