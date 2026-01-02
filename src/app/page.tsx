'use client';

import { useState, useEffect, useRef } from 'react';
import { useRobot } from '@/hooks/useRobot';
import ControlPad from '@/components/ControlPad';
import Terminal from '@/components/Terminal';
import StatusBoard from '@/components/StatusBoard';
import Joystick from '@/components/Joystick';
import RobotVisualizer from '@/components/RobotVisualizer/index';
import MapView from '@/components/MapDisplay/MapView';
import Calibrating from '@/components/Calibrating';

export default function RobotCockpit() {
  const { 
    robotData, isConnected, activeBtn, logs, 
    send, setLogs, setActiveBtn, 
    motorSpeed, handleConnectRequest, isServerConnected,
    isRobotConnected, controlMode, serverUrl
  } = useRobot();

  const [currentView, setCurrentView] = useState<'dashboard' | 'map'>('dashboard');
  const [mapPoints, setMapPoints] = useState<{x:number, y:number}[]>([]);
  const [robotPose, setRobotPose] = useState({ x: 0, y: 0, yaw: 0 });

  // --- 🆕 GESTURE STATE (ตัวแปรสำหรับระบบลาก) ---
  const [dragOffset, setDragOffset] = useState(0); // ระยะที่ลากมา (Pixel)
  const [isDragging, setIsDragging] = useState(false); // กำลังลากอยู่ไหม?
  const startXRef = useRef(0); // จุดเริ่มต้นที่กดเมาส์
  const screenWidthRef = useRef(0); // ความกว้างหน้าจอ
  const hasDraggedRef = useRef(false);

  // อัปเดตขนาดจอเสมอ (เผื่อ User ย่อขยายจอระหว่างเล่น)
  useEffect(() => {
    if (typeof window !== 'undefined') screenWidthRef.current = window.innerWidth;
    const handleResize = () => { screenWidthRef.current = window.innerWidth; };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // WebSocket Logic
  useEffect(() => {
    if (!serverUrl) return;
    const ws = new WebSocket(serverUrl);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'map_update') {
           setMapPoints(prev => {
             const newPoints = [...prev, data.point];
             if (newPoints.length > 20000) return newPoints.slice(-20000); 
             return newPoints;
           });
           setRobotPose(data.robot_pose);
        }
      } catch (e) {}
    };
    return () => ws.close();
  }, [serverUrl]);

  // --- 🆕 HANDLER: เริ่มลาก (MouseDown / TouchStart) ---
  const handleDragStart = (clientX: number) => {
    // ✅ ไม่ต้องเช็ค currentView แล้ว ยอมให้ลากได้ทุกหน้า
    setIsDragging(true);
    startXRef.current = clientX;

    hasDraggedRef.current = false;
  };

  // --- 🆕 HANDLER: กำลังลาก (MouseMove / TouchMove) ---
  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    
    // คำนวณระยะที่ลาก (จากซ้ายไปขวา = ค่าบวก)
    const delta = clientX - startXRef.current;

    if (Math.abs(delta) > 5) {
        hasDraggedRef.current = true;
    }

    // ✅ กรณี 1: อยู่หน้า Dashboard (จะลากไปหา Map)
    // ต้องลากไปทาง "ซ้าย" (delta ต้องติดลบ)
    if (currentView === 'dashboard') {
      if (delta < 0 && delta >= -screenWidthRef.current) {
        setDragOffset(delta);
      }
    } 
    // ✅ กรณี 2: อยู่หน้า Map (จะลากกลับ Dashboard)
    // ต้องลากไปทาง "ขวา" (delta ต้องเป็นบวก)
    else {
      if (delta > 0 && delta <= screenWidthRef.current) {
        setDragOffset(delta);
      }
    }
  };

  const handleHandleClick = (targetView: 'dashboard' | 'map') => {
    // ถ้าเมื่อกี้มีการลาก (hasDraggedRef เป็น true) -> ไม่ทำอะไร (ปล่อยให้ handleDragEnd จัดการ)
    // ถ้าเมื่อกี้แค่จิ้ม (hasDraggedRef เป็น false) -> เปลี่ยนหน้าเลย!
    if (!hasDraggedRef.current) {
        setCurrentView(targetView);
    }
  };

  // --- 🆕 HANDLER: ปล่อยมือ (MouseUp / TouchEnd) ---
  const handleDragEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);

      const threshold = screenWidthRef.current * 0.3; // ลากเกิน 40% ของจอ ก็ให้เปลี่ยนหน้าเลย

      if (currentView === 'dashboard') {
        // ⬅️ ถ้าลากไปทางซ้ายเยอะๆ (ค่าลบเยอะกว่า threshold) -> ไปหน้า Map
        // (dragOffset เป็นลบ เราเลยเช็คว่า "น้อยกว่า -threshold" ไหม)
        if (dragOffset < -threshold) {
          setCurrentView('map');
        }
      } else {
        // ➡️ ถ้าลากไปทางขวาเยอะๆ (ค่าบวกเยอะกว่า threshold) -> กลับหน้า Dashboard
        if (dragOffset > threshold) {
          setCurrentView('dashboard');
        }
      }
      
      // Reset ค่าลากเป็น 0 เพื่อให้ CSS Transition ทำงานต่อ
      setDragOffset(0);
  };

  // Mouse Events
  const onMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX);
  const onMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX);
  const onMouseUp = () => handleDragEnd();

  // Touch Events (สำหรับมือถือ/iPad)
  const onTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX);
  const onTouchEnd = () => handleDragEnd();

  return (
    <div 
      className="fixed inset-0 w-screen h-screen overflow-hidden bg-gray-950 select-none"
      // ผูก Event ทั่วหน้าจอ เพื่อให้ลากแล้วไม่หลุด (เฉพาะตอน move/up)
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20 pointer-events-none z-0" 
           style={{ 
             backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', 
             backgroundSize: '30px 30px' 
           }}>
      </div>
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-green-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* StatusBoard (Fixed Top) */}
      <div className="fixed top-0 left-0 w-full z-50 pointer-events-none">
         {/* ใส่ div ย่อยเพื่อรับ event เฉพาะตัวบอร์ด */}
         <div className="pointer-events-auto">
             <StatusBoard 
                data={robotData} 
                serverUrl={serverUrl || ''} 
                isServerConnected={isServerConnected} 
                isRobotConnected={isRobotConnected} 
                onConnect={handleConnectRequest} 
             />
         </div>
      </div>
           {/* 🛠️ ส่วนบน: Calibration & Settings Panel */}
            <div className="fixed left-0 top-30 -translate-y-1/2 p-4 bg-black/20 border border-white/5 z-100 rounded-r-lg">
                <Calibrating />
            </div>
      
        <Terminal logs={logs} onClear={() => setLogs([])} />
      {/* 🚀 SLIDING CONTAINER */}
      <div 
        className="flex w-[200vw] h-full will-change-transform relative z-10"
        style={{ 
            // 🔄 UPDATED TRANSFORM LOGIC:
            // - Dashboard: เริ่มที่ 0 แล้วบวก dragOffset (ซึ่งจะเป็นค่าติดลบ เวลาลากซ้าย)
            // - Map: เริ่มที่ -50% แล้วบวก dragOffset (ซึ่งจะเป็นค่าบวก เวลาลากขวา)
            transform: currentView === 'dashboard' 
                ? `translateX(${dragOffset}px)` 
                : `translateX(calc(-50% + ${dragOffset}px))`,
            
            transition: isDragging ? 'none' : 'transform 500ms cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >

        {/* === SCREEN 1: DASHBOARD === */}
        <div className="w-screen h-full overflow-y-auto overflow-x-hidden relative flex flex-col pt-32">
            <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start p-4 flex-1">
                
                {/* ... (Dashboard Content เดิม) ... */}
                <div className="lg:col-span-6 flex justify-center items-center bg-gray-800/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl h-full min-h-[450px]">
                    <RobotVisualizer mL={motorSpeed.L} mR={motorSpeed.R} isVacuumOn={robotData?.fan === 1 || false} sensors={{ bumperL: null, bumperR: null, cliffL: null, cliffR: null, irL1: null, irL2: null, irR1: null, irR2: null }} />
                </div>
                
                <div className="lg:col-span-6 flex flex-col bg-gray-900/40 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden h-full min-h-[480px]">
    
                

                {/* 🎮 ส่วนล่าง: Main Controller Zone */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
                    
                    {/* Effect: แสงฟุ้งๆ ตรงกลางเพื่อให้จอยดูเด่นขึ้น */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>

                    {/* Controller */}
                    <div className="relative z-10 transition-all duration-300 transform hover:scale-105">
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
            {currentView === 'dashboard' && (
                <div 
                    className="absolute right-0 top-0 bottom-0 w-8 z-[60] cursor-grab group flex items-center justify-center hover:bg-white/5 transition-colors"
                    onMouseDown={onMouseDown} 
                    onTouchStart={onTouchStart}
                    onClick={() => handleHandleClick('map')}
                >
                    {/* เส้นเรืองแสง Visual Cue */}
                    <div className="w-1 h-12 rounded-full bg-white/20 group-hover:bg-blue-400/80 shadow-[0_0_10px_currentColor] transition-all" />
                    
                    {/* Fake Map Hint: แสงเหลือบๆ ของหน้า Map ที่ซ่อนอยู่ขวามือ */}
                    <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-blue-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
            )}
        </div>


        {/* === SCREEN 2: MAP VIEW === */}
        <div className="w-screen h-full relative"> 
            
            {/* 🆕 PEEK / EDGE HANDLE (แถบสำหรับจับลาก) */}
            {/* จะโชว์เฉพาะตอนอยู่หน้า Map เท่านั้น */}
            {currentView === 'map' && (
                <div 
                    className="absolute left-0 top-0 bottom-0 w-8 z-[60] cursor-grab group flex items-center justify-center hover:bg-white/5 transition-colors"
                    onMouseDown={onMouseDown} // เริ่มจับลากตรงนี้
                    onTouchStart={onTouchStart}
                    onClick={() => handleHandleClick('dashboard')}
                >
                    {/* Visual Cue: เส้นเรืองแสงบอกว่า "ลากฉันสิ" */}
                    <div className="w-1 h-12 rounded-full bg-white/20 group-hover:bg-blue-400/80 shadow-[0_0_10px_currentColor] transition-all" />
                    
                    {/* Fake BG Hint: แสงเหลือบๆ ของหน้า Main */}
                    <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
            )}

            <MapView 
                mapPoints={mapPoints}
                robotPose={robotPose}
                robotData={robotData}
                serverUrl={serverUrl || ''}
                isServerConnected={isServerConnected}
                isRobotConnected={isRobotConnected}
                onConnect={handleConnectRequest}
                onBack={() => setCurrentView('dashboard')}
            />
        </div>

      </div>
    </div>
  );
}