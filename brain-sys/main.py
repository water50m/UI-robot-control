import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import List, Optional
import numpy as np

app = FastAPI()

# ==========================================
# 1. Connection Manager (คนจัดการสาย)
# ==========================================
class ConnectionManager:
    def __init__(self):
        # เก็บรายการหน้าจอที่เปิดดูอยู่ (อาจมีหลายจอ เช่น มือถือ + คอม)
        self.frontend_connections: List[WebSocket] = []
        # เก็บ WebSocket ของหุ่นยนต์ (ควรมีตัวเดียว)
        self.robot_connection: Optional[WebSocket] = None

    # --- สำหรับ Frontend (Next.js) ---
    async def connect_frontend(self, websocket: WebSocket):
        await websocket.accept()
        self.frontend_connections.append(websocket)
        print("📱 Frontend Connected")

    def disconnect_frontend(self, websocket: WebSocket):
        if websocket in self.frontend_connections:
            self.frontend_connections.remove(websocket)
            print("📱 Frontend Disconnected")

    async def broadcast_to_frontends(self, message: dict):
        # ส่งข้อมูลไปทุกหน้าจอที่เปิดอยู่
        for connection in self.frontend_connections:
            try:
                await connection.send_json(message)
            except:
                pass

    # --- สำหรับ Robot (ESP32) ---
    async def connect_robot(self, websocket: WebSocket):
        await websocket.accept()
        self.robot_connection = websocket
        print("🤖 Robot Connected!")

    def disconnect_robot(self):
        self.robot_connection = None
        print("🤖 Robot Disconnected!")

    async def send_command_to_robot(self, command: dict):
        # ส่งคำสั่งเดิน/หยุด ไปหา ESP32
        if self.robot_connection:
            try:
                # แปลงเป็น JSON String ส่งไป
                await self.robot_connection.send_text(json.dumps(command))
            except Exception as e:
                print("⚠️ ส่งคำสั่งหาหุ่นยนต์ไม่สำเร็จ",e)

manager = ConnectionManager()

# ==========================================
# 2. SLAM Logic Zone (พื้นที่คำนวณแมพ)
# ==========================================
# ตรงนี้คือที่ที่คุณจะใส่สูตรคณิตศาสตร์ในอนาคต
def process_lidar_data(data):
    # data ที่รับมา: {'type': 'lidar', 'angle': 60, 'dist': 150}
    
    # ตัวอย่าง: แปลง Polar (องศา,ระยะ) เป็น XY (พิกัด)
    angle_rad = np.radians(data['angle'])
    distance = data['dist']
    
    x = distance * np.cos(angle_rad)
    y = distance * np.sin(angle_rad)
    
    # ส่งค่า XY ที่คำนวณแล้วกลับไปให้ Frontend วาด
    return {
        "type": "map_update",
        "point": {"x": x, "y": y},
        "raw_angle": data['angle']
    }

# ==========================================
# 3. Endpoints (ช่องทางเชื่อมต่อ)
# ==========================================

# ช่องทางสำหรับ ESP32 เข้ามาเกาะ: ws://IP_PC:8000/ws/robot
@app.websocket("/ws/robot")
async def websocket_endpoint_robot(websocket: WebSocket):
    await manager.connect_robot(websocket)
    try:
        while True:
            raw_data = await websocket.receive_text()
            data = json.loads(raw_data)
            
            # กรณี 1: ข้อมูล Lidar (ต้องคำนวณ) 🧮
            if data.get("type") == "lidar":
                processed = process_lidar_data(data) # คำนวณ XY
                await manager.broadcast_to_frontends(processed)
            
            if data.get("type") == "status":
                await manager.broadcast_to_frontends(data)
            
            if data.get("type") == "config":
                await manager.broadcast_to_frontends(data)
            # กรณี 2: ข้อมูลทั่วไป (ไม่ต้องคำนวณ) 🚀
            # เช่น แบตเตอรี่, ข้อความ Log, สถานะการเชื่อมต่อ
            else:
                # ส่งต่อ (Forward) ไปให้หน้าจอเลยทันที!
                await manager.broadcast_to_frontends(data)

    except WebSocketDisconnect:
        manager.disconnect_robot()


# ช่องทางสำหรับ Next.js เข้ามาเกาะ: ws://IP_PC:8000/ws/client
@app.websocket("/ws/client")
async def websocket_endpoint_client(websocket: WebSocket):
    await manager.connect_frontend(websocket)
    try:
        while True:
             # 1. เปลี่ยนจาก receive_json เป็น receive_text (เพื่อดูข้อมูลดิบก่อน)
            raw_data = await websocket.receive_text()
            
            # เช็คว่าว่างไหม? ถ้าว่างให้ข้าม
            if not raw_data:
                continue

            try:
                # 2. ลองแปลงเป็น JSON
                data = json.loads(raw_data)
                
                # 3. ส่งต่อให้หุ่นยนต์
                await manager.send_command_to_robot(data)

            except json.JSONDecodeError:
                # ถ้าแปลงไม่ได้ ให้แค่แจ้งเตือน แต่ไม่ต้องหยุดโปรแกรม!
                print(f"⚠️ Warning: Received non-JSON data: '{raw_data}'")
                
    except WebSocketDisconnect:
        manager.disconnect_frontend()