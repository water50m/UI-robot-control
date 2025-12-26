interface BumperProps {
  statusL: boolean | null;
  statusR: boolean | null;
}

export default function Bumper({ statusL, statusR }: BumperProps) {
  // Helper สี (เหมือนเดิม)
  const getStatusColor = (status: boolean | null) => {
    if (status === true) return "text-red-400 font-bold animate-pulse";
    if (status === null) return "text-gray-500";
    return "text-green-400";
  };

  const getStatusText = (status: boolean | null) => {
    if (status === true) return "HIT!";
    if (status === null) return "N/A";
    return "OK";
  };

  const getStrokeColor = (status: boolean | null, isHit: boolean) => {
    if (isHit) return "#ef4444"; 
    return "#4b5563"; 
  };

  return (
    <svg 
      className="absolute inset-0 w-full h-full z-20 overflow-visible pointer-events-none" 
      viewBox="0 0 100 100"
    >
      <defs>
        <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* === LEFT BUMPER === */}
      <g className="group pointer-events-auto cursor-help">
        {/* Hit Area (Invisible) */}
        <path
          d="M 49.5 2 A 48 48 0 0 0 2 50" 
          fill="none"
          stroke="transparent"
          strokeWidth="10"
        />
        {/* Visual Stroke (เส้นคม ปลายตัด ขยายชิดขอบ) */}
        <path
          d="M 49.5 2 A 48 48 0 0 0 2 50" 
          fill="none"
          stroke={getStrokeColor(statusL, statusL === true)}
          strokeWidth="4" 
          strokeLinecap="butt" 
          className={`transition-all duration-300 ease-out group-hover:stroke-gray-400 ${statusL === true ? 'filter-glow' : ''}`}
          style={{ filter: statusL === true ? 'url(#glow-red)' : 'none' }}
        />
        
        {/* Tooltip Left (Compact Size) */}
        <foreignObject x="-35" y="-10" width="60" height="30" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="flex flex-col items-end justify-center h-full pr-1">
             <div className="bg-black/90 backdrop-blur border border-gray-600 px-1.5 py-0.5 rounded text-[6px] shadow-xl whitespace-nowrap">
                <span className="font-bold text-gray-400 mr-1">L:</span>
                <span className={getStatusColor(statusL)}>{getStatusText(statusL)}</span>
             </div>
             {/* เส้นชี้เล็กๆ */}
             <div className="w-[1px] h-3 bg-gray-500 mr-2 opacity-50"></div>
          </div>
        </foreignObject>
      </g>


      {/* === RIGHT BUMPER === */}
      <g className="group pointer-events-auto cursor-help">
        {/* Hit Area */}
        <path
          d="M 50.5 2 A 48 48 0 0 1 98 50" 
          fill="none"
          stroke="transparent"
          strokeWidth="10"
        />
        {/* Visual Stroke */}
        <path
          d="M 50.5 2 A 48 48 0 0 1 98 50" 
          fill="none"
          stroke={getStrokeColor(statusR, statusR === true)}
          strokeWidth="4" 
          strokeLinecap="butt"
          className={`transition-all duration-300 ease-out group-hover:stroke-gray-400 ${statusR === true ? 'filter-glow' : ''}`}
          style={{ filter: statusR === true ? 'url(#glow-red)' : 'none' }}
        />

        {/* Tooltip Right (Compact Size) */}
        <foreignObject x="75" y="-10" width="60" height="30" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
           <div className="flex flex-col items-start justify-center h-full pl-1">
             <div className="bg-black/90 backdrop-blur border border-gray-600 px-1.5 py-0.5 rounded text-[6px] shadow-xl whitespace-nowrap text-right">
                <span className="font-bold text-gray-400 mr-1">R:</span>
                <span className={getStatusColor(statusR)}>{getStatusText(statusR)}</span>
             </div>
             {/* เส้นชี้เล็กๆ */}
             <div className="w-[1px] h-3 bg-gray-500 ml-2 opacity-50"></div>
          </div>
        </foreignObject>
      </g>
      
      {/* Decorative Gap Marker (ขีดกลางเล็กๆ สีเข้ม) */}
      <line x1="50" y1="0" x2="50" y2="4" stroke="#000" strokeWidth="1" />

    </svg>
  );
}