// types/robot.d.ts
export interface SensorData {
  bat?: number;
  bump?: { l?: number; r?: number };
  cliff?: { fl?: number; fr?: number };
  fan?: number;
  log?: string;
  sys?: string;  // เผื่อไว้รับ config
  mode?: string;
  mL?: number;
  mR?: number;
}

// กำหนดทิศทางที่เป็นไปได้
export type Direction = 'F' | 'B' | 'L' | 'R' | 'FL' | 'FR' | 'BL' | 'BR' | 'S' | '' | null