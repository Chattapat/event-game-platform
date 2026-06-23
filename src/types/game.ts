export type ChoiceId = "A" | "B" | "C" | "D";

export type Difficulty = "easy" | "medium" | "hard";

export type GameStatus =
	| "waiting"
	| "accepting-answers"
	| "closed-answers"
	| "showing-result"
	| "revealed"
	| "finished";

export interface Choice {
	id: ChoiceId;
	text: string;
}

export interface Question {
	id: string;
	title: string;
	answerText: string;
	shadowImageUrl: string;
	realImageUrl: string;
	choices: Choice[];
	correctChoiceId: ChoiceId;
	difficulty: Difficulty;
}

export interface ChoiceResult {
	choiceId: ChoiceId;
	text: string;
	count: number;
	percentage: number;
	isCorrect: boolean;
}

export interface GameSnapshot {
	gameId: string;
	status: GameStatus;
	currentQuestionNumber: number;
	totalQuestions: number;
	currentQuestion: Question | null;
	questionStartedAtMs: number | null;
	questionEndsAtMs: number | null;
	questionDurationMs: number;
	selectedChoiceId: ChoiceId | null;
	answeredCount: number;
	playerCount: number;
	hasAnswered: boolean;
	results: ChoiceResult[];
	message: string;
}

export interface ServerMessage {
	type: "snapshot" | "error";
	snapshot?: GameSnapshot;
	message?: string;
}

export type HostActionType =
	| "start-question"
	| "close-answers"
	| "show-result"
	| "reveal-answer"
	| "next-question"
	| "reset-game";

export interface HostAction {
	type: HostActionType;
}

export interface SubmitAnswerAction {
	type: "submit-answer";
	playerId: string;
	choiceId: ChoiceId;
}

export type GameAction = HostAction | SubmitAnswerAction;
