const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:8787";
const gameId = process.env.GAME_ID ?? "hall";
const hostKey = process.env.HOST_KEY ?? "teacher-demo";
const studentCount = Number.parseInt(process.env.STUDENT_COUNT ?? "1000", 10);
const rampBatchSize = Number.parseInt(process.env.RAMP_BATCH_SIZE ?? "100", 10);
const rampDelayMs = Number.parseInt(process.env.RAMP_DELAY_MS ?? "250", 10);
const timeoutMs = Number.parseInt(process.env.TIMEOUT_MS ?? "15000", 10);

const teacherUrl = `${baseUrl}/teacher/${gameId}?key=${encodeURIComponent(hostKey)}`;
const playUrl = `${baseUrl}/play/${gameId}`;
const healthUrl = `${baseUrl}/api/health`;
const wsUrl = `${baseUrl.replace(/^http/, "ws")}/api/game/${gameId}/ws`;
const actionUrl = `${baseUrl}/api/game/${gameId}/action?key=${encodeURIComponent(hostKey)}`;

function assert(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

async function readOkText(url) {
	const response = await fetch(url);
	const text = await response.text();
	assert(response.ok, `Expected ${url} to return 2xx, got ${response.status}`);
	return text;
}

function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function createBufferedSocket(url) {
	const socket = new WebSocket(url);
	const queue = [];
	const waiters = [];

	socket.addEventListener("message", (event) => {
		let parsed;

		try {
			parsed = JSON.parse(event.data);
		} catch {
			return;
		}

		if (waiters.length > 0) {
			const waiter = waiters.shift();
			waiter(parsed);
			return;
		}

		queue.push(parsed);
	});

	function nextMessage(predicate, localTimeoutMs = timeoutMs) {
		const existingIndex = queue.findIndex(predicate);
		if (existingIndex >= 0) {
			return Promise.resolve(queue.splice(existingIndex, 1)[0]);
		}

		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				reject(new Error(`Timed out waiting for websocket message after ${localTimeoutMs}ms`));
			}, localTimeoutMs);

			waiters.push((message) => {
				if (!predicate(message)) {
					queue.push(message);
					clearTimeout(timer);
					reject(new Error("Received unexpected websocket message while waiting for another state"));
					return;
				}

				clearTimeout(timer);
				resolve(message);
			});
		});
	}

	return { socket, nextMessage };
}

async function waitForOpen(socket, localTimeoutMs = timeoutMs) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error(`Timed out waiting for websocket open after ${localTimeoutMs}ms`)), localTimeoutMs);
		socket.addEventListener("open", () => {
			clearTimeout(timer);
			resolve();
		});
		socket.addEventListener("error", () => {
			clearTimeout(timer);
			reject(new Error("WebSocket error"));
		});
	});
}

async function postAction(action) {
	const response = await fetch(actionUrl, {
		method: "POST",
		headers: {
			"content-type": "application/json",
		},
		body: JSON.stringify(action),
	});

	assert(response.ok, `Action ${action.type} failed with status ${response.status}`);
	return response.json();
}

function chunk(items, size) {
	const groups = [];
	for (let index = 0; index < items.length; index += size) {
		groups.push(items.slice(index, index + size));
	}
	return groups;
}

const startedAt = Date.now();

await readOkText(baseUrl);
await readOkText(teacherUrl);
await readOkText(playUrl);
const health = await (await fetch(healthUrl)).json();
assert(health.status === "ok", "Health endpoint is not healthy");

const teacher = createBufferedSocket(`${wsUrl}?role=host&key=${encodeURIComponent(hostKey)}`);
await waitForOpen(teacher.socket);
await teacher.nextMessage((message) => message?.type === "snapshot");

const students = Array.from({ length: studentCount }, (_, index) =>
	createBufferedSocket(`${wsUrl}?role=student&playerId=load-${String(index + 1).padStart(4, "0")}`),
);

let connected = 0;
for (const group of chunk(students, rampBatchSize)) {
	await Promise.all(group.map(({ socket }) => waitForOpen(socket)));
	connected += group.length;
	process.stdout.write(`Connected ${connected}/${studentCount}\r`);
	if (rampDelayMs > 0 && connected < studentCount) {
		await wait(rampDelayMs);
	}
}
process.stdout.write("\n");

await Promise.all(students.map(({ nextMessage }) => nextMessage((message) => message?.type === "snapshot")));

await postAction({ type: "start-question" });
await Promise.all(students.map(({ nextMessage }) => nextMessage((message) => message?.snapshot?.status === "accepting-answers")));

const answerSampleSize = Math.min(100, students.length);
await Promise.all(
	students.slice(0, answerSampleSize).map(({ socket }, index) => {
		socket.send(JSON.stringify({ type: "submit-answer", playerId: `load-${String(index + 1).padStart(4, "0")}`, choiceId: "A" }));
		return Promise.resolve();
	}),
);

await Promise.all(
	students.slice(0, answerSampleSize).map(({ nextMessage }) => nextMessage((message) => message?.snapshot?.hasAnswered === true)),
);

const endedAt = Date.now();
const elapsedMs = endedAt - startedAt;

for (const { socket } of students) {
	socket.close();
}
teacher.socket.close();

console.log(
	JSON.stringify(
		{
			ok: true,
			baseUrl,
			gameId,
			studentCount,
			answerSampleSize,
			elapsedMs,
			studentsPerSecond: Number((studentCount / (elapsedMs / 1000)).toFixed(2)),
		},
		null,
		2,
	),
);
