type LogLevel = "info" | "warn" | "error";

interface RuntimeLogFields {
	gameId?: string;
	role?: string;
	action?: string;
	status?: string;
	message?: string;
	[key: string]: unknown;
}

function writeLog(level: LogLevel, event: string, fields: RuntimeLogFields = {}): void {
	const payload = {
		level,
		event,
		timestamp: new Date().toISOString(),
		...fields,
	};

	const line = JSON.stringify(payload);

	if (level === "error") {
		console.error(line);
		return;
	}

	if (level === "warn") {
		console.warn(line);
		return;
	}

	console.info(line);
}

export function logInfo(event: string, fields: RuntimeLogFields = {}): void {
	writeLog("info", event, fields);
}

export function logWarn(event: string, fields: RuntimeLogFields = {}): void {
	writeLog("warn", event, fields);
}

export function logError(event: string, fields: RuntimeLogFields = {}): void {
	writeLog("error", event, fields);
}
