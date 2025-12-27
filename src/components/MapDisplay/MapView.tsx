// components/MapView.tsx
import { useState, useEffect } from 'react';
import MapDisplay from '@/components/MapDisplay/MapDisplay';
import { SensorData } from '@/types/robot';

interface Props {
  // รับข้อมูลจากตัวแม่ (Parent) แทนการหาเอง
  mapPoints: {x: number, y: number}[];
  robotPose: {x: number, y: number, yaw: number};
  robotData: SensorData;
  serverUrl: string;
  isServerConnected: boolean;
  isRobotConnected: boolean;
  onConnect: (ip: string) => void;
  onBack: () => void; // ฟังก์ชันสำหรับกดกลับไปหน้า Dashboard
}

export default function MapView({ 
  mapPoints, robotPose, robotData, serverUrl, 
  isServerConnected, isRobotConnected, onConnect, onBack 
}: Props) {
  
  const [windowSize, setWindowSize] = useState({ width: 800, height: 600 });

  // วัดขนาดหน้าจอ
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
        {/* 🌌 Background Grid Effect */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
            style={{ 
                backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', 
                backgroundSize: '30px 30px' 
            }}>
        </div>
        
        {/* 🔵 Glow Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-green-600/20 rounded-full blur-[120px] pointer-events-none"></div>

        {/* ข้อมูลมุมขวาล่าง */}
        <div className="absolute bottom-6 right-6 z-50 bg-black/60 backdrop-blur px-6 py-4 rounded-xl border border-gray-700 text-right pointer-events-none">
            <h2 className="text-white font-black text-xl tracking-widest mb-1">LIVE MAPPING</h2>
            <p className="text-emerald-400 font-mono text-sm">
                X: {robotPose.x.toFixed(1)} | Y: {robotPose.y.toFixed(1)}
            </p>
            <p className="text-gray-500 text-xs mt-2">Points: {mapPoints.length}</p>
        </div>

        {/* ตัวแผนที่ */}
        <MapDisplay 
            lidarPoints={mapPoints} 
            robotPose={robotPose} 
            width={windowSize.width} 
            height={windowSize.height} 
        >
             {/* ใส่ Component หุ่นยนต์ตรงนี้ถ้ามี */}
        </MapDisplay>
    </div>
  );
}