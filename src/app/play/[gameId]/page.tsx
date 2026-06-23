import type { Metadata } from "next";
import { StudentGame } from "@/components/game/StudentGame";

interface PlayPageProps {
	params: Promise<{ gameId: string }>;
}

export const metadata: Metadata = {
	title: "Student Play",
	description: "Student answer screen for the shadow guessing audience game",
};

export default async function PlayPage({ params }: PlayPageProps) {
	const { gameId } = await params;

	return <StudentGame gameId={gameId} />;
}
