// components/StatusBoard.tsx
import { SensorData } from '@/types/robot';

interface Props {
  data: SensorData;
  isConnected: boolean;
}

export default function StatusBoard({ data, isConnected }: Props) {
  
  // ฟังก์ชันเลือกสีแบตเตอรี่ (ถ้าน้อยกว่า 5V ให้แดงและกระพริบ)
  const getBatteryStyle = (voltage: number = 0) => {
    if (voltage === 0) return 'border-gray-600 text-gray-500';
    if (voltage < 5.0) return 'border-red-500 text-red-500 animate-pulse'; // แบตอ่อนเตือนแดง
    return 'border-blue-500 text-blue-400';
  };

  return (
    <div className="absolute top-4 left-0 w-full px-4 z-40 pointer-events-none flex flex-col gap-2">
      {/* pointer-events-none คือยอมให้เมาส์คลิกทะลุได้ 
         (เผื่อมันบังปุ่มอื่น แต่เรายังมองเห็น status ได้) 
      */}

      {/* --- Row 1: Main Status Indicators --- */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {/* 1. Connection Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border backdrop-blur-sm shadow-lg
            ${isConnected 
              ? 'bg-green-900/40 border-green-500 text-green-400' 
              : 'bg-red-900/40 border-red-500 text-red-400'}`}
          >
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {isConnected ? 'SYSTEM ONLINE' : 'DISCONNECTED'}
          </div>

          {/* 2. Battery Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border shadow-lg flex items-center gap-2 ${getBatteryStyle(data.bat)}`}>
             <span>⚡</span>
             <span>{data.bat ? data.bat.toFixed(1) : '0.0'} V</span>
          </div>
        </div>

        {/* 3. Fan Status (แสดงเมื่อพัดลมเปิดเท่านั้น) */}
        {data.fan && data.fan > 0 ? (
           <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center animate-spin-slow">
              <span className="text-cyan-400 text-xs">☢️</span>
           </div>
        ) : null}
      </div>

      {/* --- Row 2: Emergency Alerts (แสดงเฉพาะตอนมีเหตุ) --- */}
      <div className="flex flex-col items-center space-y-1">
        
        {/* เตือนชนซ้าย */}
        {data.bump?.l ? (
          <div className="bg-red-600 text-white font-bold text-xs px-4 py-1 rounded-full animate-bounce shadow-red-900 shadow-lg border border-red-400">
            ⚠️ IMPACT LEFT
          </div>
        ) : null}

        {/* เตือนชนขวา */}
        {data.bump?.r ? (
          <div className="bg-red-600 text-white font-bold text-xs px-4 py-1 rounded-full animate-bounce shadow-red-900 shadow-lg border border-red-400">
            ⚠️ IMPACT RIGHT
          </div>
        ) : null}

        {/* เตือนตกเหว (ถ้ามี Sensor) */}
        {(data.cliff?.fl || data.cliff?.fr) && (
           <div className="bg-yellow-500 text-black font-bold text-xs px-4 py-1 rounded-full animate-pulse border border-yellow-300">
            ⛔ CLIFF DETECTED
          </div>
        )}
      </div>

    </div>
  );
}