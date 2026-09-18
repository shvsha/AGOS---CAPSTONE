import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import NextTopLoader from "nextjs-toploader";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AGOS",
  description: "Automated Geo-Based Obstruction Sensing System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${poppins.className} min-h-svh bg-[#F0F7F4]`}>
        <NextTopLoader color="#27cad6" showSpinner={false} />
        {children}
      </body>
    </html>
  );
}