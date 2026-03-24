import type { Metadata } from "next";
import "./globals.css";
import { NextAuthProvider } from "./providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "SoundSphere",
  description: "Discover new music",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="bg-gray-900 flex flex-col min-h-full text-white">
        <NextAuthProvider>
          <Navbar />
          <main className="flex-grow pt-16">
            {children}
          </main>
          <Footer />
        </NextAuthProvider>
        <script
          src="https://www.rentsolo.com/widget.js"
          data-widget-key="qVCCyAHQ7p38GGsItjo2AY9Gxev15I1Mu_D4Qc0DbcFUnznN_4LMEkbJ1wNYmTIsmThJuiB567jnKedkoJs-HzN8dQKGq_o3JrtECFc3fzmI7XvszEfQtD8"
          async
        ></script>
      </body>
    </html>
  );
}
