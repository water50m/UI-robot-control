import Wheel from './Wheel';
import SensorNode from './SensorNode';
import Bumper from './Bumper'; 
import Radar from './Radar';
import { useState, useEffect } from 'react';

interface VisualizerProps {
  mL: number;
  mR: number;
  isVacuumOn: boolean;
  sensors: {
    bumperL: boolean | null;
    bumperR: boolean | null;
    cliffL: boolean | null;
    cliffR: boolean | null;
    irL1?: boolean | null; 
    irL2?: boolean | null; 
    irR1?: boolean | null;
    irR2?: boolean | null;

  };
  fakeTurn?: boolean;
}  

export default function RobotVisualizer({ mL, mR, isVacuumOn, sensors, fakeTurn=true }: VisualizerProps) {

    // สูตร: (ผลต่างความเร็ว / ความเร็วสูงสุด) * องศาที่ต้องการเอียงสูงสุด
    const maxTiltAngle = 15; // เอียงสูงสุด 15 องศา (ปรับได้)
    const maxSpeed = 255;    // PWM สูงสุดที่คาดหวัง
    
    // คำนวณผลต่าง (ซ้าย - ขวา)
    // ถ้าซ้ายเร็วกว่า -> ค่าเป็นบวก -> รถเอียงขวา (ตามเข็ม)
    // ถ้าขวาเร็วกว่า -> ค่าเป็นลบ -> รถเอียงซ้าย (ทวนเข็ม)
    const speedDiff = mL - mR;

  let targetRotation = 0;
  // แปลงเป็นองศา
  if(fakeTurn){targetRotation = (speedDiff / maxSpeed) * maxTiltAngle;}


  return (
    <div className="flex flex-col items-center justify-center p-6 bg-transparent   w-full h-full min-h-[300px]">
      <div 
        className="relative w-56 h-56 transition-transform duration-500 ease-out will-change-transform"
        style={{ 
          // ใช้ Inline Style เพื่อกำหนดองศาละเอียดทศนิยมได้เลย
          transform: `rotate(${targetRotation}deg)` 
        }}
      >
        
        {/* Wheels */}
        <Wheel side="left" speed={mL} />
        <Wheel side="right" speed={mR} />

        {/* ✅ 3. วาง Radar ไว้ตรงนี้ (ก่อน Robot Body เพื่อให้มันอยู่ข้างล่าง/ข้างหลัง) */}
        {/* ขยายขนาด wrapper นิดหน่อย เพื่อให้คลื่นเรดาร์พุ่งออกไปนอกตัวรถได้สวยๆ */}
        <div className="absolute -inset-4 z-0">
           <Radar 
             statusL1={sensors.irL1 ?? null} // ถ้าไม่มีค่า ส่ง null (สีส้ม)
             statusL2={sensors.irL2 ?? null} 
             statusR1={sensors.irR1 ?? null}
             statusR2={sensors.irR2 ?? null}
             statusBR={sensors.irR2 ?? null}
             statusBL={sensors.irR2 ?? null}
           />
        </div>

        {/* Robot Body */}
        <div className="absolute inset-0 bg-gray-800 rounded-full border-[2px] border-gray-700 shadow-2xl flex items-center justify-center overflow-visible z-10">
          
          {/* ✅ 2. เรียกใช้ Bumper ตรงนี้ (ส่ง status ไปให้มันจัดการเอง) */}
          <Bumper statusL={sensors.bumperL} statusR={sensors.bumperR} />

            {/* === CLIFF SENSORS (3 จุด) === */}
            
            {/* 1. Side Left (ด้านข้างซ้าย - ก่อนถึงล้อ) */}
            {/* top-40% คือตำแหน่งเกือบกึ่งกลาง (ก่อนถึงล้อที่อยู่ 50%) */}
            <SensorNode label="CLIFF L" status={sensors.cliffL} position="top-[38%] left-[5%]" />

            {/* 2. Front Center (ด้านหน้าตรงกลาง) */}
            {/* left-1/2 -translate-x-1/2 ช่วยจัดให้อยู่กึ่งกลางเป๊ะๆ */}
            <SensorNode 
                label="CLIFF F" 
                // หมายเหตุ: เนื่องจาก Data เรามีแค่ L/R ผมเลยให้ Front ทำงานถ้า L หรือ R ทำงาน (หรือคุณจะ map กับตัวแปรใหม่ก็ได้)
                status={sensors.cliffL || sensors.cliffR} 
                position="top-[6%] left-1/2 -translate-x-1/2" 
            />

            {/* 3. Side Right (ด้านข้างขวา - ก่อนถึงล้อ) */}
            <SensorNode label="CLIFF R" status={sensors.cliffR} position="top-[38%] right-[5%]" />

          {/* Vacuum Fan */}
            <div className="relative z-10 flex flex-col items-center mt-4">
                {/* Container หลัก (กำหนดขนาด แต่ไม่หมุน) */}
                <div className="relative w-16 h-16 flex items-center justify-center">
                    
                    {/* 1. ส่วนที่หมุน (Spinning Ring / Blades) - แยกออกมาเป็น Layer ต่างหาก */}
                    <div className={`absolute inset-0 rounded-full border-2 border-dashed border-white/20 transition-all duration-1000 
                    ${isVacuumOn ? 'animate-spin-fast border-t-blue-400 border-l-blue-400' : 'opacity-20'}`} 
                    />
                    
                    {/* 2. ส่วนแสงฟุ้ง (Glow Effect) - อยู่ข้างหลัง */}
                    <div className={`absolute inset-0 rounded-full transition-all duration-500 
                    ${isVacuumOn ? 'shadow-[0_0_30px_#3b82f6] bg-blue-500/10' : 'bg-black/40'}`} 
                    />

                    {/* 3. ส่วนข้อความ (Static Label) - อยู่นิ่งๆ ตรงกลาง */}
                    <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-[10px] font-black tracking-tighter shadow-inner transition-colors duration-500 
                    ${isVacuumOn ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white' : 'bg-gray-800 text-gray-500'}`}>
                    VAC
                    </div>

                </div>
            </div>

          {/* Tail */}
          <div className="absolute bottom-4 w-20 h-1 bg-gray-600 rounded-full opacity-30"></div>
        </div>

        {/* Caster Wheel */}
        <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-5 h-5 bg-gray-900 rounded-full border border-gray-600 z-10 shadow-inner flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-500 rounded-full opacity-50"></div>
        </div>

      </div>
    </div>
  );
}