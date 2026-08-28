import { cacheLife, cacheTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchGovernanceConfigFromChain } from "@/lib/getGovernanceConfig";
import { getRpcUrlForEndpoint, type RpcEnvSource } from "@/lib/getRpcUrls";
import type { RpcNetwork } from "@/types";

const REVALIDATE_SECONDS = 3600; // 1 hour

const governanceConfigQuerySchema = z.object({
  endpoint: z.enum(["mainnet", "testnet", "devnet"]).default("mainnet"),
});

async function getCachedGovernanceConfig(endpoint: RpcNetwork) {
  // Remote: in-memory cache doesn't persist across serverless requests; remote gives shared cache and fewer RPC hits.
  // Cache key includes endpoint so mainnet/testnet/devnet have separate entries.
  "use cache: remote";
  cacheTag("governance-config", endpoint);
  cacheLife({ revalidate: REVALIDATE_SECONDS });
  const rpcUrl = getRpcUrlForEndpoint(endpoint, process.env as RpcEnvSource);
  return fetchGovernanceConfigFromChain(rpcUrl);
}

/**
 * GET /api/governance/config?endpoint=mainnet|testnet|devnet
 * Returns the on-chain governance config (cached server-side). RPC URLs come from
 * server-only environment variables via `getRpcUrlForEndpoint`.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = governanceConfigQuerySchema.safeParse({
      endpoint: searchParams.get("endpoint") ?? "mainnet",
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const message =
        flat.fieldErrors.endpoint?.[0] ??
        flat.formErrors[0] ??
        parsed.error.message;
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { endpoint } = parsed.data;
    const config = await getCachedGovernanceConfig(endpoint);
    return NextResponse.json(config);
  } catch (e) {
    // Do not return or log an upstream message: fetch libraries may include the
    // credential-bearing RPC URL in it.
    console.error("Failed to fetch governance config", {
      errorName: e instanceof Error ? e.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Failed to fetch governance config" },
      { status: 500 },
    );
  }
}
