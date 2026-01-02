import { useState, useEffect, useRef } from 'react';

interface Props {
  logs: string[];
  onClear: () => void;
}

export default function Terminal({ logs, onClear }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // ตำแหน่งและขนาด
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 300, h: 200 });

  const isInitialized = useRef(false);

  
  
  const dragInfo = useRef<{
    mode: 'MOVE' | 'RESIZE' | null;
    resizeDir: string | null;
    startX: number;
    startY: number;
    startPos: { x: number, y: number };
    startSize: { w: number, h: number };
    hasMoved: boolean;
  }>({
    mode: null,
    resizeDir: null,
    startX: 0,
    startY: 0,
    startPos: { x: 0, y: 0 },
    startSize: { w: 0, h: 0 },
    hasMoved: false
  });

  
  // ตั้งค่าเริ่มต้น (มุมขวาล่าง)
  useEffect(() => {
    if (!isInitialized.current) {
      setPos({ 
        x: 70, 
        y: window.innerHeight - 70 
      });
      isInitialized.current = true;
    }
  }, []);

  // auto-scroll
  useEffect(() => {
    if (!isPaused && scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isPaused, isOpen]);

  // --- Core Logic: จัดการเมาส์ ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragInfo.current.mode) return;

      const { startX, startY, startPos, startSize, resizeDir } = dragInfo.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        dragInfo.current.hasMoved = true;
      }

      // 1. โหมดเคลื่อนย้าย (Move)
      if (dragInfo.current.mode === 'MOVE') {
        let newX = startPos.x + dx;
        let newY = startPos.y + dy;
        
        const currentW = isOpen ? size.w : 48;
        const currentH = isOpen ? size.h : 48;
        const maxX = window.innerWidth - currentW;
        const maxY = window.innerHeight - currentH;
        
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        setPos({ x: newX, y: newY });
      } 
      // 2. โหมดย่อขยาย (Resize)
      else if (dragInfo.current.mode === 'RESIZE' && resizeDir) {
        let newW = startSize.w;
        let newH = startSize.h;
        let newX = startPos.x;
        let newY = startPos.y;

        if (resizeDir.includes('e')) newW = startSize.w + dx;
        if (resizeDir.includes('w')) { newW = startSize.w - dx; newX = startPos.x + dx; }
        if (resizeDir.includes('s')) newH = startSize.h + dy;
        if (resizeDir.includes('n')) { newH = startSize.h - dy; newY = startPos.y + dy; }

        const MIN_W = 200;
        const MIN_H = 150;

        if (newW < MIN_W) { newW = MIN_W; if (resizeDir.includes('w')) newX = startPos.x + (startSize.w - MIN_W); }
        if (newH < MIN_H) { newH = MIN_H; if (resizeDir.includes('n')) newY = startPos.y + (startSize.h - MIN_H); }

        if (resizeDir.includes('e') && newX + newW > window.innerWidth) newW = window.innerWidth - newX;
        if (resizeDir.includes('s') && newY + newH > window.innerHeight) newH = window.innerHeight - newY;
        if (resizeDir.includes('w') && newX < 0) { newX = 0; newW = startPos.x + startSize.w; }
        if (resizeDir.includes('n') && newY < 0) { newY = 0; newH = startPos.y + startSize.h; }

        setSize({ w: newW, h: newH });
        if (resizeDir.includes('w') || resizeDir.includes('n')) setPos({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      dragInfo.current.mode = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen, size]); 

  const handleMouseDown = (e: React.MouseEvent, mode: 'MOVE' | 'RESIZE', dir: string | null = null) => {
    e.stopPropagation();
    dragInfo.current = {
      mode,
      resizeDir: dir,
      startX: e.clientX,
      startY: e.clientY,
      startPos: { ...pos },
      startSize: { ...size },
      hasMoved: false 
    };
  };

  const handleClickToggle = () => {
    if (dragInfo.current.hasMoved) return;
    const willOpen = !isOpen;
    if (willOpen) {
      let adjustX = pos.x;
      let adjustY = pos.y;
      if (pos.x + size.w > window.innerWidth) adjustX = window.innerWidth - size.w - 10;
      if (pos.y + size.h > window.innerHeight) adjustY = window.innerHeight - size.h - 10;
      setPos({ x: Math.max(0, adjustX), y: Math.max(0, adjustY) });
    }
    setIsOpen(willOpen);
  };

  if (!isInitialized.current) return null;

  return (
    <>
      {/* CASE A: ปุ่ม (Button Mode) */}
      {!isOpen && (
        <button 
          onMouseDown={(e) => handleMouseDown(e, 'MOVE')}
          onClick={handleClickToggle} 
          style={{ left: pos.x, top: pos.y, touchAction: 'none' }}
          className="fixed w-12 h-12 bg-black border-2 border-green-500 rounded-full z-50 text-green-500 font-bold shadow-lg hover:scale-110 active:scale-90 transition-transform cursor-move flex items-center justify-center animate-pop-in"
        >
          &gt;_
        </button>
      )}

      {/* CASE B: หน้าต่าง (Window Mode) */}
      {isOpen && (
        <div 
          onKeyDown={(e) => {
              if (['ArrowUp', 'ArrowDown'].includes(e.key)) e.stopPropagation();
            }}
          style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
          className="fixed bg-black/95 backdrop-blur border border-green-500 rounded-lg z-50 flex flex-col shadow-2xl animate-fade-in"
        >
          {/* Resize Handles */}
          <div className="absolute -top-2 -left-2 w-4 h-4 cursor-nw-resize z-20" onMouseDown={(e) => handleMouseDown(e, 'RESIZE', 'nw')} />
          <div className="absolute -top-2 -right-2 w-4 h-4 cursor-ne-resize z-20" onMouseDown={(e) => handleMouseDown(e, 'RESIZE', 'ne')} />
          <div className="absolute -bottom-2 -left-2 w-4 h-4 cursor-sw-resize z-20" onMouseDown={(e) => handleMouseDown(e, 'RESIZE', 'sw')} />
          <div className="absolute -bottom-2 -right-2 w-4 h-4 cursor-se-resize z-20" onMouseDown={(e) => handleMouseDown(e, 'RESIZE', 'se')} />
          
          <div className="absolute -top-1 left-2 right-2 h-2 cursor-n-resize z-10" onMouseDown={(e) => handleMouseDown(e, 'RESIZE', 'n')} />
          <div className="absolute -bottom-1 left-2 right-2 h-2 cursor-s-resize z-10" onMouseDown={(e) => handleMouseDown(e, 'RESIZE', 's')} />
          <div className="absolute top-2 bottom-2 -left-1 w-2 cursor-w-resize z-10" onMouseDown={(e) => handleMouseDown(e, 'RESIZE', 'w')} />
          <div className="absolute top-2 bottom-2 -right-1 w-2 cursor-e-resize z-10" onMouseDown={(e) => handleMouseDown(e, 'RESIZE', 'e')} />

          {/* Header */}
          <div 
            onMouseDown={(e) => handleMouseDown(e, 'MOVE')}
            onDoubleClick={() => setIsOpen(false)} // 👈 เพิ่มบรรทัดนี้ครับ: ดับเบิ้ลคลิกเพื่อปิด
            className="bg-green-900/30 p-2 cursor-move flex justify-between items-center border-b border-green-800 select-none"
          >
             <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`}></span>
              <span className="text-green-400 font-bold text-[10px] tracking-widest">TERMINAL {isPaused && "|| PAUSED"}</span>
            </div>
             <div className="flex gap-2" onMouseDown={(e) => e.stopPropagation()}> 
              <button onClick={() => setIsPaused(!isPaused)} className={`text-[9px] px-2 py-0.5 rounded border ${isPaused ? 'bg-yellow-600/20 border-yellow-500 text-yellow-500' : 'border-green-800 text-green-500'}`}>
                {isPaused ? 'RESUME' : 'PAUSE'}
              </button>
                <button onClick={onClear} className="text-[10px] text-green-600 hover:text-green-300 border border-green-800 px-1 rounded">CLR</button>
                <button onClick={() => setIsOpen(false)} className="text-[10px] text-red-500 hover:text-red-300 font-bold px-1">_</button>
             </div>
          </div>
          
          {/* Content */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-2 font-mono text-xs text-gray-300 scrollbar-thin scrollbar-thumb-green-700 scrollbar-track-transparent">
            {logs.length === 0 && <span className="opacity-30 italic">Waiting for data...</span>}
            {logs.map((l, i) => (
              <div key={i} className="break-words border-l-2 border-green-900 pl-2 mb-1">
                <span className="text-green-600 mr-1 text-[10px]">➜</span>
                {l}
              </div>
            ))}
          </div>

          <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-green-600/50 cursor-se-resize pointer-events-none"></div>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes pop-in { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-pop-in { animation: pop-in 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fade-in 0.1s ease-out; }
      `}</style>
    </>
  );
}