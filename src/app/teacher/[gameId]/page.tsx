import type { Metadata } from "next";
import { HostGame } from "@/components/game/HostGame";

interface TeacherPageProps {
	params: Promise<{ gameId: string }>;
	searchParams: Promise<{ key?: string }>;
}

export const metadata: Metadata = {
	title: "Teacher Control",
	description: "Teacher control screen for the shadow guessing audience game",
};

export default async function TeacherPage({ params, searchParams }: TeacherPageProps) {
	const { gameId } = await params;
	const { key } = await searchParams;

	return <HostGame gameId={gameId} hostKey={key ?? ""} />;
}
