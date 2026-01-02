// components/ControlPad.tsx
import { Direction } from '../types/robot';
import { useState, useEffect } from 'react';

interface Props {
  send: (cmd: string) => void;
  activeBtn: Direction;
  isConnected: boolean;
  setActiveBtn: (cmd: Direction) => void; // 👈 ต้องมีบรรทัดนี้ด้วย
}

export default function ControlPad({ send, activeBtn, isConnected, setActiveBtn }: Props) {
  
  const [pos, setPos] = useState({ x: 0, y: 0 });

  // ⚠️ โหมด Debug: ถ้าอยากเทส UI โดยไม่ต้องต่อหุ่น ให้แก้บรรทัดนี้เป็น true
  const safeConnected = true; // หรือแก้เป็น = true ชั่วคราวถ้าจะเทส

  const renderBtn = (cmd: Direction, label: string, gridPosition: string) => {
    // เช็ค active (ถ้าเทสให้ใช้ safeConnected แทน isConnected)
    const isActive = activeBtn === cmd && safeConnected; 

    // 2. ฟังก์ชันกด (สั่งทั้งส่งข้อมูล และ เปลี่ยนสีปุ่ม)
    const handlePress = () => {
      if (safeConnected) {
        setActiveBtn(cmd);
      }
    };

    // 3. ฟังก์ชันปล่อย
    const handleRelease = () => {
      if (safeConnected) {
        setActiveBtn(null);
      }
    };
    useEffect(() => {
        if (!activeBtn) {
          setPos({ x: 0, y: 0 });
          return;
        }
        const maxDist = 100;
        const diagDist = 60;
        let newX = 0, newY = 0;
    
        if (activeBtn) {
          
          switch (activeBtn) {
            case "F": newY = maxDist; break;
            case "B": newY = -maxDist; break;
            case "L": newX = -maxDist; break;
            case "R": newX = maxDist; break;
            case "FL": newX = -diagDist; newY = diagDist; break;
            case "FR": newX = diagDist;  newY = diagDist; break;
            case "BL": newX = -diagDist; newY = -diagDist;  break;
            case "BR": newX = diagDist;  newY = -diagDist;  break;
          }
        }
        setPos({ x: newX, y: newY });
      }, [activeBtn]);

      useEffect(() => {
        if (!isConnected) return;

        const id = setInterval(() => {
          send(JSON.stringify({ x: pos.x, y: pos.y }));
        }, 100);

        return () => clearInterval(id);
      }, [pos, isConnected]);
    return (
      <button
        onMouseDown={handlePress}
        onMouseUp={handleRelease}
        onMouseLeave={handleRelease}
        onTouchStart={(e) => { e.preventDefault(); handlePress(); }}
        onTouchEnd={(e) => { e.preventDefault(); handleRelease(); }}
        
        disabled={!safeConnected} // ล็อคปุ่มถ้า Offline

        className={`
          ${gridPosition}
          w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold transition-all duration-75 border-2
          
          ${!safeConnected 
            ? 'bg-gray-800/20 border-gray-800 text-gray-700 cursor-not-allowed shadow-none' // Offline
            : isActive
              ? 'bg-green-500 text-black scale-90 ring-4 ring-green-500/50 border-transparent shadow-none' // Active (กดติดแล้ว!)
              : 'bg-gray-800 text-white border-gray-700 shadow-lg hover:bg-gray-700 hover:border-gray-500' // Normal
          }
        `}
      >
        {label}
      </button>
    );
  };
  
  return (
    <div className={`grid grid-cols-3 grid-rows-3 gap-2 w-60 h-60 mx-auto p-4 rounded-full border backdrop-blur-sm transition-colors duration-500
        ${isConnected 
          ? 'bg-gray-800/30 border-gray-700/50' // พื้นหลังตอน Online
          : 'bg-black/10 border-gray-900/50 grayscale' // พื้นหลังตอน Offline
        }
    `}>
      
      {renderBtn('F', '▲', 'col-start-2 row-start-1')}
      {renderBtn('L', '◀', 'col-start-1 row-start-2')}

      {/* ปุ่ม STOP ตรงกลาง */}
      <div className="col-start-2 row-start-2 flex items-center justify-center">
        <div className={`w-14 h-14 rounded-full border flex items-center justify-center shadow-inner transition-all
            ${!isConnected ? 'border-gray-800 bg-gray-900' : 'border-gray-600 bg-black/50'}
        `}>
          <span className={`text-[10px] tracking-widest ${isConnected ? 'text-gray-400' : 'text-gray-800'}`}>
            STOP
          </span>
        </div>
      </div>

      {renderBtn('R', '▶', 'col-start-3 row-start-2')}
      {renderBtn('B', '▼', 'col-start-2 row-start-3')}

    </div>
  );
}