/**
 * Relayer proxy — MAINNET ONLY.
 *
 * The Sepolia testnet relayer (https://relayer.testnet.zama.org/v2) is open and
 * needs no key, so the SDK calls it directly (see config/networks.ts). This route
 * exists solely for MAINNET, whose relayer gates every request behind an x-api-key.
 * We inject the key server-side so the browser never sees it.
 *
 * If a request arrives for chain 11155111 (Sepolia), something is misconfigured —
 * Sepolia should never route through here.
 */
import { NextRequest, NextResponse } from "next/server";

const RELAYER_API_KEY = process.env.RELAYER_API_KEY;
const MAINNET_RELAYER_URL =
  process.env.MAINNET_RELAYER_URL ?? "https://relayer.mainnet.zama.org/v2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(
  req: NextRequest,
  context: { params: Promise<{ chainId: string }> },
) {
  const { chainId } = await context.params;

  if (chainId === "11155111") {
    // Sepolia bypasses the proxy — this route should never be hit for it.
    return NextResponse.json(
      { error: "Sepolia relayer is open and called directly; this proxy is mainnet-only." },
      { status: 400 },
    );
  }

  if (chainId !== "1") {
    return NextResponse.json(
      { error: `Unsupported chain id: ${chainId}` },
      { status: 400 },
    );
  }

  if (!RELAYER_API_KEY) {
    return NextResponse.json(
      { error: "Mainnet relayer proxy is not configured (missing RELAYER_API_KEY)." },
      { status: 503 },
    );
  }

  // Preserve the sub-path after /api/relayer/[chainId] (the SDK appends its own paths).
  const url = new URL(req.url);
  const subPath = url.pathname.replace(/^\/api\/relayer\/[^/]+/, "");
  const upstream = `${MAINNET_RELAYER_URL}${subPath}${url.search}`;

  const init: RequestInit & { duplex?: "half" } = {
    method: req.method,
    headers: {
      "content-type": "application/json",
      "x-api-key": RELAYER_API_KEY,
    },
    // `duplex: "half"` is required by fetch for requests with a streaming body.
    duplex: "half",
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  try {
    const upstreamRes = await fetch(upstream, init);
    const contentType =
      upstreamRes.headers.get("content-type") ?? "application/json";
    const text = await upstreamRes.text();
    return new NextResponse(text, {
      status: upstreamRes.status,
      headers: { "content-type": contentType },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Relayer proxy fetch failed", detail: (err as Error).message },
      { status: 502 },
    );
  }
}

export const GET = handler;
export const POST = handler;
export const DELETE = handler;
