import type { Metadata } from "next";
import { DisplayGame } from "@/components/game/DisplayGame";

interface DisplayPageProps {
	params: Promise<{ gameId: string }>;
}

export const metadata: Metadata = {
	title: "Game Display",
	description: "Big-screen audience display for the shadow guessing game",
};

export default async function DisplayPage({ params }: DisplayPageProps) {
	const { gameId } = await params;

	return <DisplayGame gameId={gameId} />;
}
