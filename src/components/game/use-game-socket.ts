"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameAction, GameSnapshot, ServerMessage } from "@/types/game";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface UseGameSocketOptions {
	gameId: string;
	role: "host" | "student";
	hostKey?: string;
}

interface UseGameSocketResult {
	status: ConnectionStatus;
	snapshot: GameSnapshot | null;
	errorMessage: string | null;
	playerId: string | null;
	sendAction: (action: GameAction) => void;
}

function createPlayerId(gameId: string): string {
	const storageKey = `shadow-game:${gameId}:player-id`;
	const existingId = window.localStorage.getItem(storageKey);

	if (existingId) {
		return existingId;
	}

	const newId = window.crypto.randomUUID();
	window.localStorage.setItem(storageKey, newId);

	return newId;
}

export function useGameSocket({ gameId, role, hostKey }: UseGameSocketOptions): UseGameSocketResult {
	const [status, setStatus] = useState<ConnectionStatus>("connecting");
	const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [playerId] = useState<string | null>(() => {
		if (typeof window === "undefined" || role !== "student") {
			return null;
		}

		return createPlayerId(gameId);
	});
	const socketRef = useRef<WebSocket | null>(null);

	useEffect(() => {
		const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
		const params = new URLSearchParams({ role });

		if (playerId) {
			params.set("playerId", playerId);
		}

		if (hostKey) {
			params.set("key", hostKey);
		}

		const socket = new WebSocket(`${protocol}//${window.location.host}/api/game/${gameId}/ws?${params.toString()}`);
		socketRef.current = socket;

		socket.addEventListener("open", () => {
			setStatus("connected");
		});

		socket.addEventListener("message", (event) => {
			const message = JSON.parse(event.data as string) as ServerMessage;

			if (message.type === "snapshot" && message.snapshot) {
				setSnapshot(message.snapshot);
				setErrorMessage(null);
				return;
			}

			if (message.type === "error") {
				setErrorMessage(message.message ?? "เกิดข้อผิดพลาด");
			}
		});

		socket.addEventListener("close", () => {
			setStatus("disconnected");
		});

		socket.addEventListener("error", () => {
			setStatus("disconnected");
			setErrorMessage("เชื่อมต่อเกมไม่ได้ ลอง refresh หน้านี้อีกครั้ง");
		});

		return () => {
			socket.close();
		};
	}, [gameId, hostKey, playerId, role]);

	const sendAction = useCallback((action: GameAction) => {
		const socket = socketRef.current;

		if (!socket || socket.readyState !== WebSocket.OPEN) {
			setErrorMessage("ยังไม่เชื่อมต่อเกม");
			return;
		}

		socket.send(JSON.stringify(action));
	}, []);

	return useMemo(
		() => ({
			status,
			snapshot,
			errorMessage,
			playerId,
			sendAction,
		}),
		[errorMessage, playerId, sendAction, snapshot, status],
	);
}
