/** @type {import('next').NextConfig} */
const nextConfig = {
  // ---- Cross-origin isolation: REQUIRED for FHE WASM (SharedArrayBuffer) ----
  // The @zama-fhe/react-sdk loads FHE WASM in a Web Worker which needs
  // SharedArrayBuffer; that requires COOP/COEP headers on every response.
  // NOTE: set via next.config headers() (NOT middleware.ts), because Next.js
  // does not reliably apply middleware-set headers to prerendered/static
  // responses. Cross-origin resources (wallet popups, CDN fonts) may need
  // crossorigin="anonymous" or CORP headers.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
  reactStrictMode: true,
  // transpilePackages so workspace source (TS) packages are compiled by Next.
  transpilePackages: [
    "@wrapper-registry/contracts",
    "@wrapper-registry/registry-config",
  ],
};

export default nextConfig;
