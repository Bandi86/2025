import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ['400', '500', '600', '700']
});


export const metadata: Metadata = {
  title: 'Web Dev Blog',
  description: 'Your favorite blog about web development',
  icons: {
    icon: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn('antialiased flex flex-col min-h-screen', poppins.variable)}
      >
        <Navbar />
        <main className="flex-grow bg-amber-600">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
