import type { GameStatus, HostActionType } from "@/types/game";

export interface HostActionAvailability {
	enabled: boolean;
	helperText: string;
}

export function getHostActionAvailability(
	status: GameStatus,
	actionType: HostActionType,
	currentQuestionNumber: number,
): HostActionAvailability {
	switch (actionType) {
		case "start-question":
			return {
				enabled: status === "waiting",
				helperText: "ใช้เริ่มเกมหรือเริ่มข้อแรก",
			};
		case "close-answers":
			return {
				enabled: status === "accepting-answers",
				helperText: "ปิดรับคำตอบก่อนหมดเวลาได้",
			};
		case "reveal-answer":
			return {
				enabled: status === "closed-answers",
				helperText: "เฉลยภาพจริงและแสดงผลโหวต",
			};
		case "next-question":
			return {
				enabled: status === "revealed" && currentQuestionNumber > 0,
				helperText: "ไปข้อถัดไปหลังเฉลย",
			};
		case "reset-game":
			return {
				enabled: status !== "waiting",
				helperText: "ล้างสถานะเกมและเริ่มใหม่",
			};
	}
}

export function getRecommendedHostAction(status: GameStatus): HostActionType | null {
	switch (status) {
		case "waiting":
			return "start-question";
		case "accepting-answers":
			return "close-answers";
		case "closed-answers":
			return "reveal-answer";
		case "revealed":
			return "next-question";
		case "finished":
			return "reset-game";
	}
}
