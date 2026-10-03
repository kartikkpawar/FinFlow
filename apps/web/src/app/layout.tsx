import type { Metadata } from "next";
import "antd/dist/reset.css";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import { ToastContainer } from "react-toastify";
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
        <QueryProvider><AuthProvider>{children}</AuthProvider></QueryProvider>
        <ToastContainer position="top-right" autoClose={4000} newestOnTop pauseOnFocusLoss pauseOnHover />
      </body>
    </html>
  );
}
