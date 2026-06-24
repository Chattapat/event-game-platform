import type { Metadata } from "next";
import { Kanit, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const headingFont = Kanit({
	subsets: ["latin", "thai"],
	weight: ["500", "600", "700", "800"],
	variable: "--font-heading",
	display: "swap",
});

const bodyFont = Noto_Sans_Thai({
	subsets: ["latin", "thai"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-body",
	display: "swap",
});

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
		<body className={`${headingFont.variable} ${bodyFont.variable}`}>{children}</body>
	</html>
	);
}
