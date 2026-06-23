import { DurableObject } from "cloudflare:workers";
import { getQuestions } from "@/data/questions";
import { createSnapshot, getCurrentQuestion, initialGameState, type GameState } from "@/lib/game-engine";
import { logError, logInfo, logWarn } from "@/lib/runtime-log";
import type { ChoiceId, GameAction, HostAction, ServerMessage } from "@/types/game";

const QUESTION_DURATION_MS = 15_000;

interface ClientMeta {
	role: "host" | "student";
	playerId: string | null;
	canControl: boolean;
}

interface GameRoomEnv {
	HOST_KEY?: string;
}

export class GameRoom extends DurableObject<GameRoomEnv> {
	private state: GameState | null = null;
	private readonly clients = new Map<WebSocket, ClientMeta>();

	constructor(ctx: DurableObjectState, env: GameRoomEnv) {
		super(ctx, env);
	}

	async fetch(request: Request): Promise<Response> {
		await this.ensureState(request);

		const url = new URL(request.url);
		const pathParts = url.pathname.split("/").filter(Boolean);
		const route = pathParts[pathParts.length - 1];

		if (route === "ws") {
			logInfo("game_room.ws_open", { gameId: this.state?.gameId ?? "hall" });
			return this.handleWebSocket(request);
		}

		if (route === "action" && request.method === "POST") {
			return this.handleHttpAction(request);
		}

		return Response.json(this.getSnapshot(), { status: 200 });
	}

	async alarm(): Promise<void> {
		if (!this.state) {
			return;
		}

		if (this.state.status !== "accepting-answers") {
			return;
		}

		if (!this.state.questionEndsAtMs || Date.now() < this.state.questionEndsAtMs) {
			return;
		}

		this.state.status = "closed-answers";
		logInfo("question.timeout_closed", { gameId: this.state.gameId, status: this.state.status });
		await this.persistAndBroadcast();
	}

	private async ensureState(request: Request): Promise<void> {
		if (this.state) {
			return;
		}

		const url = new URL(request.url);
		const gameId = url.pathname.split("/").filter(Boolean)[2] ?? "hall";
		const persistedState = await this.ctx.storage.get<GameState>("state");
		this.state = persistedState ?? initialGameState(gameId);
	}

	private handleWebSocket(request: Request): Response {
		if (request.headers.get("Upgrade") !== "websocket") {
			return new Response("Expected websocket upgrade", { status: 426 });
		}

		const url = new URL(request.url);
		const role = url.searchParams.get("role") === "host" ? "host" : "student";
		const playerId = url.searchParams.get("playerId");
		const canControl = role === "host" && url.searchParams.get("key") === this.env.HOST_KEY;
		const pair = new WebSocketPair();
		const [client, server] = Object.values(pair);

		server.accept();
		this.clients.set(server, { role, playerId, canControl });
		this.sendSnapshot(server);

		server.addEventListener("message", (event) => {
			this.handleSocketMessage(server, event.data).catch((error: unknown) => {
				this.sendError(server, error instanceof Error ? error.message : "Action failed");
			});
		});

		server.addEventListener("close", () => {
			this.clients.delete(server);
			this.broadcast();
		});

		server.addEventListener("error", () => {
			this.clients.delete(server);
			this.broadcast();
		});

		this.broadcast();

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	private async handleHttpAction(request: Request): Promise<Response> {
		const action = (await request.json()) as GameAction;
		const url = new URL(request.url);
		const canControl = url.searchParams.get("key") === this.env.HOST_KEY;

		await this.applyAction(action, canControl);
		return Response.json(this.getSnapshot(), { status: 200 });
	}

	private async handleSocketMessage(socket: WebSocket, rawData: string | ArrayBuffer): Promise<void> {
		const meta = this.clients.get(socket);
		if (!meta) {
			return;
		}

		const action = JSON.parse(typeof rawData === "string" ? rawData : new TextDecoder().decode(rawData)) as GameAction;
		await this.applyAction(action, meta.canControl, meta.playerId);
	}

	private async applyAction(action: GameAction, canControl: boolean, socketPlayerId: string | null = null): Promise<void> {
		if (!this.state) {
			throw new Error("Game state is not ready");
		}

		if (action.type === "submit-answer") {
			this.submitAnswer(socketPlayerId ?? action.playerId, action.choiceId);
			logInfo("game_room.answer_submitted", {
				gameId: this.state.gameId,
				playerId: socketPlayerId ?? action.playerId,
				choiceId: action.choiceId,
				status: this.state.status,
			});
			await this.persistAndBroadcast();
			return;
		}

		if (!canControl) {
			throw new Error("Teacher key is required");
		}

		await this.applyHostAction(action);
		await this.persistAndBroadcast();
	}

	private async applyHostAction(action: HostAction): Promise<void> {
		if (!this.state) {
			return;
		}

		const now = Date.now();

		switch (action.type) {
			case "start-question":
				if (this.state.status === "waiting") {
					this.state.questionIndex = 0;
					this.state.questionStartedAtMs = null;
					this.state.questionEndsAtMs = null;
					await this.ctx.storage.deleteAlarm();
				}
				await this.startQuestion(now);
				logInfo("game_room.start_question", {
					gameId: this.state.gameId,
					status: this.state.status,
					questionEndsAtMs: this.state.questionEndsAtMs,
				});
				break;
			case "close-answers":
				this.state.status = "closed-answers";
				this.state.questionEndsAtMs = now;
				await this.ctx.storage.deleteAlarm();
				logInfo("game_room.close_answers", { gameId: this.state.gameId, status: this.state.status });
				break;
			case "show-result":
				this.state.status = "showing-result";
				await this.ctx.storage.deleteAlarm();
				logInfo("game_room.show_result", { gameId: this.state.gameId, status: this.state.status });
				break;
			case "reveal-answer":
				this.state.status = "revealed";
				await this.ctx.storage.deleteAlarm();
				logInfo("game_room.reveal_answer", { gameId: this.state.gameId, status: this.state.status });
				break;
			case "next-question":
				await this.goToNextQuestion();
				logInfo("game_room.next_question", {
					gameId: this.state.gameId,
					status: this.state.status,
					questionIndex: this.state.questionIndex,
				});
				break;
			case "reset-game":
				this.state = initialGameState(this.state.gameId);
				await this.ctx.storage.deleteAlarm();
				logInfo("game_room.reset_game", { gameId: this.state.gameId, status: this.state.status });
				break;
		}
	}

	private async submitAnswer(playerId: string, choiceId: ChoiceId): Promise<void> {
		if (!this.state) {
			throw new Error("Game state is not ready");
		}

		await this.expireQuestionIfNeeded();

		if (this.state.status !== "accepting-answers") {
			throw new Error("Answers are closed");
		}

		const question = getCurrentQuestion(this.state);
		if (!question) {
			throw new Error("No active question");
		}

		const answerMap = this.state.answersByQuestion[question.id] ?? {};
		if (answerMap[playerId]) {
			logWarn("game_room.double_answer_attempt", { gameId: this.state.gameId, playerId, choiceId });
			throw new Error("This device already answered");
		}

		this.state.answersByQuestion[question.id] = {
			...answerMap,
			[playerId]: choiceId,
		};
	}

	private async goToNextQuestion(): Promise<void> {
		if (!this.state) {
			return;
		}

		const questionSet = getQuestions();
		const nextIndex = this.state.questionIndex + 1;

		if (nextIndex >= questionSet.length) {
			this.state.status = "finished";
			this.state.questionStartedAtMs = null;
			this.state.questionEndsAtMs = null;
			await this.ctx.storage.deleteAlarm();
			return;
		}

		this.state.questionIndex = nextIndex;
		await this.startQuestion(Date.now());
	}

	private async startQuestion(now: number): Promise<void> {
		if (!this.state) {
			return;
		}

		this.state.status = "accepting-answers";
		this.state.questionStartedAtMs = now;
		this.state.questionEndsAtMs = now + QUESTION_DURATION_MS;
		await this.ctx.storage.setAlarm(this.state.questionEndsAtMs);
	}

	private async expireQuestionIfNeeded(): Promise<void> {
		if (!this.state || this.state.status !== "accepting-answers") {
			return;
		}

		if (!this.state.questionEndsAtMs || Date.now() < this.state.questionEndsAtMs) {
			return;
		}

		this.state.status = "closed-answers";
		await this.ctx.storage.deleteAlarm();
	}

	private async persistAndBroadcast(): Promise<void> {
		if (!this.state) {
			return;
		}

		await this.ctx.storage.put("state", this.state);
		this.broadcast();
	}

	private broadcast(): void {
		for (const socket of this.clients.keys()) {
			this.sendSnapshot(socket);
		}
	}

	private sendSnapshot(socket: WebSocket): void {
		const meta = this.clients.get(socket);
		const message: ServerMessage = {
			type: "snapshot",
			snapshot: this.getSnapshot(meta?.playerId ?? null),
		};
		socket.send(JSON.stringify(message));
	}

	private sendError(socket: WebSocket, message: string): void {
		logError("game_room.socket_error", { gameId: this.state?.gameId ?? "unknown", message });
		const errorMessage: ServerMessage = {
			type: "error",
			message,
		};
		socket.send(JSON.stringify(errorMessage));
	}

	private getSnapshot(playerId: string | null = null) {
		if (!this.state) {
			return createSnapshot(initialGameState("hall"), this.getStudentCount(), playerId);
		}

		return createSnapshot(this.state, this.getStudentCount(), playerId);
	}

	private getStudentCount(): number {
		return Array.from(this.clients.values()).filter((client) => client.role === "student").length;
	}
}
