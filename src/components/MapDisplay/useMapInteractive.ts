import { useState } from 'react';

// 1. เปลี่ยนค่าเริ่มต้นตรงนี้ (จาก 0.5 เป็น 10)
// เหตุผล: เพื่อให้เปิดมาก็ซูมเห็นตารางชัดเลย
export const useMapInteractive = (initialScale = 100.0) => { 
  const [scale, setScale] = useState(initialScale);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  // จัดการการลากเมาส์ (Pan) - ส่วนนี้เหมือนเดิม
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  // จัดการการหมุนลูกกลิ้ง (Zoom)
  const handleWheel = (e: React.WheelEvent) => {
    const zoomSensitivity = 0.001;
    const newScale = scale - (e.deltaY * zoomSensitivity * scale);

    // 2. ขยายขอบเขตการซูม (Limit)
    // จากเดิม max 10 ให้เพิ่มเป็น 100 เพื่อให้ซูมเข้าไปดูระดับมดเดินได้เลย
    if (newScale > 0.5 && newScale < 100) {
      setScale(newScale);
    }
  };

  // ปุ่มรีเซ็ต
  const resetView = () => {
    // 3. อย่าลืมแก้ตรง Reset ให้กลับมาค่าเริ่มต้นใหม่ด้วย
    setScale(10.0); 
    setOffset({ x: 0, y: 0 });
  };

  return {
    scale, setScale,
    offset, setOffset,
    isDragging,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      onWheel: handleWheel
    },
    resetView
  };
};