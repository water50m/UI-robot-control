// hooks/useRobotPath.ts
import { useState, useEffect } from 'react';
import { CLEAR_MAP_EVENT } from './mapEvents'; // import จากไฟล์ที่เพิ่งสร้าง

interface Point {
  x: number;
  y: number;
}

export const useRobotPath = (robotPose: { x: number, y: number } | null) => {
  const [pathHistory, setPathHistory] = useState<Point[]>([]);
  const [visitedCells, setVisitedCells] = useState<Set<string>>(new Set());

  // Config: ขนาด Grid ที่จะระบายสี (5 cm)
  const GRID_SIZE = 0.05; 

  useEffect(() => {
    if (!robotPose) return;

    const { x, y } = robotPose;

    // 1. บันทึก Path (เส้นเดิน)
    setPathHistory(prev => {
      const last = prev[prev.length - 1];
      // ถ้าห่างจากจุดเดิมเกิน 2cm ค่อยบันทึก (กันข้อมูลเยอะเกินความจำเป็น)
      if (!last || Math.hypot(x - last.x, y - last.y) > 0.02) {
        return [...prev, { x, y }];
      }
      return prev;
    });

    // 2. บันทึก Visited Cells (ระบายสีช่อง)
    const gridX = Math.floor(x / GRID_SIZE);
    const gridY = Math.floor(y / GRID_SIZE);
    const key = `${gridX},${gridY}`;

    setVisitedCells(prev => {
      if (prev.has(key)) return prev;
      const newSet = new Set(prev);
      newSet.add(key);
      return newSet;
    });

  }, [robotPose?.x, robotPose?.y]);

  const clearPath = () => {
    setPathHistory([]);
    setVisitedCells(new Set());
  };

  useEffect(() => {
    // เมื่อได้ยินคำสั่ง ให้เรียก clearPath
    const handleClearEvent = () => clearPath();

    // เริ่มดักฟัง
    window.addEventListener(CLEAR_MAP_EVENT, handleClearEvent);

    // เลิกดักฟังเมื่อ Component หายไป (Cleanup)
    return () => {
      window.removeEventListener(CLEAR_MAP_EVENT, handleClearEvent);
    };
  }, [clearPath]);

  return { pathHistory, visitedCells, clearPath };
};