interface Point {
  x: number;
  y: number;
}

// Logic วาด Grid แบบที่คุณชอบ (Loop 5000)
const drawGrid = (ctx: CanvasRenderingContext2D, scale: number) => {
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1 / scale;
  
  const gridSize = 5; 
  const limit = 5000; // ค่านี้ทำให้ลากไปไกลๆ แล้วเส้นไม่หาย

  ctx.beginPath();
  for (let i = -limit; i <= limit; i += gridSize) {
    ctx.moveTo(i, -limit); ctx.lineTo(i, limit);
    ctx.moveTo(-limit, i); ctx.lineTo(limit, i);
  }
  ctx.stroke();
};

// ฟังก์ชันหลักสำหรับวาดทุกอย่างลง Canvas
export const renderMapFrame = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  offset: { x: number; y: number },
  lidarPoints: Point[]
) => {
  // 1. Clear Screen
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  ctx.save();

  // 2. Transform (Pan & Zoom)
  ctx.translate(width / 2, height / 2);
  ctx.translate(offset.x, offset.y);
  ctx.scale(scale, scale);

  // 3. วาด Grid
  drawGrid(ctx, scale);

  // 4. วาดจุด Lidar
  ctx.fillStyle = '#10b981';
  for (const p of lidarPoints) {
    // กลับแกน Y (-p.y) ตามโค้ดต้นฉบับ
    ctx.fillRect(p.x, -p.y, 2, 2);
  }

  ctx.restore();
};
// ==============================================================================================================================================================================

interface TrailProps {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    scale: number;
    offset: { x: number, y: number };
    pathHistory: { x: number, y: number }[];
    visitedCells: Set<string>;
    pixelsPerMeter: number;
}

export const drawTrailLayer = ({
    ctx, width, height, scale, offset, pathHistory, visitedCells, 
    pixelsPerMeter
}: TrailProps) => {
    
    const UNIT = pixelsPerMeter;      
    const GRID_SIZE = 0.05; // 5 cm

    // Helper: แปลงพิกัด (ใช้สูตร "เดินหน้า = ขึ้นบน" แบบที่คุณใช้)
    const toScreen = (x_m: number, y_m: number) => {
        return {
            // สลับแกน: Y หุ่น -> X จอ
            x: (width / 2) + offset.x - (y_m * UNIT * scale), 
            // สลับแกน: X หุ่น -> Y จอ (กลับทิศ)
            y: (height / 2) + offset.y - (x_m * UNIT * scale) 
        };
    };

    // 1. วาดระบายสีช่อง (Visited Cells)
    ctx.fillStyle = 'rgba(0, 255, 0, 0.2)'; // สีเขียวจางๆ
    
    visitedCells.forEach(key => {
        const [gx, gy] = key.split(',').map(Number);
        const worldX = gx * GRID_SIZE;
        const worldY = gy * GRID_SIZE;

        // หาพิกัด 2 มุม เพื่อวาดสี่เหลี่ยม
        const p1 = toScreen(worldX, worldY);
        // เนื่องจากแกนกลับด้าน เราต้องคำนวณขนาด (Size) บนจอแยกต่างหาก
        // ขนาด 1 ช่อง Grid บนจอ = GRID_SIZE * UNIT * scale
        const cellSize = GRID_SIZE * UNIT * scale;

        // วาดจากจุด p1 โดยลบค่าบางส่วนออกเพื่อให้ตรงตำแหน่ง (เพราะแกนกลับทิศ)
        // เพื่อความชัวร์ ใช้ p1 เป็น Center หรือ Top-Left ก็ได้ แต่วิธีนี้ง่ายสุดสำหรับ Grid:
        // เนื่องจาก toScreen เราหมุนแกน การวาด rect ต้องระวังเรื่องทิศทาง
        // แนะนำให้วาดเป็น 1x1 pixel แล้ว scale เอา หรือคำนวณจุดมุมใหม่
        
        // วิธีที่แม่นยำที่สุดสำหรับแกนที่หมุนแล้ว:
        const p_start = toScreen(worldX, worldY);
        const p_end = toScreen(worldX + GRID_SIZE, worldY + GRID_SIZE);

        const rectX = Math.min(p_start.x, p_end.x);
        const rectY = Math.min(p_start.y, p_end.y);
        const rectW = Math.abs(p_start.x - p_end.x);
        const rectH = Math.abs(p_start.y - p_end.y);

        ctx.fillRect(rectX, rectY, rectW, rectH);
    });

    // 2. วาดเส้นทางเดิน (Path Line)
    if (pathHistory.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = '#00ff00'; // เส้นสีเขียวสด
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        const start = toScreen(pathHistory[0].x, pathHistory[0].y);
        ctx.moveTo(start.x, start.y);

        for (let i = 1; i < pathHistory.length; i++) {
            const p = toScreen(pathHistory[i].x, pathHistory[i].y);
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
    }
};