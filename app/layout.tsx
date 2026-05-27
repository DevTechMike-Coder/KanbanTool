import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Fira_Code } from "next/font/google";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-mono-custom",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vertex Canvas",
  description: "Vertex Canvas is a high-performance...",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakartaSans.variable} ${firaCode.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-white text-zinc-900">
        {children}
      </body>
    </html>
  );
}