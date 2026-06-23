import { getQuestions } from "@/data/questions";
import type { ChoiceId, ChoiceResult, GameSnapshot, GameStatus, Question } from "@/types/game";

export interface GameState {
	gameId: string;
	status: GameStatus;
	questionIndex: number;
	questionStartedAtMs: number | null;
	questionEndsAtMs: number | null;
	answersByQuestion: Record<string, Record<string, ChoiceId>>;
}

export const initialGameState = (gameId: string): GameState => ({
	gameId,
	status: "waiting",
	questionIndex: 0,
	questionStartedAtMs: null,
	questionEndsAtMs: null,
	answersByQuestion: {},
});

export function getCurrentQuestion(state: GameState): Question | null {
	const questionSet = getQuestions();
	return questionSet[state.questionIndex] ?? null;
}

export function getTotalQuestions(): number {
	return getQuestions().length;
}

export function getAnsweredCount(state: GameState): number {
	const question = getCurrentQuestion(state);
	if (!question) {
		return 0;
	}

	return Object.keys(state.answersByQuestion[question.id] ?? {}).length;
}

export function getChoiceResults(state: GameState): ChoiceResult[] {
	const question = getCurrentQuestion(state);
	if (!question) {
		return [];
	}

	const answerMap = state.answersByQuestion[question.id] ?? {};
	const totalAnswers = Object.keys(answerMap).length;

	return question.choices.map((choice) => {
		const count = Object.values(answerMap).filter((choiceId) => choiceId === choice.id).length;
		const percentage = totalAnswers === 0 ? 0 : Math.round((count / totalAnswers) * 100);

		return {
			choiceId: choice.id,
			text: choice.text,
			count,
			percentage,
			isCorrect: choice.id === question.correctChoiceId,
		};
	});
}

export function hasPlayerAnswered(state: GameState, playerId: string | null): boolean {
	const question = getCurrentQuestion(state);
	if (!question || !playerId) {
		return false;
	}

	return Boolean(state.answersByQuestion[question.id]?.[playerId]);
}

export function createSnapshot(state: GameState, playerCount: number, playerId: string | null = null): GameSnapshot {
	const question = getCurrentQuestion(state);
	const totalQuestions = getTotalQuestions();
	const selectedChoiceId = question && playerId ? state.answersByQuestion[question.id]?.[playerId] ?? null : null;

	return {
		gameId: state.gameId,
		status: state.status,
		currentQuestionNumber: question ? state.questionIndex + 1 : 0,
		totalQuestions,
		currentQuestion: question,
		questionStartedAtMs: state.questionStartedAtMs,
		questionEndsAtMs: state.questionEndsAtMs,
		questionDurationMs: 15000,
		selectedChoiceId,
		answeredCount: getAnsweredCount(state),
		playerCount,
		hasAnswered: hasPlayerAnswered(state, playerId),
		results: state.status === "showing-result" || state.status === "revealed" ? getChoiceResults(state) : [],
		message: getStatusMessage(state.status),
	};
}

function getStatusMessage(status: GameStatus): string {
	switch (status) {
		case "waiting":
			return "สแกน QR เพื่อเข้าร่วมเกม";
		case "accepting-answers":
			return "เปิดรับคำตอบ";
		case "closed-answers":
			return "ปิดรับคำตอบแล้ว";
		case "showing-result":
			return "แสดงผลโหวต";
		case "revealed":
			return "เฉลยคำตอบ";
		case "finished":
			return "จบเกมแล้ว";
	}
}
