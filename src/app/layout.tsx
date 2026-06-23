import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: {
		default: "Shadow Guessing Game",
		template: "%s | Shadow Guessing Game",
	},
	description: "Audience shadow guessing game for school events",
	icons: {
		icon: "/favicon.png",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
	<html lang="th">
		<body>{children}</body>
	</html>
	);
}
