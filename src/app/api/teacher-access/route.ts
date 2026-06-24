import { getCloudflareContext } from "@opennextjs/cloudflare";

// Gate code for the teacher entry form. Validated server-side so the real
// HOST_KEY is never shipped in the client bundle.
const TEACHER_ACCESS_CODE = "24681357";

interface TeacherAccessBody {
	code?: string;
}

/**
 * Validates the teacher access code and returns the runtime HOST_KEY so the
 * client can open Teacher Control with the correct key. In production HOST_KEY
 * is the encrypted Secret; locally it comes from `.dev.vars`.
 */
export async function POST(request: Request): Promise<Response> {
	let body: TeacherAccessBody;
	try {
		body = (await request.json()) as TeacherAccessBody;
	} catch {
		return Response.json({ error: "รูปแบบคำขอไม่ถูกต้อง" }, { status: 400 });
	}

	const code = body.code?.trim() ?? "";
	if (code !== TEACHER_ACCESS_CODE) {
		return Response.json({ error: "รหัสไม่ถูกต้อง" }, { status: 401 });
	}

	const { env } = await getCloudflareContext({ async: true });
	const hostKey = env.HOST_KEY;
	if (!hostKey) {
		return Response.json({ error: "ระบบยังไม่ได้ตั้งค่า HOST_KEY" }, { status: 500 });
	}

	return Response.json({ key: hostKey }, { status: 200 });
}
