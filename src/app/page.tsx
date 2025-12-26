// app/page.tsx
'use client';

import { useRobot } from '@/hooks/useRobot';
import ControlPad from '@/components/ControlPad';
import Terminal from '@/components/Terminal';
import StatusBoard from '@/components/StatusBoard';
import Joystick from '@/components/่่joystick';
import RobotVisualizer from '@/components/RobotVisualizer/index';

export default function RobotCockpit() {
  const { 
    data, isConnected, activeBtn, logs, 
    send, setLogs, setActiveBtn, 
    controlMode, motorSpeed 
  } = useRobot();

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white flex flex-col p-4 md:p-8 relative overflow-hidden">
      
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
      <header className="z-20 w-full max-w-6xl mx-auto mb-8">
        <StatusBoard data={data} isConnected={isConnected} />
        <h1 className="text-center mt-6 text-2xl md:text-4xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-green-400 to-emerald-500 drop-shadow-sm">
          ROBOT COMMANDER
        </h1>
      </header>

      {/* --- Section 2: Main Dashboard (Grid Layout) --- */}
      <main className="z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1">
        
        {/* ฝั่งซ้าย: กราฟิกแสดงผลรถ (6 ส่วนจาก 12) */}
        <div className="lg:col-span-6 flex justify-center items-center bg-gray-800/30 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl w-full h-full min-h-[400px]">
          <RobotVisualizer 
            mL={motorSpeed.L} 
            mR={motorSpeed.R} 
            isVacuumOn={data?.fan === 1 || false} // ส่งค่านี้ได้แล้ว ไม่ Error
            sensors={{
              // ส่งค่าเซนเซอร์จำลองไปก่อน (เดี๋ยวค่อยผูกกับ data จริง)
              bumperL: null,  // null = สีเทา (No Signal)
              bumperR: null,
              cliffL: null,  // false = สีเขียว (Normal)
              cliffR: null,
              irL: null,  
              irC: null,
              irR: null,
            }} 
          />
        </div>

        {/* ฝั่งขวา: ส่วนควบคุม (6 ส่วนจาก 12) */}
        <div className="lg:col-span-6 flex flex-col justify-center items-center bg-gray-800/20 backdrop-blur-sm p-8 rounded-3xl border border-white/5 shadow-xl w-full h-full min-h-[400px]">
          <div className="w-full flex flex-col items-center">
            <h2 className="mb-8 text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Control System: {controlMode.toUpperCase()}
            </h2>
            
            <div className="transition-all duration-500 transform hover:scale-105">
              {controlMode === 'pad' ? (
                <ControlPad 
                  send={send} 
                  activeBtn={activeBtn} 
                  isConnected={isConnected} 
                  setActiveBtn={setActiveBtn} 
                />
              ) : (
                <Joystick 
                  send={send} 
                  activeBtn={activeBtn} 
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* --- Section 3: Floating Elements --- */}
      {/* Terminal ลอยตัว (Draggable) */}
      <Terminal logs={logs} onClear={() => setLogs([])} />

      {/* Footer Info */}
      <footer className="mt-8 text-center text-[10px] text-gray-500 tracking-widest uppercase opacity-50">
        System Active &bull; WebSocket Stable &bull; 2025 Autonomous Tech
      </footer>
    </div>
  );
}