import React from 'react';

interface Props {
  mL: number; // ความเร็วล้อซ้ายจากบอร์ด
  mR: number; // ความเร็วล้อขวาจากบอร์ด
  isVacuumOn?: boolean; // สถานะมอเตอร์ดูดฝุ่น (ถ้ามี)
}

export default function RobotVisualizer({ mL, mR, isVacuumOn }: Props) {
  // คำนวณความเร็วแอนิเมชัน (ยิ่งค่ามาก ยิ่งหมุนเร็ว)
  const getSpinDuration = (speed: number) => {
    if (speed === 0) return '0s';
    const duration = Math.abs(255 / speed) * 0.5; // ปรับตัวเลขเพื่อความสวยงาม
    return `${Math.max(duration, 0.1)}s`;
  };

  const wheelStyle = (speed: number) => ({
    animationDuration: getSpinDuration(speed),
    animationDirection: speed < 0 ? 'reverse' : 'normal' as any,
    animationPlayState: speed === 0 ? 'paused' : 'running' as any,
    // ➕ เพิ่มบรรทัดนี้: ทำให้เวลาเปลี่ยนความเร็ว แอนิเมชันจะค่อยๆ ปรับความเร็วตาม ไม่วาร์ป
    transition: 'animation-duration 0.3s ease-out', 
    });


  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-900/50 rounded-xl border border-gray-700 backdrop-blur-sm shadow-inner">
      <div className="relative w-48 h-48">
        
        {/* 1. ส่วนล้อซ้าย (Left Wheel) */}
        <div className="absolute left-[-15px] top-1/2 -translate-y-1/2 w-8 h-16 bg-gray-800 border-2 border-green-500/50 rounded-md z-10 overflow-hidden">
            <div 
                style={wheelStyle(mL)}
                className={`w-full h-[200%] flex flex-col justify-between items-center opacity-50 ${mL !== 0 ? 'animate-wheel-spin' : ''}`}
            >
                {/* ใช้เส้นทั้งหมด 12 เส้น (ชุดละ 6 เส้น) */}
                {[...Array(12)].map((_, i) => (
                <div key={i} className="w-full h-[2px] bg-green-500 shrink-0 shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
                ))}
            </div>
        </div>

        {/* 2. ส่วนล้อขวา (Right Wheel) */}
        <div className="absolute right-[-15px] top-1/2 -translate-y-1/2 w-8 h-16 bg-gray-800 border-2 border-green-500/50 rounded-md z-10 overflow-hidden">
    
            {/* ตัวเลื่อนลายล้อ (Inner Container) */}
            <div 
                style={wheelStyle(mR)} // ใช้ค่า mR สำหรับล้อขวา
                className={`w-full h-[200%] flex flex-col justify-between items-center opacity-60 ${mR !== 0 ? 'animate-wheel-spin' : ''}`}
            >
                {/* สร้างลายล้อ 12 เส้น (ชุดละ 6 เส้น ต่อกัน 2 ชุด) */}
                {[...Array(12)].map((_, i) => (
                <div 
                    key={i} 
                    className="w-full h-[3px] bg-green-500 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                ></div>
                ))}
            </div>

        </div>

        {/* 3. ตัวรถ (Robot Body) */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-700 to-gray-800 rounded-full border-4 border-gray-600 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
          {/* หน้ากากตัวรถ */}
          <div className="absolute top-0 w-full h-1/3 bg-white/5 border-b border-white/10"></div>
          
          {/* ช่องพัดลมดูดฝุ่น (Vacuum Status) */}
          <div className={`w-16 h-16 rounded-full border-4 ${isVacuumOn ? 'border-blue-400 bg-blue-900/50 animate-pulse' : 'border-gray-600 bg-gray-900'} flex items-center justify-center transition-colors duration-500`}>
             <span className="text-[10px] text-gray-400 font-bold">VACUUM</span>
          </div>

          <div className="mt-2 text-[10px] font-mono text-green-500 font-bold bg-black/50 px-2 py-1 rounded">
             {mL} | {mR}
          </div>
        </div>

        {/* 4. ลูกล้อหน้า (Caster Wheel) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900 border border-gray-500 rounded-full"></div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 w-full text-center">
        <div className="text-xs text-gray-400">LEFT MOTOR<br/><span className={mL !== 0 ? 'text-green-400' : ''}>{Math.abs(Math.round((mL/255)*100))}%</span></div>
        <div className="text-xs text-gray-400">RIGHT MOTOR<br/><span className={mR !== 0 ? 'text-green-400' : ''}>{Math.abs(Math.round((mR/255)*100))}%</span></div>
      </div>

      <style jsx>{`
        @keyframes wheel-spin {
          from { transform: translateY(0); }
          to { transform: translateY(-10px); }
        }
        .animate-wheel-spin {
          /* ใช้แอนิเมชันขยับลายล้อแทนการหมุน 3D เพื่อความเบาของเบราว์เซอร์ */
          animation: wheel-spin linear infinite;
        }
      `}</style>
    </div>
  );
}