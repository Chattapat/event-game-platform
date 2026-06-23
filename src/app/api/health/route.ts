export async function GET() {
	return Response.json(
		{
			status: "ok",
			service: "shadow-guessing-game",
			timestamp: new Date().toISOString(),
		},
		{ status: 200 },
	);
}
