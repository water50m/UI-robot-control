// types/robot.d.ts
export interface SensorData {
  type: string;
  bat: number | null;
  bump?: { l?: number; r?: number };
  cliff?: { fl?: number; fr?: number };
  fan?: number;
  log?: string; 
  mode?: string;
  mL?: number;
  mR?: number;
  name?: string;
  x?: number;
  y?: number;
  theta?: number;
  angle?: number;
  dist?: number;
  val?: string;
}

// กำหนดทิศทางที่เป็นไปได้
export type Direction = 'F' | 'B' | 'L' | 'R' | 'FL' | 'FR' | 'BL' | 'BR' | 'S' | '' | null