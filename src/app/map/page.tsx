"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MapDisplay from '@/components/MapDisplay/MapDisplay';
import StatusBoard from '@/components/StatusBoard';
import { useRobot } from '@/hooks/useRobot';

export default function FullScreenMapPage() {
  // State ข้อมูล
  const [mapPoints, setMapPoints] = useState<{x:number, y:number}[]>([]);
  const [robotPose, setRobotPose] = useState({ x: 0, y: 0, yaw: 0 });

  // State ขนาดหน้าจอ
  const [windowSize, setWindowSize] = useState({ width: 800, height: 600 });

  const { 
    robotData, handleConnectRequest, isServerConnected,
     isRobotConnected, serverUrl
  } = useRobot();

  // 1. หาขนาดหน้าจอจริง (เพื่อให้ Canvas เต็มจอ)
  useEffect(() => {
    
    // ฟังก์ชันวัดขนาดจอ
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // วัดครั้งแรกและรอฟังตอนขยายจอ
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. เชื่อมต่อ WebSocket (Logic เดียวกับ Dashboard)
  useEffect(() => {
    if (!serverUrl) return;

    const ws = new WebSocket(serverUrl);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'map_update') {
           setMapPoints(prev => {
             const newPoints = [...prev, data.point];
             if (newPoints.length > 10000) return newPoints.slice(-10000); // เก็บเยอะขึ้นเพราะจอใหญ่
             return newPoints;
           });
           setRobotPose(data.robot_pose);
        }
      } catch (e) {}
    };

    return () => ws.close();
  }, [serverUrl]);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden">
        {/* 🌌 Background Grid Effect */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                style={{ 
                    backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', 
                    backgroundSize: '30px 30px' 
                }}>
            </div>
            
            {/* 🔵 Glow Orbs (ตกแต่งให้ดูล้ำ) */}
            <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-green-600/20 rounded-full blur-[120px] pointer-events-none"></div>
    
            {/* --- Section 1: Top Bar (Status) --- */}
            <header className="z-20 w-full mb-8 bg-gray-900">
            <StatusBoard data={robotData} serverUrl={serverUrl} isServerConnected={isServerConnected} isRobotConnected={isRobotConnected} onConnect={handleConnectRequest} />
            
            </header>
      
      

      {/* 2. Overlay ข้อมูลมุมขวาล่าง */}
      <div className="absolute bottom-6 right-6 z-50 bg-black/60 backdrop-blur px-6 py-4 rounded-xl border border-gray-700 text-right pointer-events-none">
         <h2 className="text-white font-black text-xl tracking-widest mb-1">LIVE MAPPING</h2>
         <p className="text-emerald-400 font-mono text-sm">
            X: {robotPose.x.toFixed(1)} | Y: {robotPose.y.toFixed(1)}
         </p>
         <p className="text-gray-500 text-xs mt-2">Points: {mapPoints.length}</p>
      </div>

      {/* 3. ตัวแผนที่ เต็มจอ */}
      <MapDisplay 
        lidarPoints={mapPoints} 
        robotPose={robotPose} 
        width={windowSize.width} 
        height={windowSize.height} 
      />
      
    </div>
  );
}