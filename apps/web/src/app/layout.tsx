import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "./providers";
import { NavBar } from "@/components/nav-bar";
import { ToastViewport } from "@/components/toast";

// The live production URL. Used as the metadataBase fallback so OG/Twitter
// cards resolve correctly even when NEXT_PUBLIC_SITE_URL isn't set at build.
const LIVE_URL = "https://veil-registry.vercel.app";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL &&
  /^https?:\/\//.test(process.env.NEXT_PUBLIC_SITE_URL)
    ? process.env.NEXT_PUBLIC_SITE_URL
    : LIVE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Veil — encrypted by default, yours to reveal",
    template: "%s · Veil",
  },
  description:
    "Veil: wrap, unwrap & decrypt ERC-7984 confidential tokens on Zama FHEVM. Sepolia faucet for official cTokenMocks, live on-chain registry, EIP-712 decryption.",
  applicationName: "Veil",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    title: "Veil — encrypted by default, yours to reveal",
    description:
      "Wrap, unwrap & decrypt ERC-7984 confidential tokens on Zama FHEVM. Balances hidden on-chain, decrypted only with your cryptographic permission.",
    siteName: "Veil",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Veil — Encrypted by default. Yours to reveal." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Veil — encrypted by default, yours to reveal",
    description:
      "Wrap, unwrap & decrypt ERC-7984 confidential tokens on Zama FHEVM.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e1a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen antialiased">
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
          >
            Skip to content
          </a>
          {/* Full-bleed shell: backgrounds edge-to-edge, content centered. */}
          <div className="flex min-h-screen flex-col">
            <div className="border-b">
              <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6">
                <NavBar />
              </div>
            </div>
            <main id="main" className="flex-1">
              {children}
            </main>
            <footer className="border-t">
              <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6">
                <p className="text-center text-xs text-slate-400">
                  Built on Zama FHEVM by{" "}
                  <a
                    href="https://x.com/a_raphie"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-400 underline decoration-dotted hover:text-brand-300"
                  >
                    A_Raphie
                  </a>{" "}
                  <span className="text-slate-500">· Sepolia testnet</span>
                </p>
              </div>
            </footer>
          </div>
          <ToastViewport />
        </Providers>
      </body>
    </html>
  );
}
