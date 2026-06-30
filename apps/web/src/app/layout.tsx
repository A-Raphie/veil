import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { NavBar } from "@/components/nav-bar";
import { ToastViewport } from "@/components/toast";

export const metadata: Metadata = {
  title: "Confidential Wrapper Registry",
  description:
    "Browse, wrap, unwrap, and decrypt ERC-7984 confidential tokens on Zama FHEVM. Sepolia faucet for official cTokenMocks.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <Providers>
          <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4">
            <NavBar />
            <main className="flex-1 py-8">{children}</main>
            <footer className="border-t py-6 text-center text-xs text-slate-500">
              Confidential Wrapper Registry · Built on Zama FHEVM · Sepolia + Ethereum mainnet
            </footer>
          </div>
          <ToastViewport />
        </Providers>
      </body>
    </html>
  );
}
