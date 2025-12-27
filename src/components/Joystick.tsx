import { useEffect, useRef, useState } from 'react';
import { Direction } from '@/types/robot';

interface Props {
  send: (cmd: string) => void;
  activeBtn?: Direction; // 👈 1. เพิ่มรับค่าปุ่มที่กำลังกด
}

export default function Joystick({ send, activeBtn }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const posRef = useRef(pos);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);


  useEffect(() => {
    if (isDragging.current) return;

    const maxDist = 40;
    const diagDist = 28;
    let newX = 0, newY = 0;

    if (activeBtn) {
      switch (activeBtn) {
        case "F": newY = -maxDist; break;
        case "B": newY = maxDist; break;
        case "L": newX = -maxDist; break;
        case "R": newX = maxDist; break;
        case "FL": newX = -diagDist; newY = -diagDist; break;
        case "FR": newX = diagDist;  newY = -diagDist; break;
        case "BL": newX = -diagDist; newY = diagDist;  break;
        case "BR": newX = diagDist;  newY = diagDist;  break;
      }
    }

    setPos({ x: newX, y: newY });
  }, [activeBtn]);


  useEffect(() => {
    const interval = setInterval(() => {
      const maxDist = 40;

      if (!isDragging.current && !activeBtn) {
        send(JSON.stringify({ x: 0, y: 0 }));
        return;
      }

      const { x, y } = posRef.current;
      console.log({
        x: Math.round((x / maxDist) * 100),
        y: Math.round((y / maxDist) * -100),
      });
      send(JSON.stringify({
        x: Math.round((x / maxDist) * 100),
        y: Math.round((y / maxDist) * -100),
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [send, activeBtn]);

  
  // ------------------------------------------------------------------
  // (เผื่อคุณหาโค้ดเดิมไม่เจอ ผมแปะ Full Code ของ handleMove ให้ข้างล่างนี้ครับ)
  const handleMove = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    // จุดศูนย์กลาง joystick
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;

    const maxDist = 40;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // จำกัดระยะ
    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }

    setPos({ x: dx, y: dy });
  };

  const start = () => { isDragging.current = true; };
  
  const end = () => { 
    isDragging.current = false; 
    setPos({ x: 0, y: 0 }); 
    send(JSON.stringify({ x: 0, y: 0 })); 
  };
  
  // Logic เดิมของ Mouse/Touch Event
  useEffect(() => {
    const onMove = (e: MouseEvent) => { if(isDragging.current) handleMove(e.clientX, e.clientY); };
    const onUp = () => { if(isDragging.current) end(); };
    const onTouchMove = (e: TouchEvent) => { if(isDragging.current) handleMove(e.touches[0].clientX, e.touches[0].clientY); };
    
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', end);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', end);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      onMouseDown={start}
      onTouchStart={start}
      className="w-48 h-48 bg-gray-800/50 rounded-full border-4 border-gray-600 relative touch-none mx-auto backdrop-blur-sm shadow-inner transition-colors duration-300 hover:border-gray-500"
    >
      <div 
        ref={stickRef}
        style={{ 
          transform: `translate(${pos.x}px, ${pos.y}px)`,
          // เพิ่ม transition เพื่อความนุ่มนวลเวลากดคีย์บอร์ด
          transition: isDragging.current ? 'none' : 'transform 0.1s ease-out' 
        }}
        className={`w-16 h-16 rounded-full absolute top-1/2 left-1/2 -mt-8 -ml-8 shadow-2xl border-2 border-white/20 cursor-grab active:cursor-grabbing
          ${(pos.x !== 0 || pos.y !== 0) ? 'bg-green-500' : 'bg-gradient-to-b from-gray-600 to-gray-800'} 
        `}
      >
        <div className="w-12 h-6 bg-white/20 rounded-t-full mx-auto mt-1 blur-[2px]"></div>
      </div>
    </div>
  );
}