import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Island",
  description:
    "A cozy daily ritual for families — share a moment, grow your island together.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6efe4" },
    { media: "(prefers-color-scheme: dark)", color: "#101b22" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      // next-themes sets the `class` attribute on <html> before hydration
      // via an inline script; without suppressHydrationWarning React would
      // flag that as a server/client mismatch even though it's intentional.
      suppressHydrationWarning
    >
      <body className="font-body antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
