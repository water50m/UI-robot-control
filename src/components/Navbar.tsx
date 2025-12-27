"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname(); // เช็คว่าอยู่หน้าไหน

  // ฟังก์ชันเช็คว่าลิงก์นี้ Active อยู่ไหม?
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-gray-950/60 backdrop-blur-md border-b border-white/5 shadow-lg">
      
      {/* 1. Logo / Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-blue-500/50 shadow-lg">
          <span className="text-white font-bold text-lg">R</span>
        </div>
        <span className="text-white font-bold tracking-widest text-sm hidden sm:block">
          ROBOT CONTROL
        </span>
      </div>

      {/* 2. Menu Links */}
      <div className="flex items-center bg-black/40 rounded-full p-1 border border-white/5">
        
        {/* ปุ่ม Main / Dashboard */}
        <Link 
          href="/" 
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2
            ${isActive('/') 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
        >
          <span>📊</span>
          <span>Main</span>
        </Link>

        {/* ปุ่ม Map */}
        <Link 
          href="/map" 
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2
            ${isActive('/map') 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
        >
          <span>🗺️</span>
          <span>Map</span>
        </Link>

      </div>

      {/* 3. Status (Optional) - ใส่สถานะ WiFi หรือเวลาตรงนี้ได้ */}
      <div className="flex items-center gap-2">
         <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
         <span className="text-xs text-green-400 font-mono">ONLINE</span>
      </div>

    </nav>
  );
}