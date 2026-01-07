// life-admin-assistant/frontend/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "sonner"; // Import Toaster

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Life Admin Assistant",
  description: "Simplify your life administration tasks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white dark:bg-gray-900`}>
        <ErrorBoundary>
          {children}
          <Toaster 
            position="top-right" 
            richColors 
            closeButton 
            theme="light" // atau "dark" atau "system"
            expand={true}
          />
        </ErrorBoundary>
      </body>
    </html>
  );
}