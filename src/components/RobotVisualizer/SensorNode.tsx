// components/RobotVisualizer/SensorNode.tsx
interface NodeProps {
  label: string;
  status: boolean | null; // null = No Signal, false = Normal, true = Triggered
  position: string;
}

export default function SensorNode({ label, status, position }: NodeProps) {
  const getStatusUI = () => {
    if (status === null) return { color: 'bg-gray-700', shadow: '', text: 'NO SIGNAL' };
    if (status === true) return { color: 'bg-red-500 animate-pulse', shadow: 'shadow-[0_0_12px_#ef4444]', text: 'TRIGGERED' };
    return { color: 'bg-green-500', shadow: 'shadow-[0_0_8px_#22c55e]', text: 'CONNECTED' };
  };

  const ui = getStatusUI();

  return (
    <div className={`absolute ${position} flex flex-col items-center group z-20`}>
      <div className={`w-3.5 h-3.5 rounded-full border border-black/50 transition-all duration-500 ${ui.color} ${ui.shadow}`} />
      <div className="absolute top-5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-[7px] text-white whitespace-nowrap pointer-events-none border border-white/10 shadow-xl">
        {label}: <span className={status === true ? 'text-red-400' : 'text-green-400'}>{ui.text}</span>
      </div>
    </div>
  );
}