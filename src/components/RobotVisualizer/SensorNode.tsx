// components/RobotVisualizer/SensorNode.tsx
export default function SensorNode({ label, status, position }: { label: string, status: boolean | null, position: string }) {
  const getStatusColor = () => {
    if (status === null) return 'bg-gray-700 shadow-none opacity-50'; // ไม่มีสัญญาณ
    if (status === true) return 'bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse'; // Triggered
    return 'bg-green-500 shadow-[0_0_5px_#22c55e]'; // Normal
  };

  return (
    <div className={`absolute ${position} flex flex-col items-center group`}>
      <div className={`w-3 h-3 rounded-full border border-black/50 transition-all duration-300 ${getStatusColor()}`} />
      <span className="text-[8px] mt-1 text-gray-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}