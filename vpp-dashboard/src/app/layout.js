import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoginModel from '@/components/LoginModel';
import AuthProvider from '@/components/AuthProvider';


const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'DeepDispatch',
  description: 'AI-driven Virtual Power Plant dashboard. Optimize solar, wind, and battery arbitrage with deep learning forecasting.',
  openGraph: {
    title: 'DeepDispatch VPP Optimizer',
    description: 'AI-driven Virtual Power Plant dashboard for renewable energy management.',
    url: 'https://your-future-domain.com',
    siteName: 'DeepDispatch',
    images: [
      {
        url: 'https://your-future-domain.com/dashboard.png', 
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen bg-gray-950 text-gray-100`}>
        <AuthProvider>
        <Navbar />
        <LoginModel/>
        <div className="flex-grow">
          {children}
        </div>
        <Footer /> 
        </AuthProvider>
      </body>
    </html>
  );
}
