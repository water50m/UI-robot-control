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

    async def disconnect_robot(self):
        self.robot_connection = None
        print("🤖 Robot Disconnected! (Alerting frontends...)")
        
        # 📢 ตะโกนบอกหน้าบ้านทุกเครื่องว่า "หุ่นไปแล้วนะ!"
        await self.broadcast_to_frontends({
            "type": "robot_disconnected",
            "bat": "null"
        })

    async def send_command_to_robot(self, command: dict):
        # ส่งคำสั่งเดิน/หยุด ไปหา ESP32
        if self.robot_connection:
            try:
                # แปลงเป็น JSON String ส่งไป
                await self.robot_connection.send_text(json.dumps(command))
            except Exception as e:
                print("⚠️ ส่งคำสั่งหาหุ่นยนต์ไม่สำเร็จ",e)

    # -----คำนวนตำแหน่ง ของ object ---------
    def process_lidar_data(self, data):
        # data คือ JSON ที่รับมาจาก ESP32 ซึ่งมีทั้ง lidar และ robot_pose
        
        # 1. ดึงข้อมูลดิบ
        dist = data['dist']
        angle_rad = np.radians(data['angle'])
        
        # 2. ดึงตำแหน่งรถ "ที่แนบมากับข้อมูลนี้" (จะไม่ใช้ self.robot_pose แล้ว)
        # เพราะ self.robot_pose อาจจะเปลี่ยนไปแล้วระหว่างส่งข้อมูล
        robot_x = data['robot_x']
        robot_y = data['robot_y']
        robot_yaw = data['robot_yaw'] 

        # 3. คำนวณ (เหมือนเดิม แต่แม่นยำขึ้น)
        # แปลงเป็น Local
        x_local = dist * np.cos(angle_rad)
        y_local = dist * np.sin(angle_rad)

        # แปลงเป็น Global (ใช้ yaw ที่แนบมา)
        x_global = (x_local * np.cos(robot_yaw) - y_local * np.sin(robot_yaw)) + robot_x
        y_global = (x_local * np.sin(robot_yaw) + y_local * np.cos(robot_yaw)) + robot_y

        # 4. อัปเดต Global Pose เผื่อไว้ใช้แสดงผลตัวรถเฉยๆ
        self.robot_pose = {"x": robot_x, "y": robot_y, "yaw": robot_yaw}

        return {
            "type": "map_update",
            "point": {"x": round(x_global), "y": round(y_global)},
            "robot_pose": self.robot_pose 
        }
    
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

@app.websocket("/ws/robot")
async def websocket_endpoint_robot(websocket: WebSocket):
    await manager.connect_robot(websocket)
    try:
        while True:
            try:
                # ⏰ จับเวลา 2 วินาที! ถ้าเกินเวลาจะกระโดดไปที่ except asyncio.TimeoutError
                raw_data = await asyncio.wait_for(websocket.receive_text(), timeout=2.0)
                
                # --- (ถ้าได้รับข้อมูลทันเวลา ก็ทำงานตามปกติ) ---
                data = json.loads(raw_data)
                
                if data.get("type") == "lidar":
                    processed = manager.process_lidar_data(data)
                    await manager.broadcast_to_frontends(processed)
                
                elif data.get("type") == "status":
                    await manager.broadcast_to_frontends(data)
                
                elif data.get("type") == "config":
                    await manager.broadcast_to_frontends(data)
                    
                else:
                    await manager.broadcast_to_frontends(data)

            except asyncio.TimeoutError:
                # 💥 ถ้าเงียบเกิน 2 วิ เข้าตรงนี้ทันที
                print("⏰ Robot Silent > 2s (Timeout)")
                await manager.disconnect_robot() # ตัดสายและแจ้งหน้าบ้าน
                break # ออกจาก Loop รอรับข้อมูล

    except WebSocketDisconnect:
        await manager.disconnect_robot()
    except Exception as e:
        print(f"Error: {e}")
        await manager.disconnect_robot()


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