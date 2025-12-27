import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"; // 👈 Import เข้ามา

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Robot Control Interface",
  description: "Web-based robot controller",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-950 text-white overflow-hidden`}>
        
        {/* ✅ ใส่ Navbar ตรงนี้ มันจะโชว์ทุกหน้า */}

        {/* ใส่ Padding Top เพื่อไม่ให้ Navbar บังเนื้อหา */}
        <main className="h-screen w-screen overflow-auto">
          {children}
        </main>
        
      </body>
    </html>
  );
}