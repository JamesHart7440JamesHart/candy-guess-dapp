import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Karla, VT323 } from "next/font/google";

const karla = Karla({ subsets: ["latin"], variable: "--font-karla" });
const vt323 = VT323({ subsets: ["latin"], weight: "400", variable: "--font-vt323" });

/**
 * Application Metadata Configuration
 *
 * Defines SEO-friendly metadata and favicon configuration for the GuessNumber DApp.
 * Uses simple icon path to avoid hydration issues with complex metadata objects.
 */
export const metadata: Metadata = {
  title: "GuessNumber | Privacy-Preserving Guessing Game",
  description: "Guess encrypted numbers, earn glory, and keep strategies private with Zama fhEVM.",
  icons: "/logo.svg"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Polyfill for global variable (fixes @zama-fhe/relayer-sdk compatibility) */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if (typeof global === 'undefined') {
              var global = globalThis;
            }
          `
        }} />
        {/* Load FHE SDK from CDN (required for encryption) */}
        <script
          src="https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs"
          type="text/javascript"
          defer
        />
      </head>
      <body className={`${karla.variable} ${vt323.variable} min-h-screen bg-background text-foreground`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
