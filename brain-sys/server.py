# server.py
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import json

app = FastAPI()

class ConnectionManager:
    def __init__(self):
        self.frontend_sockets = []
        self.robot_socket = None

    # --- ส่วนของ Frontend ---
    async def connect_frontend(self, websocket: WebSocket):
        await websocket.accept()
        self.frontend_sockets.append(websocket)
        print("📱 Frontend Connected")

    def disconnect_frontend(self, websocket: WebSocket):
        self.frontend_sockets.remove(websocket)

    async def broadcast_to_frontends(self, message: dict):
        # ส่งข้อมูลไปหา UI ทุกจอ
        for ws in self.frontend_sockets:
            try:
                await ws.send_json(message)
            except:
                pass

    # --- ส่วนของ Robot ---
    async def connect_robot(self, websocket: WebSocket):
        await websocket.accept()
        self.robot_socket = websocket
        print("🤖 Robot Connected")

    def disconnect_robot(self):
        self.robot_socket = None
        print("🤖 Robot Disconnected")

    async def send_to_robot(self, message: dict):
        if self.robot_socket:
            await self.robot_socket.send_text(json.dumps(message))

manager = ConnectionManager()

# แก้ไขใน server.py ตรงฟังก์ชัน ws_client
@app.websocket("/ws/client")
async def ws_client(websocket: WebSocket):
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
                print(f"UI Command: {data}")
                
                # 3. ส่งต่อให้หุ่นยนต์
                await manager.send_to_robot(data)

            except json.JSONDecodeError:
                # ถ้าแปลงไม่ได้ ให้แค่แจ้งเตือน แต่ไม่ต้องหยุดโปรแกรม!
                print(f"⚠️ Warning: Received non-JSON data: '{raw_data}'")

    except WebSocketDisconnect:
        manager.disconnect_frontend(websocket)
    except Exception as e:
        print(f"❌ Error: {e}")
        manager.disconnect_frontend(websocket)

# Endpoint ให้ Robot เกาะ
@app.websocket("/ws/robot")
async def ws_robot(websocket: WebSocket):
    await manager.connect_robot(websocket)
    try:
        while True:
            # 1. Robot ส่งค่า Sensor มา
            data = await websocket.receive_text()
            json_data = json.loads(data)
            
            # 2. ส่งต่อให้ UI แสดงผล
            await manager.broadcast_to_frontends(json_data)
    except WebSocketDisconnect:
        manager.disconnect_robot()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)