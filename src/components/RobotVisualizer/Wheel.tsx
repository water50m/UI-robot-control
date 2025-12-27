interface WheelProps {
  side: 'left' | 'right';
  speed: number;
  isFloating?: boolean; // 👈 1. เพิ่ม Prop รับสถานะล้อลอย
}

export default function Wheel({ side, speed, isFloating = false }: WheelProps) {
  const isMoving = speed !== 0;
  
  // คำนวณความเร็วแอนิเมชัน (Seamless Logic)
  const getSpinDuration = (val: number) => {
    if (val === 0) return '0s';
    const duration = Math.abs(255 / val) * 0.5;
    return `${Math.max(duration, 0.05)}s`;
  };

  const style = {
    animationDuration: getSpinDuration(speed),
    animationDirection: speed < 0 ? 'reverse' : 'normal' as any,
    animationPlayState: isMoving ? 'running' : 'paused' as any,
    transition: 'animation-duration 0.3s ease-out',
  };

  return (
    <div 
      className={`absolute ${side === 'left' ? '-left-6' : '-right-6'} top-1/2 -translate-y-1/2 w-8 h-16 bg-gray-800 border-2 rounded-md z-10 overflow-hidden shadow-lg transition-all duration-300
      ${isFloating 
        ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' // 🔴 ล้อลอย: ขอบแดง + Glow แดง
        : 'border-green-500/50' // 🟢 ปกติ: ขอบเขียว
      }`}
    >
      <div 
        style={style}
        className={`w-full h-[200%] flex flex-col justify-between items-center opacity-60 ${isMoving ? 'animate-wheel-spin' : ''}`}
      >
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className={`w-full h-[3px] shrink-0 transition-colors duration-300 
              ${isFloating 
                ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' // 🔴 เส้นแดง
                : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' // 🟢 เส้นเขียว
              }`} 
          />
        ))}
      </div>
    </div>
  );
}