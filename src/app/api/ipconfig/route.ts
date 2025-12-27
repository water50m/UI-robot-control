import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// กำหนด path ของไฟล์ที่จะบันทึก (server-config.json)
const configPath = path.join(process.cwd(), 'server-config.json');

// ✅ รองรับการดึงข้อมูล (GET)
export async function GET() {
  try {
    // เช็คว่ามีไฟล์ไหม
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf8');
      
      // ถ้ามีไฟล์แต่อ่านแล้วว่างเปล่า ก็ส่ง {} กลับไป
      if (!fileContent) {
         return NextResponse.json({}); 
      }
      
      return NextResponse.json(JSON.parse(fileContent));
    }
    
    // ถ้าไม่มีไฟล์เลย ก็ส่ง {} กลับไป (ให้หน้าบ้านใช้ default เอง)
    return NextResponse.json({});

  } catch (error) {
    console.error("Read Config Error:", error);
    // ถ้า Error ก็ส่ง {} ไปเช่นกัน
    return NextResponse.json({}, { status: 500 });
  }
}

// ✅ รองรับการบันทึกข้อมูล (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ip } = body;
    
    // บันทึกลงไฟล์
    fs.writeFileSync(configPath, JSON.stringify({ ip }));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save Config Error:", error);
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}