import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/features/auth/auth-context";
import { QueryProvider } from "@/lib/query-provider";

export const metadata: Metadata = {
  title: "FinFlow",
  description: "FinFlow financial operations platform",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
