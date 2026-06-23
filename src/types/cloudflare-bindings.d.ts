interface CloudflareEnv {
	GAME_ROOM: DurableObjectNamespace<import("@/worker/game-room").GameRoom>;
	HOST_KEY?: string;
}
