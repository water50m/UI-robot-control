'use client'
import { useState, useEffect, useRef } from 'react';

// 1. นิยามโครงสร้างข้อมูลที่ส่งมาจากหุ่น
interface SensorData {
  bat?: number;
  bump?: { l?: number; r?: number };
  cliff?: { fl?: number; fr?: number };
  fan?: number;
  log?: string;
}

export default function RobotCockpit() {
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState<SensorData>({}); // เก็บค่าเซนเซอร์ทั้งหมด
  const ws = useRef<WebSocket | null>(null);
  const [logHistory, setLogHistory] = useState<string[]>([]); // เก็บรายการ Log ทั้งหมด
  const [isLogOpen, setIsLogOpen] = useState(false);

  // ➕ State สำหรับระบบลาก (Drag & Drop)
  const [position, setPosition] = useState({ x: 20, y: 20 }); // ตำแหน่งเริ่มต้น (px)
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [activeBtn, setActiveBtn] = useState<string>('');
  
  // 🔧 แก้ IP ตรงนี้
  const WS_URL = 'ws://10.128.101.154/ws'; 
  // ➕ Logic: จัดการการลากหน้าต่าง
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      // คำนวณตำแหน่งใหม่ = ตำแหน่งเมาส์ - ระยะห่างตอนเริ่มกด
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false); // ปล่อยเมาส์ = หยุดลาก
    };

    // ติดตั้ง Event Listener เฉพาะตอนที่กำลังลากอยู่
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // ฟังก์ชันเริ่มลาก (เรียกตอนกด Header)
  const startDrag = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    // 1. Lock หน้าจอ
    document.body.style.overflow = 'hidden';
    
    connectWebSocket();

    // ตัวแปรสำหรับจำว่าปุ่มไหนถูกกดค้างอยู่บ้าง (ใช้ Set เพื่อไม่ให้ซ้ำ)
    const activeKeys = new Set<string>();
    let lastSentCmd = ''; // จำคำสั่งล่าสุด กันส่งรัวๆ

    // ฟังก์ชันประมวลผลว่าตอนนี้ควรส่งคำสั่งอะไร
    const evaluateCommand = () => {
      let cmd = 'S'; // Default คือหยุด

      // ลำดับความสำคัญ: เลี้ยว (ชนะ) -> เดินหน้า/ถอยหลัง -> หยุด
      // 1. เช็คเลี้ยวซ้าย
      if (activeKeys.has('a') || activeKeys.has('arrowleft')) {
        cmd = 'L';
      } 
      // 2. เช็คเลี้ยวขวา
      else if (activeKeys.has('d') || activeKeys.has('arrowright')) {
        cmd = 'R';
      } 
      // 3. เช็คเดินหน้า
      else if (activeKeys.has('w') || activeKeys.has('arrowup')) {
        cmd = 'F';
      } 
      // 4. เช็คถอยหลัง
      else if (activeKeys.has('s') || activeKeys.has('arrowdown')) {
        cmd = 'B';
      }
      // ➕ อัปเดต Visual บนหน้าจอ (ให้ปุ่มมันสว่างวาบ!)
      if (cmd === 'S') setActiveBtn(''); // ถ้าหยุด ก็เคลียร์ปุ่ม
      else setActiveBtn(cmd);            // ถ้ามีคำสั่ง ก็เซ็ตปุ่มนั้นให้ Active

      // ถ้าคำสั่งเปลี่ยนไปจากเดิม ค่อยส่ง (เพื่อประหยัดเน็ต)
      if (cmd !== lastSentCmd) {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(cmd);
            lastSentCmd = cmd;
            // console.log("Sent:", cmd); // Debug
        }
      }


    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // กันกดแช่แล้ว event รัว
      activeKeys.add(e.key.toLowerCase()); // จดปุ่มลงสมุด
      evaluateCommand(); // ประมวลผล
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      activeKeys.delete(e.key.toLowerCase()); // ลบปุ่มออกจากสมุด
      evaluateCommand(); // ประมวลผลใหม่ (จะกลับไปเป็น F ถ้า W ยังค้างอยู่)
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    
    return () => { 
      ws.current?.close();
      if (watchdogTimer.current) clearTimeout(watchdogTimer.current); 
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.body.style.overflow = 'auto';
    };

    
  }, []);

  const connectWebSocket = () => {
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      //(รอข้อมูลมาจริงค่อยบอกว่า Online)
      console.log("WS Connected");
      feedWatchdog(); // เริ่มจับเวลาทันทีที่ต่อติด
    };
    
    ws.current.onclose = () => {
      setIsConnected(false);
      if (watchdogTimer.current) clearTimeout(watchdogTimer.current); // หยุดจับเวลาเมื่อหลุด
      setTimeout(connectWebSocket, 3000); // Auto Reconnect
    };

    // 📩 ส่วนรับข้อมูล (Receive)
    ws.current.onmessage = (event) => {
      // 2. เมื่อมีข้อมูลเข้ามา
      setIsConnected(true); // ยืนยันว่า Online จริง
      feedWatchdog();       // "ให้อาหารยาม" (รีเซ็ตเวลา) เพื่อบอกว่าฉันยังอยู่นะ

      try {
        const parsed: SensorData = JSON.parse(event.data);
        setData(prev => ({ ...prev, ...parsed }));
        if (parsed.log) {
          const time = new Date().toLocaleTimeString('th-TH', { hour12: false });
          const newLog = `[${time}] ${parsed.log}`;
          
          setLogHistory(prev => {
            // เก็บแค่ 50 บรรทัดล่าสุดพอ (กันเมมเต็ม) และเอาอันใหม่ขึ้นบนสุด
            return [newLog, ...prev].slice(0, 50); 
          });
        }
      } catch (e) {
        console.error("Parse Error", e);
      }
    };
  };

  const send = (cmd: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(cmd);
      if (navigator.vibrate) navigator.vibrate(30); // สั่นเบาๆ ตอนกด
    }
  };

  const stop = () => send('S');

  // ปุ่มกด (Reusable Component)
  const Btn = ({ cmd, label, color = "bg-gray-700", icon, className = "" }: any) => (
    <button
      className={`${color} shadow-lg active:scale-95 transition-transform flex items-center justify-center rounded-2xl ${className}`}
      onMouseDown={() => send(cmd)}
      onMouseUp={stop}
      onMouseLeave={stop}
      onTouchStart={(e) => { e.preventDefault(); send(cmd); }}
      onTouchEnd={(e) => { e.preventDefault(); stop(); }}
    >
      {icon ? icon : <span className="text-2xl font-bold">{label}</span>}
    </button>
  );

  // ฟังก์ชันคำนวณสีแบตเตอรี่
  const getBatColor = (v?: number) => {
    if (!v) return 'text-gray-500';
    if (v < 12.0) return 'text-red-500 animate-pulse'; // แบตอ่อนมาก
    if (v < 13.5) return 'text-yellow-400';
    return 'text-green-400';
  };

  const watchdogTimer = useRef<NodeJS.Timeout | null>(null); // 1. เพิ่มตัวจับเวลา

  // ฟังก์ชันสำหรับรีเซ็ตนาฬิกาจับตาย
  const feedWatchdog = () => {
    // ถ้ามีการเรียกฟังก์ชันนี้ แปลว่าหุ่นยังส่งข้อมูลมา -> เคลียร์เวลานับถอยหลัง
    if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
    
    // ตั้งเวลานับถอยหลังใหม่ อีก 2 วินาที ถ้าเงียบกริบ -> สั่ง OFFLINE
    watchdogTimer.current = setTimeout(() => {
      console.log("Watchdog Barked! (No data received)");
      setIsConnected(false);
      ws.current?.close(); // สั่งปิด Socket เพื่อเริ่มกระบวนการต่อใหม่
    }, 2000); 
  };

  return (
    <div className="flex flex-col h-[100dvh] w-screen bg-gray-900 text-white select-none touch-none overflow-hidden relative">
      
      {/* 🚨 Bumper Alert Overlay (ไฟกระพริบข้างจอเมื่อชน) */}
      <div className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-red-600 to-transparent transition-opacity duration-100 ${data.bump?.l ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-red-600 to-transparent transition-opacity duration-100 ${data.bump?.r ? 'opacity-100' : 'opacity-0'}`} />

      {/* 1. Header: Battery & Status */}
      <div className="flex justify-between items-center p-4 bg-gray-800/80 backdrop-blur z-10 border-b border-gray-700">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">BATTERY</span>
          <span className={`text-xl font-bold font-mono ${getBatColor(data.bat)}`}>
            {data.bat ? `${data.bat.toFixed(1)}V` : '--.-V'}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <div className={`w-3 h-3 rounded-full mb-1 ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
          <span className="text-xs text-gray-500">{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
      </div>

      {/* 2. Main Control Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-4">
        
        {/* แผงควบคุมตรงกลาง */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-sm aspect-square">
          {/* แถว 1 */}
          <div className="col-start-1 col-span-1 flex items-center justify-center">
            {/* ปุ่มพัดลม (Toggle) */}
            <button 
              onClick={() => send('FAN_ON')}
              className={`w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center transition-all ${data.fan ? 'border-blue-400 text-blue-400 bg-blue-900/20' : 'border-gray-600 text-gray-600'}`}
            >
              <span className="text-xs font-bold">FAN</span>
              <span className="text-lg">{data.fan ? `${data.fan}%` : 'OFF'}</span>
            </button>
          </div>

          <div className="relative w-64 h-64 mx-auto mb-8 grid grid-cols-3 grid-rows-3 gap-2">
        
        {/* 1. ปุ่มเดินหน้า (Forward) */}
        <button
          // เหตุการณ์เมาส์/นิ้ว (Touch) ยังคงต้องทำงานเหมือนเดิม
          onMouseDown={() => { send('F'); setActiveBtn('F'); }}
          onMouseUp={() => { send('S'); setActiveBtn(''); }}
          onTouchStart={(e) => { e.preventDefault(); send('F'); setActiveBtn('F'); }}
          onTouchEnd={(e) => { e.preventDefault(); send('S'); setActiveBtn(''); }}
          
          // 🖌️ ส่วนที่แก้: เช็ค activeBtn เพื่อเปลี่ยนหน้าตาปุ่ม
          className={`col-start-2 row-start-1 rounded-2xl flex items-center justify-center transition-all duration-100 shadow-lg border-2 border-gray-700
            ${activeBtn === 'F' 
              ? 'bg-green-500 scale-90 ring-4 ring-green-500/50 text-black border-transparent shadow-none' // สไตล์ตอนโดนกด (Active)
              : 'bg-gray-800 text-white hover:bg-gray-700' // สไตล์ปกติ
            }`}
        >
          <span className="text-4xl font-bold">▲</span>
        </button>

        {/* 2. ปุ่มเลี้ยวซ้าย (Left) */}
        <button
          onMouseDown={() => { send('L'); setActiveBtn('L'); }}
          onMouseUp={() => { send('S'); setActiveBtn(''); }}
          onTouchStart={(e) => { e.preventDefault(); send('L'); setActiveBtn('L'); }}
          onTouchEnd={(e) => { e.preventDefault(); send('S'); setActiveBtn(''); }}
          
          className={`col-start-1 row-start-2 rounded-2xl flex items-center justify-center transition-all duration-100 shadow-lg border-2 border-gray-700
            ${activeBtn === 'L' 
              ? 'bg-green-500 scale-90 ring-4 ring-green-500/50 text-black border-transparent shadow-none'
              : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
        >
          <span className="text-4xl font-bold">◀</span>
        </button>

        {/* 3. ปุ่มเลี้ยวขวา (Right) */}
        <button
          onMouseDown={() => { send('R'); setActiveBtn('R'); }}
          onMouseUp={() => { send('S'); setActiveBtn(''); }}
          onTouchStart={(e) => { e.preventDefault(); send('R'); setActiveBtn('R'); }}
          onTouchEnd={(e) => { e.preventDefault(); send('S'); setActiveBtn(''); }}
          
          className={`col-start-3 row-start-2 rounded-2xl flex items-center justify-center transition-all duration-100 shadow-lg border-2 border-gray-700
            ${activeBtn === 'R' 
              ? 'bg-green-500 scale-90 ring-4 ring-green-500/50 text-black border-transparent shadow-none'
              : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
        >
          <span className="text-4xl font-bold">▶</span>
        </button>

        {/* 4. ปุ่มถอยหลัง (Backward) */}
        <button
          onMouseDown={() => { send('B'); setActiveBtn('B'); }}
          onMouseUp={() => { send('S'); setActiveBtn(''); }}
          onTouchStart={(e) => { e.preventDefault(); send('B'); setActiveBtn('B'); }}
          onTouchEnd={(e) => { e.preventDefault(); send('S'); setActiveBtn(''); }}
          
          className={`col-start-2 row-start-3 rounded-2xl flex items-center justify-center transition-all duration-100 shadow-lg border-2 border-gray-700
            ${activeBtn === 'B' 
              ? 'bg-green-500 scale-90 ring-4 ring-green-500/50 text-black border-transparent shadow-none'
              : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
        >
          <span className="text-4xl font-bold">▼</span>
        </button>
        
        {/* ตรงกลางใส่เป็นปุ่มหยุด หรือ Logo เท่ๆ ก็ได้ */}
        <div className="col-start-2 row-start-2 bg-black/50 rounded-full flex items-center justify-center border border-gray-800">
           <span className="text-xs text-gray-500">STOP</span>
        </div>

      </div>
        </div>

      </div>

      {/* 3. Footer Log */}
      <div className="h-8 bg-black text-green-500 font-mono text-xs flex items-center px-4 overflow-hidden whitespace-nowrap border-t border-gray-800">
        <span className="opacity-50 mr-2">&gt;</span>
        {data.log || "System Ready..."}
        {data.bump?.l ? <span className="ml-4 text-red-500 font-bold">[HIT LEFT]</span> : null}
        {data.bump?.r ? <span className="ml-4 text-red-500 font-bold">[HIT RIGHT]</span> : null}
      </div>

      {/* 1. ปุ่มกดเปิด/ปิด (มุมขวาล่าง) */}
      <button 
        onClick={() => setIsLogOpen(!isLogOpen)}
        className="absolute bottom-6 right-6 w-12 h-12 bg-black border-2 border-green-500 rounded-full flex items-center justify-center shadow-lg z-50 hover:bg-gray-800 transition-all active:scale-90"
      >
        {/* ไอคอน Terminal */}
        <span className="text-green-500 font-bold text-xl">{isLogOpen ? 'X' : '>_'}</span>
        
        {/* จุดแดงแจ้งเตือนถ้าปิดอยู่แล้วมี Log เข้ามา (Optional) */}
        {!isLogOpen && logHistory.length > 0 && (
           <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
        )}
      </button>

      {/* 2. กล่องข้อความ (Draggable) */}
      {isLogOpen && (
        <div 
          style={{ 
            left: `${position.x}px`, 
            top: `${position.y}px`,
            position: 'fixed' // ต้องเป็น fixed เพื่อให้อิงกับหน้าจอ
          }}
          className="w-80 h-64 bg-black/95 backdrop-blur border border-green-500 rounded-lg flex flex-col shadow-2xl z-50 overflow-hidden"
        >
          {/* --- Header (โซนที่กดแล้วลากได้) --- */}
          <div 
            onMouseDown={startDrag} // <--- จุดเริ่มลากอยู่ที่นี่
            className="bg-green-900/30 p-2 cursor-move flex justify-between items-center select-none border-b border-green-800"
          >
            <span className="text-xs font-bold text-green-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              TERMINAL
            </span>
            <div className="flex gap-2">
              <button onClick={() => setLogHistory([])} className="text-[10px] text-green-600 hover:text-green-300 border border-green-800 px-1 rounded">CLR</button>
              <button onClick={() => setIsLogOpen(false)} className="text-[10px] text-red-500 hover:text-red-300 font-bold px-1">X</button>
            </div>
          </div>
          
          {/* --- Content (โซนข้อความ) --- */}
          <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1 scrollbar-thin scrollbar-thumb-green-700 scrollbar-track-transparent text-gray-300">
            {logHistory.length === 0 && <span className="opacity-30 italic">Waiting for connection...</span>}
            
            {logHistory.map((log, index) => (
              <div key={index} className="break-words border-l-2 border-green-900 pl-2 hover:bg-green-900/10">
                <span className="text-green-600 mr-2 text-[10px] opacity-70">➜</span>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}