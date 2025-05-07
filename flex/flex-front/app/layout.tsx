import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import Header from './components/Header';
import Footer from './components/Footer';


// Inter font a törzsszövegekhez
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Poppins font a címekhez
const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'FlexMedia - Saját médiaszerver',
  description: 'Nézd meg a filmjeidet és sorozataidat egy helyen, bárhol, bármikor',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu" data-theme="light" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen bg-base-200 flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
