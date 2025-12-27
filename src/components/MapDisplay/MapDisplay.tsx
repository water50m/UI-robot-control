import { useEffect, useRef, useState } from 'react';
import { useRobot } from '@/hooks/useRobot';

// 👇 1. Import Component หุ่นยนต์ของคุณเข้ามาตรงนี้
// สมมติว่าชื่อ RobotGraphic (เปลี่ยนเป็นชื่อจริงของคุณได้เลย)
// import RobotGraphic from './RobotGraphic'; 
import RobotVisualizer from '../RobotVisualizer';

interface Point {
  x: number;
  y: number;
}

interface RobotPose {
  x: number;
  y: number;
  yaw: number;
}

interface Props {
  lidarPoints: Point[];
  robotPose: RobotPose;
  width?: number;
  height?: number;
  // รับ Component หุ่นยนต์เข้ามาเป็น Prop ก็ได้ (Optional)
  children?: React.ReactNode; 
}

export default function MapDisplay({ lidarPoints, robotPose, width = 800, height = 600, children }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State Zoom/Pan
  const [scale, setScale] = useState(0.5);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  // State Mouse Drag
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  const [showControls, setShowControls] = useState(false);



  const { 
    robotData, 
     motorSpeed,  
  } = useRobot();

  // --- ส่วน Canvas (วาดแค่ Grid และ Lidar) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      // Clear จอ
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      
      // Transform (Pan & Zoom)
      ctx.translate(width / 2, height / 2);
      ctx.translate(offset.x, offset.y);
      ctx.scale(scale, scale);

      // 1. วาด Grid
      drawGrid(ctx, scale);

      // 2. วาดจุด Lidar
      ctx.fillStyle = '#10b981';
      for (const p of lidarPoints) {
        ctx.fillRect(p.x, -p.y, 2, 2);
      }

      // ❌ ไม่วาดหุ่นในนี้แล้ว เราจะใช้วิธี Overlay แทน
      
      ctx.restore();
    };

    draw();
  }, [lidarPoints, width, height, scale, offset]); // ตัด robotPose ออกจาก dependency ของ canvas ก็ได้ ถ้าไม่ได้ใช้วาดในนี้


  // --- Helper: คำนวณตำแหน่งหุ่นบนหน้าจอ (World -> Screen) ---
  // สูตร: (Center + PanOffset) + (RobotPosition * ZoomScale)
  // ต้องกลับเครื่องหมายแกน Y เพราะในคอมพิวเตอร์ Y ลงคือบวก
  const robotScreenX = (width / 2) + offset.x + (robotPose.x * scale);
  const robotScreenY = (height / 2) + offset.y - (robotPose.y * scale);


  // --- Event Handlers (Mouse Drag & Zoom) เหมือนเดิม ---
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastMouse({ x: e.clientX, y: e.clientY });
  };
  const handleMouseUp = () => setIsDragging(false);

  // 2. 🖱️ แก้ฟังก์ชัน handleWheel เพื่อล็อก Scrollbar
  const handleWheel = (e: React.WheelEvent) => {
    // คำสั่งนี้จะห้ามไม่ให้ Browser เลื่อนหน้าเว็บลง
    // แต่มันจะทำงานได้ดีที่สุดถ้าเราใส่ overflow-hidden ที่หน้า page ด้วย (ดูข้อ 2)
    
    // คำนวณ Zoom
    const zoomSensitivity = 0.001;
    const newScale = scale - (e.deltaY * zoomSensitivity * scale);
    
    // ปรับลิมิตการซูม (Min 0.1, Max 10)
    if (newScale > 0.1 && newScale < 10) {
      setScale(newScale);
    }
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, currentScale: number) => {
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1 / currentScale;
    const gridSize = 50;
    const limit = 5000;
    ctx.beginPath();
    for (let i = -limit; i <= limit; i += gridSize) {
      ctx.moveTo(i, -limit); ctx.lineTo(i, limit);
      ctx.moveTo(-limit, i); ctx.lineTo(limit, i);
    }
    ctx.stroke();
  };

  return (
    <div className="relative overflow-hidden " style={{ width, height }} onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)} onWheel={handleWheel}>
      
      {/* Layer 1: Canvas (พื้นหลัง + จุด) */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`cursor-crosshair active:cursor-grabbing touch-none ${isDragging ? 'cursor-grabbing' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Layer 2: Robot Component Overlay (ลอยอยู่ข้างบน) */}
      <div 
        className="absolute pointer-events-none transition-transform duration-75 will-change-transform flex items-center justify-center "
        style={{
            // ย้าย Div ไปที่ตำแหน่งที่คำนวณได้
            left: robotScreenX,
            top: robotScreenY,
            // หมุน Div ตามมุมรถ (Radian -> Deg)
            // *หมายเหตุ: -robotPose.yaw คือหมุนทวนเข็มตามหลักคณิตศาสตร์
            transform: `translate(-50%, -50%) rotate(${-robotPose.yaw}rad) scale(${scale})`
        }}
      >

        {/* ✅ เพิ่ม div นี้เพื่อให้เมาส์ชี้โดนหุ่นได้ (Pointer Events Auto) */}


          {/* 👇 ใส่ Component ของคุณตรงนี้! */}
          {/* <RobotGraphic mode="map" /> หรือ children ที่ส่งเข้ามา */}
          <RobotVisualizer 
                mL={motorSpeed.L} 
                mR={motorSpeed.R} 
                isVacuumOn={robotData?.fan === 1 || false} // ส่งค่านี้ได้แล้ว ไม่ Error
                sensors={{
                  // ส่งค่าเซนเซอร์จำลองไปก่อน (เดี๋ยวค่อยผูกกับ data จริง)
                  bumperL: null,  // null = สีเทา (No Signal)
                  bumperR: null,
                  cliffL: null,  // false = สีเขียว (Normal)
                  cliffR: null,
                  irL1: null,  
                  irL2: null,
                  irR1: null,
                  irR2: null,
                }} 
                fakeTurn={false}
            />
          
          {/* {children ? children : (
             // Placeholder ถ้ายังไม่ได้ส่ง Component มา
             <div className="w-10 h-10 bg-blue-500 rounded-full border-2 border-white shadow-lg relative">
                <div className="absolute top-1/2 right-0 w-1/2 h-1 bg-white" />
             </div>
          )} */}

      </div>


      {/* Controls UI (ปุ่ม Zoom) */}
      <div className={`absolute top-20 right-4 flex flex-col gap-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        
        <button onClick={() => setScale(s => Math.min(s * 1.2, 10))} className="w-8 h-8 bg-gray-800 text-white rounded shadow border border-gray-600 hover:bg-gray-700 font-bold">+</button>
        <button onClick={() => setScale(s => Math.max(s / 1.2, 0.1))} className="w-8 h-8 bg-gray-800 text-white rounded shadow border border-gray-600 hover:bg-gray-700 font-bold">-</button>
        <button onClick={() => { setScale(0.8); setOffset({x:0, y:0}); }} className="w-8 h-8 bg-gray-800 text-white rounded shadow border border-gray-600 hover:bg-gray-700 text-xs">⟲</button>
      
      </div>

      <div className="absolute bottom-2 left-2 text-xs text-gray-500 font-mono pointer-events-none">
        ZOOM: {scale.toFixed(2)}x
      </div>
    </div>
  );
}