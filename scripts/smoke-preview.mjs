const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:8787";
const teacherUrl = `${baseUrl}/teacher/hall?key=teacher-demo`;
const playUrl = `${baseUrl}/play/hall`;
const healthUrl = `${baseUrl}/api/health`;
const gameWsBase = `${baseUrl.replace(/^http/, "ws")}/api/game/hall/ws`;
const gameActionUrl = `${baseUrl}/api/game/hall/action?key=teacher-demo`;

function assert(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

async function readText(url) {
	const response = await fetch(url);
	const text = await response.text();
	assert(response.ok, `Expected ${url} to return 2xx, got ${response.status}`);
	return text;
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

	function nextMessage(predicate, timeoutMs = 5000) {
		const existingIndex = queue.findIndex(predicate);
		if (existingIndex >= 0) {
			return Promise.resolve(queue.splice(existingIndex, 1)[0]);
		}

		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				reject(new Error(`Timed out waiting for websocket message after ${timeoutMs}ms`));
			}, timeoutMs);

			waiters.push((message) => {
				if (!predicate(message)) {
					queue.push(message);
					clearTimeout(timer);
					reject(new Error("Received unexpected websocket message while waiting for a different state"));
					return;
				}

				clearTimeout(timer);
				resolve(message);
			});
		});
	}

	return { socket, nextMessage };
}

async function waitForOpen(socket, timeoutMs = 5000) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error(`Timed out waiting for websocket open after ${timeoutMs}ms`)), timeoutMs);
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
	const response = await fetch(gameActionUrl, {
		method: "POST",
		headers: {
			"content-type": "application/json",
		},
		body: JSON.stringify(action),
	});

	assert(response.ok, `Action ${action.type} failed with status ${response.status}`);
	return response.json();
}

const homeHtml = await readText(baseUrl);
assert(homeHtml.includes("Teacher Control"), "Landing page is missing Teacher Control");
assert(homeHtml.includes("Student Play"), "Landing page is missing Student Play");

const health = await (await fetch(healthUrl)).json();
assert(health.status === "ok", "Health endpoint is not healthy");

const teacherHtml = await readText(teacherUrl);
assert(teacherHtml.includes("<title>Teacher Control | Shadow Guessing Game</title>"), "Teacher title is wrong");

const playHtml = await readText(playUrl);
assert(playHtml.includes("<title>Student Play | Shadow Guessing Game</title>"), "Student title is wrong");

const teacher = createBufferedSocket(`${gameWsBase}?role=host&key=teacher-demo`);
const student = createBufferedSocket(`${gameWsBase}?role=student&playerId=smoke-player`);

await Promise.all([waitForOpen(teacher.socket), waitForOpen(student.socket)]);

const initialStudentSnapshot = await student.nextMessage((message) => message?.type === "snapshot");
assert(initialStudentSnapshot.snapshot?.status, "Student snapshot missing");
await teacher.nextMessage((message) => message?.type === "snapshot");

await postAction({ type: "start-question" });
const acceptingSnapshot = await student.nextMessage((message) => message?.snapshot?.status === "accepting-answers");
assert(acceptingSnapshot.snapshot.questionEndsAtMs, "Question deadline is missing");

student.socket.send(JSON.stringify({ type: "submit-answer", playerId: "smoke-player", choiceId: "A" }));
const answeredSnapshot = await student.nextMessage((message) => message?.snapshot?.hasAnswered === true);
assert(answeredSnapshot.snapshot.hasAnswered === true, "Student answer was not recorded");

teacher.socket.close();
student.socket.close();

console.log("Smoke test passed.");
