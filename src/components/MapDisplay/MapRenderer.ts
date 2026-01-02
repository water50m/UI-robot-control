// utils/mapRenderer.ts

interface Point {
  x: number;
  y: number;
}

interface RenderParams {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  scale: number;
  offset: { x: number; y: number };
  lidarPoints: Point[];
  currentPose: { x: number, y: number, yaw: number }
}

// ฟังก์ชันวาด Grid (ย้ายมาจาก Component เดิม)
const drawGrid = (ctx: CanvasRenderingContext2D, scale: number) => {
  ctx.strokeStyle = '#1e293b'; // สีเส้น Grid
  ctx.lineWidth = 1 / scale;    // ปรับความหนาเส้นตาม Zoom ไม่ให้หนาขึ้น
  
  const gridSize = 0.05; // ขนาดช่อง Grid (0.5 เมตร)
  const limit = 100;    // วาดกว้างแค่ไหน (เมตร)

  ctx.beginPath();
  for (let i = -limit; i <= limit; i += gridSize) {
    // เส้นตั้ง
    ctx.moveTo(i, -limit); 
    ctx.lineTo(i, limit);
    // เส้นนอน
    ctx.moveTo(-limit, i); 
    ctx.lineTo(limit, i);
  }
  ctx.stroke();
  
  // วาดแกน X, Y สีเด่นๆ
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2 / scale;
  ctx.beginPath();
  ctx.moveTo(-limit, 0); ctx.lineTo(limit, 0); // แกน X
  ctx.moveTo(0, -limit); ctx.lineTo(0, limit); // แกน Y
  ctx.stroke();
};

// ฟังก์ชันหลักที่ Component จะเรียกใช้
export const renderMap = ({ ctx, width, height, scale, offset, lidarPoints, currentPose }: RenderParams) => {
  // 1. Clear พื้นหลัง
  const robotSize = 0.30; // 30 cm
  ctx.fillStyle = '#0f172a'; // Dark Slate background
  ctx.fillRect(
  currentPose.x - robotSize/2,  // จุดเริ่ม X (ขยับซ้าย)
  currentPose.y - robotSize/2,  // จุดเริ่ม Y (ขยับขึ้น)
  robotSize,                    // ความกว้าง
  robotSize                     // ความสูง
);

  ctx.save();

  // 2. จัดการ Transform (Pan & Zoom)
  // ย้ายจุด (0,0) มากลางจอ
  ctx.translate(width / 2, height / 2);
  // เลื่อนตามการลากเมาส์
  ctx.translate(offset.x, offset.y);
  // ขยายตาม Zoom (และกลับด้านแกน Y ให้เหมือนแผนที่จริง)
  ctx.scale(scale, scale); 
  ctx.scale(1, -1); // กลับแกน Y ขึ้นบน

  // 3. วาด Grid
  drawGrid(ctx, scale);

  // 4. วาดจุด Lidar
  ctx.fillStyle = '#10b981'; // Emerald 500
  // วาดทีละจุด (Optimization: ถ้าจุดเยอะมาก ควรใช้ Path หรือ ImageBitmap ในอนาคต)
  for (const p of lidarPoints) {
    // วาดจุดขนาดคงที่ (เช่น 5cm) หรือปรับตาม scale
    const pointSize = 0.05; 
    ctx.fillRect(p.x - pointSize/2, p.y - pointSize/2, pointSize, pointSize);
  }

  // (Optional) วาดจุดกำเนิด (0,0)
  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.arc(0, 0, 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};