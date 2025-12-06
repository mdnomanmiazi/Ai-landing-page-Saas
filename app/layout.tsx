import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Landing Page Generator",
  description: "Generate websites in seconds",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
