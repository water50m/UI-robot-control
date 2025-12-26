// components/RobotVisualizer/Wheel.tsx
interface WheelProps {
  side: 'left' | 'right';
  speed: number;
}

export default function Wheel({ side, speed }: WheelProps) {
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
    <div className={`absolute ${side === 'left' ? '-left-6' : '-right-6'} top-1/2 -translate-y-1/2 w-8 h-16 bg-gray-800 border-2 border-green-500/50 rounded-md z-10 overflow-hidden shadow-lg`}>
      <div 
        style={style}
        className={`w-full h-[200%] flex flex-col justify-between items-center opacity-60 ${isMoving ? 'animate-wheel-spin' : ''}`}
      >
        {[...Array(12)].map((_, i) => (
          <div key={i} className="w-full h-[3px] bg-green-500 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
        ))}
      </div>
    </div>
  );
}