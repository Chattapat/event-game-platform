import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig: NextConfig = {
	/* config options here */
};

export default async function config(phase: string): Promise<NextConfig> {
	if (phase === PHASE_DEVELOPMENT_SERVER) {
		const { initOpenNextCloudflareForDev } = await import("@opennextjs/cloudflare");
		initOpenNextCloudflareForDev();
	}

	return nextConfig;
}
