/**
 * Relayer proxy — injects the Zama relayer API key server-side so the browser
 * never sees it. The @zama-fhe/react-sdk browser relayer points at this route
 * (see config/networks.ts: relayerUrl = "/api/relayer/11155111").
 *
 * Forwards method + path + body upstream to the configured Zama-hosted relayer
 * and streams the response back. Only the chain id is dynamic in the path.
 *
 * Docs: docs.zama.org/protocol/sdk/guides/authentication.md
 */
import { NextRequest, NextResponse } from "next/server";

const RELAYER_API_KEY = process.env.RELAYER_API_KEY;
// Per-chain upstream host. The @zama-fhe/sdk `sepolia` preset carries the real
// Zama-hosted relayer URL; we mirror it here for the proxy to forward to.
// Override via env if Zama rotates the host.
const SEPOLIA_RELAYER_URL =
  process.env.SEPOLIA_RELAYER_URL ??
  "https://relayer-sepolia.zama.ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(req: NextRequest, context: { params: Promise<{ chainId: string }> }) {
  const { chainId } = await context.params;

  if (!RELAYER_API_KEY) {
    return NextResponse.json(
      { error: "Relayer proxy is not configured (missing RELAYER_API_KEY)." },
      { status: 503 },
    );
  }

  const upstreamBase =
    chainId === "11155111" ? SEPOLIA_RELAYER_URL : null;
  if (!upstreamBase) {
    return NextResponse.json(
      { error: `Unsupported chain id: ${chainId}` },
      { status: 400 },
    );
  }

  // Preserve the sub-path after /api/relayer/[chainId] (the SDK appends its own paths).
  const url = new URL(req.url);
  const subPath = url.pathname.replace(/^\/api\/relayer\/[^/]+/, "");
  const upstream = `${upstreamBase}${subPath}${url.search}`;

  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-api-key": RELAYER_API_KEY,
  };

  const init: RequestInit & { duplex?: "half" } = {
    method: req.method,
    headers,
    // `duplex: "half"` is required by fetch for requests with a streaming body.
    duplex: "half",
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  try {
    const upstreamRes = await fetch(upstream, init);
    const contentType = upstreamRes.headers.get("content-type") ?? "application/json";
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
