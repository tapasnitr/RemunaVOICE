import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import ClientFCMSetup from "@/components/ClientProviders";

export const metadata: Metadata = {
  title: "Remuna VOICE",
  description: "",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-yellow-50 text-yellow-900 min-h-screen">
        {/* ✅ Keep AuthProvider EXACTLY as-is */}
        <AuthProvider>
          {/* ✅ ADD ONLY THIS */}
          <ClientFCMSetup />

          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
