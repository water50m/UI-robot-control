interface RadarProps {
  statusL2: boolean | null; // ซ้ายนอก
  statusL1: boolean | null; // ซ้ายใน
  statusR1: boolean | null; // ขวาใน
  statusR2: boolean | null; // ขวานอก
  statusBR: boolean | null;
  statusBL: boolean | null;
}

export default function Radar({ statusL2, statusL1, statusR1, statusR2, statusBR, statusBL }: RadarProps) {
  
  const getStrokeColor = (status: boolean | null) => {
    if (status === true) return "#ef4444";  // RED
    if (status === null) return "#f59e0b";  // ORANGE
    return "#22c55e";                       // GREEN
  };

  const getOpacity = (status: boolean | null) => {
    if (status === true) return 1;
    if (status === null) return 0.5;
    return 0.1;
  };

  const renderZone = (status: boolean | null, rotation: number) => {
    const color = getStrokeColor(status);
    const opacity = getOpacity(status);
    const isActive = status === true;

    return (
      <g 
        style={{ 
          opacity, 
          transition: 'all 0.3s ease',
          transform: `rotate(${rotation}deg)`,
          transformOrigin: '50% 50%'
        }}
      >
         <defs>
            <filter id={`glow-${color.replace('#','')}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
         </defs>

        {/* Wave 1 (Inner) - ขยับเข้าใกล้รถมากขึ้น (r="56") */}
        <circle 
            cx="50" cy="50" r="46" 
          fill="none" 
          stroke={color} 
          strokeWidth="3" 
          strokeLinecap="round"
          strokeDasharray="35 350" // ปรับความยาวเส้นให้สั้นลงนิดนึงเพื่อให้ดูคมขึ้น (ยาว 25)
          strokeDashoffset="12.5"  // กึ่งกลางของ 25
          transform="rotate(-90 50 50)" 
          style={{ filter: isActive ? `url(#glow-${color.replace('#','')})` : 'none' }}
        />
        
        {/* Wave 2 (Outer) - ขยับตามเข้ามา (r="64") */}
        <circle 
          cx="50" cy="50" r="54" 
          fill="none" 
          stroke={color} 
          strokeWidth="2" 
          strokeLinecap="round"
          strokeDasharray="45 400" // เส้นยาว 35
          strokeDashoffset="17.5"
          transform="rotate(-90 50 50)"
          opacity="0.6"
        />
      </g>
    );
  };

  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" 
      viewBox="0 0 100 100"
    >
      {/* ปรับองศาเล็กน้อยให้ 4 อันเรียงชิดกันสวยๆ */}
      {renderZone(statusL2, -70)} {/* ซ้ายนอก */}
      {renderZone(statusL1, -35)} {/* ซ้ายใน */}
      {renderZone(statusR1, 6)}  {/* ขวาใน */}
      {renderZone(statusR2, 42)}  {/* ขวานอก */}
      {renderZone(statusBR, 122)}  {/* หลังขวา */}
      {renderZone(statusBL, -152)}  {/* หลังขวา */}
    </svg>
  );
}