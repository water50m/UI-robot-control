import React, { useEffect, useRef, useState } from 'react';
import { useRobot } from '@/hooks/useRobot';
import RobotVisualizer from '../RobotVisualizer';
import { useMapInteractive } from './useMapInteractive'; 
import { renderMapFrame, drawTrailLayer } from './canvasDrawer'; 
import { useRobotPath } from './useRobotPath';

interface Point {
  x: number;
  y: number;
}

interface Props {
  lidarPoints?: Point[];
  width?: number;
  height?: number;
}

export default function MapDisplay({ lidarPoints = [], width = 800, height = 600 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showControls, setShowControls] = useState(false);
  const [showTrail, setShowTrail] = useState(true);
  const [showRobot, setShowRobot] = useState(true);

  
  // 1. เรียกใช้ Hook ที่เราแยกออกไป
  const { scale, setScale, offset, setOffset, isDragging, handlers, resetView } = useMapInteractive(5);

  // 2. ข้อมูล Robot
  const { robotData, motorSpeed } = useRobot();
  if(robotData.type == "telemetry" && robotData.mR != 0 && robotData.mL != 0){

  }
  
  // จัดเตรียม Data (กันเหนียวเผื่อ data เป็น null)
  const robotPose = {
    x: robotData?.x ?? 0,
    y: robotData?.y ?? 0,
    yaw: robotData?.theta ?? 0,
  };

  const { pathHistory, visitedCells, clearPath } = useRobotPath(robotPose);
  const UNIT_CONVERTER = 100; // 100 cm = 1 m
  // 3. useEffect สำหรับวาด Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // เรียกใช้ฟังก์ชันวาดที่เราแยกไฟล์ไว้
    renderMapFrame(ctx, width, height, scale, offset, lidarPoints);
    if (showTrail) {
        drawTrailLayer({
            ctx, width, height, scale, offset,
            pathHistory, visitedCells, pixelsPerMeter: UNIT_CONVERTER
        });
    }

  }, [lidarPoints, width, height, scale, offset, pathHistory, visitedCells, showTrail]);


  // 4. คำนวณตำแหน่ง HTML Overlay (Logic เดิมที่คุณชอบ)
  

  // สูตรเดิม (Forward = Right)
  // const robotScreenX = (width / 2) + offset.x + (currentPose.x * UNIT_CONVERTER * scale);
  // const robotScreenY = (height / 2) + offset.y - (currentPose.y * UNIT_CONVERTER * scale);

  const robotScreenX = (width / 2) + offset.x - (robotPose.y * UNIT_CONVERTER * scale);

  // 2. เอาค่า X ของหุ่น มาเป็นแกน Y ของจอ (และต้องลบ เพราะจอคอม Y ขึ้นคือค่าลดลง)
  const robotScreenY = (height / 2) + offset.y - (robotPose.x * UNIT_CONVERTER * scale);
  const displaySize = 35 * (scale / 10);
  return (
    <div 
      className="relative overflow-hidden" 
      style={{ width, height }} 
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onWheel={handlers.onWheel} // Event Wheel
    >
      
      {/* Layer 1: Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`cursor-crosshair active:cursor-grabbing touch-none ${isDragging ? 'cursor-grabbing' : ''}`}
        {...handlers} // ใส่ Mouse Event ทั้งหมดตรงนี้ (Down, Move, Up)
      />

      {/* Layer 2: Robot Overlay */}
      {showRobot && (
        <div 
          className="absolute pointer-events-none transition-transform duration-75 will-change-transform flex items-center justify-center"
          style={{
              left: robotScreenX,
              top: robotScreenY,
              // Logic ของคุณ
              transform: `translate(-50%, -50%) rotate(${-robotPose.yaw}rad) scale(${scale/10})`
          }}
        >
            <RobotVisualizer 
                mL={motorSpeed.L} 
                mR={motorSpeed.R} 
                isVacuumOn={robotData?.fan === 1}
                sensors={{
                  bumperL: null, bumperR: null,
                  cliffL: null, cliffR: null,
                  irL1: null, irL2: null, irR1: null, irR2: null,
                }} 
                fakeTurn={false}
            />
        </div>
      )}

      {/* Controls UI (ปุ่ม Zoom) */}
      <div className={`absolute top-20 right-4 flex flex-col gap-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={() => setScale(s => Math.min(s * 1.2, 10))} className="w-8 h-8 bg-gray-800 text-white rounded shadow border border-gray-600 hover:bg-gray-700 font-bold">+</button>
        <button onClick={() => setScale(s => Math.max(s / 1.2, 0.1))} className="w-8 h-8 bg-gray-800 text-white rounded shadow border border-gray-600 hover:bg-gray-700 font-bold">-</button>
        <button onClick={resetView} className="w-8 h-8 bg-gray-800 text-white rounded shadow border border-gray-600 hover:bg-gray-700 text-xs">⟲</button>
        <button onClick={() => setShowTrail(!showTrail)} className="..." title="Toggle Trail">
           {showTrail ? '👁️' : '🙈'}
         </button>
         <button onClick={clearPath} className="..." title="Clear Trail">
           🗑️
         </button>
         <button 
          onClick={() => setShowRobot(!showRobot)} 
          className={`w-8 h-8 rounded shadow border border-gray-600 font-bold text-xs mt-1 
              ${showRobot ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
          title="Show/Hide Robot"
        >
          🤖
        </button>
      </div>

      <div className="absolute bottom-2 left-2 text-xs text-gray-500 font-mono pointer-events-none">
        ZOOM: {scale.toFixed(2)}x
      </div>
    </div>
  );
}

