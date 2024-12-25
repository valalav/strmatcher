import type { Metadata } from "next";
import StoreProvider from "@/providers/StoreProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "STR Matcher",
  description: "Tool for comparing STR markers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}