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
				<div key={result.choiceId} className="liquid-control rounded-2xl p-3">
					<div className="mb-2 flex items-center justify-between gap-3">
						<div className="text-lg font-semibold">
							{result.choiceId}. {result.text}
							{showCorrectAnswer && result.isCorrect ? <span className="ml-3 text-emerald-600">คำตอบถูก</span> : null}
						</div>
						<div className="text-xl font-bold">{result.percentage}%</div>
					</div>
					<div className="h-3 overflow-hidden rounded-full bg-white/55">
						<div
							className={showCorrectAnswer && result.isCorrect ? "h-full bg-emerald-500" : `h-full ${choiceStyles[result.choiceId].barClassName}`}
							style={{ width: `${result.percentage}%` }}
						/>
					</div>
					<p className="mt-2 text-sm font-semibold text-slate-500">{result.count} คน</p>
				</div>
			))}
		</div>
	);
}
