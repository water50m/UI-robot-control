// components/StatusBoard.tsx
import { useState, useEffect } from 'react';
import { SensorData } from '@/types/robot';

interface Props {
  serverUrl: string;
  data: SensorData;
  isServerConnected: boolean; // สถานะเชื่อมต่อ Python Server
  isRobotConnected: boolean;  // สถานะหุ่นยนต์ (Python บอกมา)
  onConnect: (ip: string) => void; // ฟังก์ชัน callback เมื่อกด Connect
}

export default function StatusBoard({ data, isServerConnected, isRobotConnected, onConnect, serverUrl }: Props) {
  const [ip, setIp] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. โหลด IP ล่าสุดจาก API เมื่อเปิดเว็บ
  useEffect(() => {
    fetch('/api/ipconfig')
      .then((res) => res.json())
      .then((cfg) => setIp(cfg.ip || serverUrl));
  }, []);

  // 2. ฟังก์ชันกดปุ่ม Connect
  const handleConnect = async () => {
    setLoading(true);
    try {
      // Save ลงไฟล์ JSON ก่อน
      await fetch('/api/ipconfig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      });
      // แล้วค่อยสั่งเชื่อมต่อ
      onConnect(ip);
    } catch (err) {
      console.error("Save config failed", err);
    }
    setLoading(false);
  };

  return (
     <div className="w-full px-6 py-4">
      
      {/* === ZONE 1: Connection & Config (เปิด pointer-events-auto เพื่อให้กดได้) === */}
      <div className="flex justify-between items-start pointer-events-auto">
        
        {/* Left: Status Indicators */}
        <div className="flex items-center gap-3">
            {/* A. Server Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-md shadow-lg transition-all
              ${isServerConnected 
                ? 'bg-slate-900/60 border-blue-500/50 text-blue-400' 
                : 'bg-red-900/60 border-red-500/50 text-red-400'
              }`}>
              <div className={`w-2 h-2 rounded-full ${isServerConnected ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs font-bold font-mono">
                BRAIN: {isServerConnected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            {/* B. Robot Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-md shadow-lg transition-all
               ${!isServerConnected 
                  ? 'opacity-50 grayscale' // ถ้า Server ดับ หุ่นก็ต้องดับด้วย
                  : isRobotConnected 
                    ? 'bg-green-900/60 border-green-500/50 text-green-400' 
                    : 'bg-orange-900/60 border-orange-500/50 text-orange-400'
               }`}>
              <span className="text-xs">🤖</span>
              <span className="text-xs font-bold font-mono uppercase">
                ROBOT: {isRobotConnected ? (data.name || 'READY') : 'SEARCHING...'}
              </span>
            </div>

            {/* === ZONE 2: Telemetry (Battery / Fan) === */}
            {isRobotConnected && (
              <div className="flex gap-2">
                {/* Battery */}
                <div className={`px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-sm border shadow-lg flex items-center gap-2
                    ${(data?.bat ?? 0) < 11.0 ? 'border-red-500 text-red-400 animate-pulse' : 'border-emerald-500 text-emerald-400 bg-emerald-900/20'}`}>
                    <span>⚡</span>
                    <span>{data.bat ? data.bat.toFixed(1) : '0.0'} V</span>
                </div>
              </div>
            )}

        </div>

        <h1 className="text-center text-2xl md:text-4xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-green-400 to-emerald-500 drop-shadow-sm">
          ROBOT COMMANDER
        </h1>

        {/* Right: IP Config Input */}
        <div className="flex gap-2 bg-black/40 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xl">
          <input 
            type="text" 
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            className="bg-transparent border border-gray-600 rounded px-2 py-1 text-xs text-white w-54 focus:outline-none focus:border-blue-500 font-mono "
            placeholder="IP:PORT"
          />
          <button 
            onClick={handleConnect}
            disabled={loading || isServerConnected}
            className={`px-3 py-1 rounded text-xs font-bold transition-all
              ${isServerConnected 
                ? 'bg-green-600 text-white cursor-default' 
                : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
              }`}
          >
            {loading ? 'SAVING...' : isServerConnected ? 'LINKED' : 'CONNECT'}
          </button>
        </div>

      </div>


      

    </div>
  );
}